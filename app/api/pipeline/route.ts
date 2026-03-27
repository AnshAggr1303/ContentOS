import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited } from '../../../lib/rate-limit'
import { startPipeline } from '../../../lib/pipeline'
import { writeJobStatus } from '../../../lib/db'
import type { ContentType, Language, Channel } from '../../../lib/types'

interface PipelineRequestBody {
  input: string
  contentType: ContentType
  selectedLanguages: Language[]
  selectedChannels: Channel[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Max 2 per 30 seconds.' }, { status: 429 })
  }

  let body: PipelineRequestBody
  try {
    body = await req.json() as PipelineRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { input, contentType, selectedLanguages, selectedChannels } = body

  if (!input || !contentType || !selectedLanguages?.length || !selectedChannels?.length) {
    return NextResponse.json({ error: 'Missing required fields: input, contentType, selectedLanguages, selectedChannels' }, { status: 400 })
  }

  const jobId = crypto.randomUUID()
  const now = new Date()

  writeJobStatus(jobId, 'running_a1')

  // Fire and forget — do NOT await
  void startPipeline({
    id: jobId,
    status: 'running_a1',
    input,
    contentType,
    selectedLanguages,
    selectedChannels,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ jobId }, { status: 200 })
}
