/** Payload часто отдаёт абсолютный URL — next/image удобнее кормить относительным путём. */
export function toLocalMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, 'http://localhost')
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url.startsWith('/') ? url : null
  }
}
