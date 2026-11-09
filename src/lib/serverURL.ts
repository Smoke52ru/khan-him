/**
 * Публичный URL приложения и CSRF allowlist для Payload.
 *
 * Читается из SERVER_URL, а не из NEXT_PUBLIC_*: Next.js вшивает
 * NEXT_PUBLIC_* в бандл при `next build`, и значение из .env в рантайме
 * контейнера игнорируется. Тогда Origin браузера не попадает в csrf,
 * Payload отбрасывает cookie на POST/PATCH — «нет права на действие».
 *
 * Браузер шлёт Origin без порта (:80/:443). Если ошибочно указали
 * http://IP:3000 (внутренний порт контейнера за Caddy), порт убирается.
 */
export function resolvePublicServerURL(
  raw = process.env.SERVER_URL || 'http://localhost:3000',
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
