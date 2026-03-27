import { NextRequest, NextResponse } from 'next/server'
import { resumeGate1, resumeGate2 } from '../../../lib/pipeline'
import type { Channel } from '../../../lib/types'

interface ApproveRequestBody {
  jobId: string
  gate: 1 | 2
  approved: boolean
  selectedHeadline?: string
  editedDraft?: string
  selectedChannels?: Channel[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ApproveRequestBody
  try {
    body = await req.json() as ApproveRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { jobId, gate, approved, selectedHeadline, editedDraft, selectedChannels } = body

  if (!jobId || gate !== 1 && gate !== 2) {
    return NextResponse.json({ error: 'Missing required fields: jobId, gate (1 or 2)' }, { status: 400 })
  }

  try {
    if (gate === 1) {
      resumeGate1(jobId, {
        approved,
        selectedHeadline: selectedHeadline ?? '',
        editedDraft: editedDraft ?? '',
      })
    } else {
      resumeGate2(jobId, {
        approved,
        selectedChannels: selectedChannels ?? [],
      })
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
