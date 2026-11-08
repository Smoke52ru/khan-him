import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload

describe('access control', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('отклоняет создание пользователя через Local API без overrideAccess', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `blocked-${Date.now()}@example.com`,
          password: 'password123',
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('отправляет письмо при сбросе пароля', async () => {
    const email = `reset-${Date.now()}@example.com`
    await payload.create({
      collection: 'users',
      data: { email, password: 'ResetPass123!' },
      overrideAccess: true,
    })

    await fetch('http://127.0.0.1:8025/api/v1/messages', { method: 'DELETE' }).catch(() => undefined)

    await payload.forgotPassword({
      collection: 'users',
      data: { email },
    })

    const messages = await fetch('http://127.0.0.1:8025/api/v1/messages').then((r) => r.json())
    expect(messages.total).toBeGreaterThan(0)

    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'users',
      id: users.docs[0].id,
      overrideAccess: true,
    })
  })

  it('не отдаёт неопубликованный товар анониму', async () => {
    const created = await payload.create({
      collection: 'products',
      data: {
        name: `Скрытый ${Date.now()}`,
        published: false,
      },
      overrideAccess: true,
    })

    const anon = await payload.find({
      collection: 'products',
      where: { id: { equals: created.id } },
      overrideAccess: false,
      user: undefined,
    })

    expect(anon.totalDocs).toBe(0)

    await payload.delete({
      collection: 'products',
      id: created.id,
      overrideAccess: true,
    })
  })

  it('отклоняет сохранение товара без названия', async () => {
    await expect(
      payload.create({
        collection: 'products',
        data: { published: true, name: '' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('удаление категории не удаляет товары', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Кат ${Date.now()}`, order: 99 },
      overrideAccess: true,
    })

    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Товар ${Date.now()}`,
        published: true,
        categories: [category.id],
      },
      overrideAccess: true,
    })

    await payload.delete({
      collection: 'categories',
      id: category.id,
      overrideAccess: true,
    })

    const refreshed = await payload.findByID({
      collection: 'products',
      id: product.id,
      overrideAccess: true,
      depth: 0,
    })

    expect(refreshed.name).toBe(product.name)
    expect(refreshed.categories ?? []).toHaveLength(0)

    await payload.delete({
      collection: 'products',
      id: product.id,
      overrideAccess: true,
    })
  })
})
