import { describe, expect, it } from 'vitest'

import { requestSchema } from '@/lib/requestSchema'

const base = {
  name: 'Иван',
  phone: '+79990001122',
  email: '',
  message: 'Нужно 2 бочки',
  source: 'quick' as const,
  items: [],
  privacyConsent: true,
  pdConsent: true,
  website: '',
  formOpenedAt: Date.now() - 5000,
}

describe('requestSchema', () => {
  it('принимает корректную заявку', () => {
    expect(requestSchema.parse(base).name).toBe('Иван')
  })

  it('требует имя', () => {
    expect(() => requestSchema.parse({ ...base, name: '' })).toThrow()
  })

  it('требует телефон', () => {
    expect(() => requestSchema.parse({ ...base, phone: '' })).toThrow()
  })

  it('проверяет email', () => {
    expect(() => requestSchema.parse({ ...base, email: 'ivan@' })).toThrow()
  })

  it('требует товар или комментарий', () => {
    expect(() => requestSchema.parse({ ...base, message: '', items: [] })).toThrow()
  })

  it('требует согласия', () => {
    expect(() => requestSchema.parse({ ...base, privacyConsent: false })).toThrow()
    expect(() => requestSchema.parse({ ...base, pdConsent: false })).toThrow()
  })
})
