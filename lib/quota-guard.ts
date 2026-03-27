let dailyCount = 0
let lastResetDay = new Date().getUTCDate()

const GUARD_THRESHOLD = 2800

function resetIfNewDay(): void {
  const today = new Date().getUTCDate()
  if (today !== lastResetDay) {
    dailyCount = 0
    lastResetDay = today
  }
}

export function shouldUseGptOss(): boolean {
  resetIfNewDay()
  return dailyCount < GUARD_THRESHOLD
}

export function recordGptOssCall(): void {
  resetIfNewDay()
  dailyCount++
}

export function getLocalizerModel(): string {
  return shouldUseGptOss() ? 'openai/gpt-oss-120b' : 'llama-3.3-70b-versatile'
}
