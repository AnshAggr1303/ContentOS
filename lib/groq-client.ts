import Groq from 'groq-sdk'
import type { ChatCompletionCreateParams } from 'groq-sdk/resources/chat/completions'

const GROQ_KEYS = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean) as string[]

if (!GROQ_KEYS.length) throw new Error('No GROQ keys configured. Set GROQ_KEY_1, GROQ_KEY_2, or GROQ_KEY_3 in .env.local')

export async function callGroq(params: ChatCompletionCreateParams) {
  const keysToTry = [...GROQ_KEYS.keys()]
  for (const i of keysToTry) {
    try {
      const client = new Groq({ apiKey: GROQ_KEYS[i] })
      return await client.chat.completions.create(params)
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'status' in err &&
        (err as { status: number }).status === 429 &&
        i < keysToTry.length - 1
      )
        continue
      throw err
    }
  }
}
