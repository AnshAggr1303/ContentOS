import crypto from 'crypto'
import type { ChatCompletion } from 'groq-sdk/resources/chat/completions'
import { callGroq } from '../lib/groq-client'
import { writeAuditEntry } from '../lib/db'
import type { ContentType } from '../lib/types'

const MODEL = 'llama-3.3-70b-versatile'

export interface DrafterInput {
  rawInput: string
  contentType: ContentType
  wordCount: number
  jobId: string
}

export interface DrafterOutput {
  draft: string
  headlines: [string, string, string]
  metaDescription: string
  tags: string[]
  readTime: number
}

const SYSTEM_PROMPT = `You are a senior journalist at Economic Times, India's leading financial newspaper.
Write in direct, data-backed style. Active voice only. No fluff. No passive constructions.
Every claim must be supported by data or attributed to a named source.
ET style: Lead with the most important fact. Use specific numbers. Name companies and people directly.
Article structure: punchy lede, data-dense body, clear conclusion.

Respond ONLY with valid JSON — no markdown, no code fences — in this exact format:
{
  "draft": "full article text",
  "headlines": ["headline variant 1", "headline variant 2", "headline variant 3"],
  "metaDescription": "SEO meta description under 160 characters",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "readTime": 4
}`

export async function runDrafter(input: DrafterInput): Promise<DrafterOutput> {
  const start = Date.now()

  const userMessage = `Content Type: ${input.contentType}
Target Word Count: ${input.wordCount}

Raw Input:
${input.rawInput}

Write the article now. Return only JSON.`

  const raw = await callGroq({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  if (!raw) throw new Error('Drafter: No response from Groq')
  const response = raw as ChatCompletion

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Drafter: Empty response content')

  let parsed: DrafterOutput
  try {
    parsed = JSON.parse(content) as DrafterOutput
  } catch (err) {
    throw new Error(`Drafter: Failed to parse JSON response — ${(err as Error).message}. Raw: ${content.slice(0, 200)}`)
  }

  const durationMs = Date.now() - start
  const inputHash = crypto.createHash('sha256').update(input.rawInput).digest('hex').slice(0, 16)

  writeAuditEntry({
    jobId: input.jobId,
    agentName: 'drafter',
    modelUsed: MODEL,
    inputHash,
    outputSummary: parsed.draft.slice(0, 200),
    flags: [],
    decision: 'DRAFT_GENERATED',
    durationMs,
  })

  return parsed
}
