/** Payload часто отдаёт абсолютный URL — next/image удобнее кормить относительным путём. */
export function toLocalMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000')
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url.startsWith('/') ? url : null
  }
}
