'use server'

import { headers } from 'next/headers'

import { checkFormTiming, checkHoneypot, checkRateLimit, getClientIp } from '@/lib/antispam'
import { getPayloadClient } from '@/lib/payload'
import { requestSchema } from '@/lib/requestSchema'

export type SubmitRequestState = {
  ok: boolean
  message?: string
  fieldErrors?: Record<string, string>
}

export async function submitRequest(input: unknown): Promise<SubmitRequestState> {
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'form'
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { ok: false, fieldErrors, message: 'Проверьте поля формы' }
  }

  const data = parsed.data
  const honeypotError = checkHoneypot(data.website)
  if (honeypotError) return { ok: false, message: honeypotError }

  const timingError = checkFormTiming(data.formOpenedAt)
  if (timingError) return { ok: false, message: timingError }

  const headerList = await headers()
  const ip = getClientIp(headerList)
  const rateError = checkRateLimit(ip)
  if (rateError) return { ok: false, message: rateError }

  const payload = await getPayloadClient()

  const items: {
    product?: number
    name: string
    sku?: string
    quantity?: string
  }[] = []
  for (const item of data.items) {
    let name = item.name
    let sku = item.sku || ''
    let productId: number | undefined

    if (item.productId) {
      try {
        const product = await payload.findByID({
          collection: 'products',
          id: item.productId,
          depth: 0,
          overrideAccess: true,
        })
        if (!product.published) continue
        name = product.name
        sku = product.sku || sku
        productId = Number(product.id)
      } catch {
        continue
      }
    }

    items.push({
      product: productId,
      name,
      sku,
      quantity: item.quantity || '',
    })
  }

  if (items.length === 0 && !data.message.trim()) {
    return {
      ok: false,
      message: 'Добавьте товар или опишите запрос в комментарии',
      fieldErrors: { message: 'Добавьте товар или опишите запрос в комментарии' },
    }
  }

  await payload.create({
    collection: 'requests',
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      message: data.message,
      source: data.source,
      items,
      consentAt: new Date().toISOString(),
      ip,
    },
    overrideAccess: true,
  })

  return { ok: true, message: 'Заявка принята. Менеджер свяжется с вами.' }
}
