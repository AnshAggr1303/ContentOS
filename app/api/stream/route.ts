// NOTE: Requires single-process deployment (next start). EventEmitter does not
// work across Vercel serverless functions.

import { NextRequest } from 'next/server'
import { pipelineEmitter } from '../../../lib/pipeline'

const SSE_EVENTS = [
  'agent_start',
  'agent_complete',
  'gate_1',
  'compliance_flag',
  'gate_2',
  'complete',
  'pipeline_error',
  'pipeline_rejected',
] as const

export async function GET(req: NextRequest): Promise<Response> {
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return new Response('Missing jobId query parameter', { status: 400 })
  }

  const stream = new ReadableStream({
    start(controller) {
      function send(event: string, data: object): void {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(new TextEncoder().encode(chunk))
      }

      const handlers: Array<{ event: string; fn: (data: Record<string, unknown>) => void }> = []

      for (const event of SSE_EVENTS) {
        const fn = (data: Record<string, unknown>) => {
          if (data.jobId !== jobId && data.job_id !== jobId) return
          send(event, data)

          if (event === 'complete' || event === 'pipeline_error' || event === 'pipeline_rejected') {
            cleanup()
          }
        }
        handlers.push({ event, fn })
        pipelineEmitter.on(event, fn)
      }

      function cleanup(): void {
        for (const { event, fn } of handlers) {
          pipelineEmitter.off(event, fn)
        }
        try {
          controller.close()
        } catch {
          // already closed
        }
      }

      // Clean up on client disconnect
      req.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
