const WINDOW_MS = 30_000
const MAX_REQUESTS = 2

const requestLog = new Map<string, number[]>()

export function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const timestamps = (requestLog.get(ip) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= MAX_REQUESTS) {
    requestLog.set(ip, timestamps)
    return true
  }

  timestamps.push(now)
  requestLog.set(ip, timestamps)
  return false
}
