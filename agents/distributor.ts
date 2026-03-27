import crypto from 'crypto'
import type { ChatCompletion } from 'groq-sdk/resources/chat/completions'
import { callGroq } from '../lib/groq-client'
import { writeAuditEntry } from '../lib/db'
import type {
  Channel,
  ChannelOutputMap,
  EtWebOutput,
  EtAppOutput,
  WhatsAppOutput,
  LinkedInOutput,
  NewsletterOutput,
} from '../lib/types'

export type { ChannelOutputMap, EtWebOutput, EtAppOutput, WhatsAppOutput, LinkedInOutput, NewsletterOutput }

const MODEL = 'llama-3.3-70b-versatile'

export interface DistributorInput {
  draft: string
  headline: string
  channels: Channel[]
  jobId: string
}

const CHANNEL_FORMAT_INSTRUCTIONS: Record<Channel, string> = {
  et_web:
    '"et_web": { "headline": "SEO-optimized headline (50-70 chars)", "body": "Full article text", "tags": ["tag1", "tag2", "tag3"] }',
  et_app:
    '"et_app": { "push_title": "Push notification title under 60 chars", "card_preview": "App card preview under 120 chars" }',
  whatsapp:
    '"whatsapp": { "text": "3 lines max, plain text, no markdown, no asterisks, no bullet points" }',
  linkedin:
    '"linkedin": { "hook": "Attention-grabbing first line for LinkedIn feed", "body": "Professional narrative 3-4 sentences for business audience", "cta": "Clear call to action" }',
  newsletter:
    '"newsletter": { "subject": "Email subject line under 60 chars", "preview_text": "Preview/pre-header text under 90 chars" }',
}

export async function runDistributor(
  input: DistributorInput,
): Promise<Partial<ChannelOutputMap>> {
  const start = Date.now()

  const channelFormatBlock = input.channels
    .map((ch) => CHANNEL_FORMAT_INSTRUCTIONS[ch])
    .join(',\n  ')

  const systemPrompt = `You are a content distribution specialist for Economic Times.
Format the provided article for each requested channel according to its requirements:
- et_web: Full article, SEO-optimized headline, relevant tags
- et_app: Ultra-short push notification title + app card preview
- whatsapp: Plain text only, 3 lines maximum, no formatting characters
- linkedin: Professional hook + narrative body + call to action
- newsletter: Subject line + preview text only

Respond ONLY with valid JSON — no markdown, no code fences — containing ONLY the requested channels:
{
  ${channelFormatBlock}
}`

  const raw = await callGroq({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Headline: ${input.headline}\n\n${input.draft}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  if (!raw) throw new Error('Distributor: No response from Groq')
  const response = raw as ChatCompletion

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Distributor: Empty response content')

  let outputs: Partial<ChannelOutputMap>
  try {
    outputs = JSON.parse(content) as Partial<ChannelOutputMap>
  } catch (err) {
    throw new Error(`Distributor: Failed to parse JSON response — ${(err as Error).message}. Raw: ${content.slice(0, 200)}`)
  }

  const durationMs = Date.now() - start
  const inputHash = crypto.createHash('sha256').update(input.draft).digest('hex').slice(0, 16)

  writeAuditEntry({
    jobId: input.jobId,
    agentName: 'distributor',
    modelUsed: MODEL,
    inputHash,
    outputSummary: `Channels: ${input.channels.join(', ')}`,
    flags: [],
    decision: 'DISTRIBUTED',
    durationMs,
  })

  return outputs
}
