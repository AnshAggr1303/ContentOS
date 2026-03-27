import EventEmitter from 'events'
import { runDrafter } from '../agents/drafter'
import { runCompliance } from '../agents/compliance'
import { runLocalizer } from '../agents/localizer'
import { runDistributor } from '../agents/distributor'
import { writeJobStatus } from './db'
import type { PipelineJob, Channel, Language, ChannelOutputMap } from './types'

const GATE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

// ─── Public event emitter ────────────────────────────────────────────────────
// Consumers (e.g. SSE route) attach listeners to get real-time progress.
export const pipelineEmitter = new EventEmitter()

// ─── Gate approval types ─────────────────────────────────────────────────────
export interface Gate1Approval {
  approved: boolean
  selectedHeadline: string
  editedDraft: string
}

export interface Gate2Approval {
  approved: boolean
  selectedChannels: Channel[]
}

// ─── In-memory stores ─────────────────────────────────────────────────────────
const jobStore = new Map<string, PipelineJob>()
const gate1Resolvers = new Map<string, (approval: Gate1Approval) => void>()
const gate2Resolvers = new Map<string, (approval: Gate2Approval) => void>()

// ─── Helpers ──────────────────────────────────────────────────────────────────
function updateStatus(job: PipelineJob, status: PipelineJob['status']): void {
  job.status = status
  job.updatedAt = new Date()
  jobStore.set(job.id, job)
  writeJobStatus(job.id, status)
}

function waitForGate<T>(resolverMap: Map<string, (v: T) => void>, jobId: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      resolverMap.delete(jobId)
      writeJobStatus(jobId, 'failed')
      reject(new Error(`Gate timeout for job ${jobId} after ${GATE_TIMEOUT_MS / 1000}s`))
    }, GATE_TIMEOUT_MS)

    resolverMap.set(jobId, (value: T) => {
      clearTimeout(timer)
      resolve(value)
    })
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getJob(jobId: string): PipelineJob | undefined {
  return jobStore.get(jobId)
}

/**
 * Start the full pipeline for a job. Runs asynchronously — callers should
 * listen to pipelineEmitter for progress updates rather than awaiting this.
 */
export async function startPipeline(job: PipelineJob): Promise<void> {
  jobStore.set(job.id, job)

  try {
    // ── A1: Drafter ──────────────────────────────────────────────────────────
    updateStatus(job, 'running_a1')
    pipelineEmitter.emit('agent_start', {
      agent: 'drafter',
      model: 'llama-3.3-70b-versatile',
      jobId: job.id,
    })

    const drafterResult = await runDrafter({
      rawInput: job.input,
      contentType: job.contentType,
      wordCount: job.wordCount,
      jobId: job.id,
    })

    job.draft = drafterResult.draft
    job.headlines = drafterResult.headlines

    pipelineEmitter.emit('agent_complete', {
      agent: 'drafter',
      jobId: job.id,
      output_preview: drafterResult.draft.slice(0, 100),
    })

    // ── Gate 1 ───────────────────────────────────────────────────────────────
    updateStatus(job, 'awaiting_gate_1')
    pipelineEmitter.emit('gate_1', {
      jobId: job.id,
      draft: job.draft,
      headlines: job.headlines,
      metaDescription: drafterResult.metaDescription,
      tags: drafterResult.tags,
      readTime: drafterResult.readTime,
    })

    const gate1 = await waitForGate<Gate1Approval>(gate1Resolvers, job.id)

    if (!gate1.approved) {
      updateStatus(job, 'failed')
      pipelineEmitter.emit('pipeline_rejected', { jobId: job.id, gate: 1 })
      return
    }

    job.selectedHeadline = gate1.selectedHeadline
    job.draft = gate1.editedDraft

    // ── A2: Compliance ───────────────────────────────────────────────────────
    updateStatus(job, 'running_a2')
    pipelineEmitter.emit('agent_start', {
      agent: 'compliance',
      model: 'llama-3.3-70b-versatile',
      jobId: job.id,
    })

    const complianceResult = await runCompliance({
      draft: job.draft,
      headline: job.selectedHeadline,
      jobId: job.id,
    })

    job.complianceResult = complianceResult

    for (const flag of complianceResult.flags) {
      pipelineEmitter.emit('compliance_flag', { jobId: job.id, ...flag })
    }

    pipelineEmitter.emit('agent_complete', {
      agent: 'compliance',
      jobId: job.id,
      output_preview: `${complianceResult.status} | ${complianceResult.flags.length} flags`,
    })

    // ── A3: Localizer (parallel Promise.all inside runLocalizer) ─────────────
    updateStatus(job, 'running_a3')
    pipelineEmitter.emit('agent_start', {
      agent: 'localizer',
      model: 'auto',
      jobId: job.id,
    })

    const localizations = await runLocalizer({
      draft: job.draft,
      headline: job.selectedHeadline,
      languages: job.selectedLanguages as Language[],
      jobId: job.id,
    })

    job.localizations = localizations as Record<Language, string>

    pipelineEmitter.emit('agent_complete', {
      agent: 'localizer',
      jobId: job.id,
      output_preview: `Localized to: ${job.selectedLanguages.join(', ')}`,
    })

    // ── A4: Distributor ──────────────────────────────────────────────────────
    updateStatus(job, 'running_a4')
    pipelineEmitter.emit('agent_start', {
      agent: 'distributor',
      model: 'llama-3.3-70b-versatile',
      jobId: job.id,
    })

    const channelOutputs = await runDistributor({
      draft: job.draft,
      headline: job.selectedHeadline,
      channels: job.selectedChannels as Channel[],
      jobId: job.id,
    })

    job.channelOutputs = channelOutputs as Partial<ChannelOutputMap>

    pipelineEmitter.emit('agent_complete', {
      agent: 'distributor',
      jobId: job.id,
      output_preview: `Channels: ${job.selectedChannels.join(', ')}`,
    })

    // ── Gate 2 ───────────────────────────────────────────────────────────────
    updateStatus(job, 'awaiting_gate_2')
    pipelineEmitter.emit('gate_2', {
      jobId: job.id,
      channels: channelOutputs,
      localizations,
      complianceResult,
    })

    const gate2 = await waitForGate<Gate2Approval>(gate2Resolvers, job.id)

    if (!gate2.approved) {
      updateStatus(job, 'failed')
      pipelineEmitter.emit('pipeline_rejected', { jobId: job.id, gate: 2 })
      return
    }

    // ── Complete ─────────────────────────────────────────────────────────────
    updateStatus(job, 'complete')
    pipelineEmitter.emit('complete', {
      job_id: job.id,
      selected_channels: gate2.selectedChannels,
      total_duration_ms: new Date().getTime() - job.createdAt.getTime(),
    })
  } catch (err) {
    updateStatus(job, 'failed')
    pipelineEmitter.emit('pipeline_error', { jobId: job.id, error: err })
    throw err
  }
}

export function resumeGate1(jobId: string, approval: Gate1Approval): void {
  const resolve = gate1Resolvers.get(jobId)
  if (!resolve) throw new Error(`No pending Gate 1 for job ${jobId}`)
  gate1Resolvers.delete(jobId)
  resolve(approval)
}

export function resumeGate2(jobId: string, approval: Gate2Approval): void {
  const resolve = gate2Resolvers.get(jobId)
  if (!resolve) throw new Error(`No pending Gate 2 for job ${jobId}`)
  gate2Resolvers.delete(jobId)
  resolve(approval)
}
