const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS = 5
const MIN_FORM_MS = 3000

type Entry = number[]

const hits = new Map<string, Entry>()

export function checkHoneypot(value: string | undefined): string | null {
  if (value && value.trim().length > 0) return 'Отклонено'
  return null
}

export function checkFormTiming(formOpenedAt: number, now = Date.now()): string | null {
  if (!formOpenedAt || now - formOpenedAt < MIN_FORM_MS) {
    return 'Отправьте форму чуть позже'
  }
  return null
}

export function checkRateLimit(ip: string, now = Date.now()): string | null {
  const key = ip || 'unknown'
  const recent = (hits.get(key) || []).filter((ts) => now - ts < WINDOW_MS)
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent)
    return 'Слишком много заявок. Попробуйте позже'
  }
  recent.push(now)
  hits.set(key, recent)
  return null
}

export function resetRateLimitStore(): void {
  hits.clear()
}

export function getClientIp(
  headers: Headers,
  trustedProxy = process.env.TRUST_PROXY === '1',
): string {
  if (trustedProxy) {
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return headers.get('x-real-ip') || 'unknown'
}

export { MAX_REQUESTS, MIN_FORM_MS, WINDOW_MS }
