import type { Payload, PayloadRequest } from 'payload'

import type { Request } from '@/payload-types'

import { resolvePublicServerURL } from './serverURL'

export async function sendRequestEmail(payload: Payload, doc: Request): Promise<void> {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })

  const recipients =
    settings.requestEmails?.map((item) => item.email).filter(Boolean) ||
    []
  const to =
    recipients.length > 0
      ? recipients
      : [process.env.REQUESTS_FALLBACK_EMAIL || 'requests@example.com']

  const base = resolvePublicServerURL().serverURL
  const adminLink = `${base}/admin/collections/requests/${doc.id}`
  const items = (doc.items || [])
    .map((item) => `- ${item.name}${item.sku ? ` (${item.sku})` : ''}${item.quantity ? `: ${item.quantity}` : ''}`)
    .join('\n')

  const text = [
    `Новая заявка (${doc.source})`,
    `Имя: ${doc.name}`,
    `Телефон: ${doc.phone}`,
    doc.email ? `Email: ${doc.email}` : null,
    doc.message ? `Комментарий: ${doc.message}` : null,
    items ? `Позиции:\n${items}` : null,
    `Админка: ${adminLink}`,
  ]
    .filter(Boolean)
    .join('\n')

  await payload.sendEmail({
    to,
    replyTo: doc.email || undefined,
    subject: `Заявка с сайта: ${doc.name}`,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text.replace(/</g, '&lt;')}</pre>`,
  })
}

export type RequestDoc = Request
export type RequestReq = PayloadRequest
