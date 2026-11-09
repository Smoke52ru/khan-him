/**
 * Публичный URL приложения и CSRF allowlist для Payload.
 *
 * Браузер шлёт Origin без порта (:80/:443). Если в .env ошибочно указали
 * http://IP:3000 (внутренний порт контейнера за Caddy), cookie-логин в
 * админку молча отваливается: JWT ставится, /api/users/me → user: null.
 */
export function resolvePublicServerURL(
  raw = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
): { serverURL: string; csrf: string[] } {
  const trimmed = raw.replace(/\/$/, '')
  const csrf = new Set<string>()

  try {
    const url = new URL(trimmed)
    csrf.add(url.origin)

    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    // За reverse-proxy публичный Origin никогда не содержит :3000.
    if (!isLocal && url.port === '3000') {
      url.port = ''
    }

    const publicOrigin = url.origin
    csrf.add(publicOrigin)

    return { serverURL: publicOrigin, csrf: [...csrf] }
  } catch {
    csrf.add(trimmed)
    return { serverURL: trimmed, csrf: [...csrf] }
  }
}
