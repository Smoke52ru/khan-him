import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload

describe('requests', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('аноним не читает и не создаёт заявки через access API', async () => {
    await expect(
      payload.create({
        collection: 'requests',
        data: {
          name: 'Test',
          phone: '+79990001122',
          source: 'quick',
          message: 'hello',
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.find({
        collection: 'requests',
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('сохраняет заявку с overrideAccess и шлёт письмо', async () => {
    await fetch('http://127.0.0.1:8025/api/v1/messages', { method: 'DELETE' }).catch(() => undefined)

    const created = await payload.create({
      collection: 'requests',
      data: {
        name: 'Пётр',
        phone: '+79991112233',
        email: 'petr@example.com',
        source: 'quick',
        message: 'Нужна борная кислота',
        items: [{ name: 'Борная кислота', sku: 'KH001', quantity: '1 мешок' }],
        consentAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    expect(created.id).toBeTruthy()

    const messages = await fetch('http://127.0.0.1:8025/api/v1/messages').then((r) => r.json())
    expect(messages.total).toBeGreaterThan(0)
    const subjects = (messages.messages as { Subject?: string }[]).map((m) => m.Subject || '')
    expect(subjects.some((s) => s.includes('Заявка'))).toBe(true)

    await payload.delete({ collection: 'requests', id: created.id, overrideAccess: true })
  })
})
