import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('requestList', () => {
  beforeEach(() => {
    vi.resetModules()
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('добавляет без дублей, обновляет объём, очищает', async () => {
    const mod = await import('@/lib/requestList')
    mod.addToRequestList('1')
    mod.addToRequestList('1')
    expect(mod.getRequestList()).toEqual([{ productId: '1', quantity: '' }])
    mod.updateRequestQuantity('1', '2 бочки')
    expect(mod.getRequestList()[0].quantity).toBe('2 бочки')
    mod.addToRequestList('2')
    expect(mod.getRequestCount()).toBe(2)
    mod.removeFromRequestList('1')
    expect(mod.getRequestList()).toEqual([{ productId: '2', quantity: '' }])
    mod.clearRequestList()
    expect(mod.getRequestCount()).toBe(0)
  })
})
