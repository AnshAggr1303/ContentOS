import crypto from 'crypto'
import type { ChatCompletion } from 'groq-sdk/resources/chat/completions'
import { callGroq } from '../lib/groq-client'
import { writeAuditEntry } from '../lib/db'
import { getLocalizerModel, recordGptOssCall } from '../lib/quota-guard'
import type { Language } from '../lib/types'

export interface LocalizerInput {
  draft: string
  headline: string
  languages: Language[]
  jobId: string
}

const LANGUAGE_NAMES: Record<Language, string> = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
}

const LOCALIZE_TIMEOUT_MS = 30_000

async function localizeToLanguage(
  draft: string,
  headline: string,
  language: Language,
  model: string,
  jobId: string,
): Promise<string> {
  const start = Date.now()
  const langName = LANGUAGE_NAMES[language]
  const isGptOss = model === 'openai/gpt-oss-120b'

  const systemPrompt = `You are a native ${langName} business journalist.
Adapt this Economic Times article culturally for ${langName}-speaking readers in India.
Do NOT translate literally. Rewrite with local examples, idioms, and cultural references appropriate for ${langName} readers.
Preserve all facts, numbers, and data exactly. Rewrite the context and framing.
Respond with the full adapted article in ${langName} script only. No English.`

  const raw = await callGroq({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Headline: ${headline}\n\n${draft}` },
    ],
    temperature: 0.7,
  })

  if (!raw) throw new Error(`Localizer: No response from Groq for ${language}`)
  const response = raw as ChatCompletion

  if (isGptOss) {
    recordGptOssCall()
  }

  const content = response.choices[0]?.message?.content ?? ''

  const durationMs = Date.now() - start
  const inputHash = crypto
    .createHash('sha256')
    .update(draft + language)
    .digest('hex')
    .slice(0, 16)

  writeAuditEntry({
    jobId,
    agentName: 'localizer',
    modelUsed: model,
    inputHash,
    outputSummary: content.slice(0, 200),
    flags: [],
    decision: `LOCALIZED_${language.toUpperCase()}`,
    durationMs,
  })

  return content
}

export async function runLocalizer(
  input: LocalizerInput,
): Promise<Partial<Record<Language, string>>> {
  const model = getLocalizerModel()

  const results = await Promise.all(
    input.languages.map((language) => {
      const timeoutPromise = new Promise<string>((resolve) =>
        setTimeout(() => {
          console.warn(`Localizer: timeout for language ${language} after ${LOCALIZE_TIMEOUT_MS}ms`)
          resolve('')
        }, LOCALIZE_TIMEOUT_MS),
      )
      return Promise.race([
        localizeToLanguage(input.draft, input.headline, language, model, input.jobId),
        timeoutPromise,
      ])
    }),
  )

  return Object.fromEntries(input.languages.map((lang, i) => [lang, results[i]])) as Partial<
    Record<Language, string>
  >
}
