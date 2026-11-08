import { describe, expect, it, beforeEach } from 'vitest'

import {
  checkFormTiming,
  checkHoneypot,
  checkRateLimit,
  getClientIp,
  MAX_REQUESTS,
  resetRateLimitStore,
} from '@/lib/antispam'

describe('antispam', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('отклоняет honeypot', () => {
    expect(checkHoneypot('bot')).toBeTruthy()
    expect(checkHoneypot('')).toBeNull()
  })

  it('отклоняет слишком быструю отправку', () => {
    const now = 10_000
    expect(checkFormTiming(now - 1000, now)).toBeTruthy()
    expect(checkFormTiming(now - 4000, now)).toBeNull()
  })

  it('ограничивает частоту с IP', () => {
    const now = Date.now()
    for (let i = 0; i < MAX_REQUESTS; i += 1) {
      expect(checkRateLimit('1.1.1.1', now + i)).toBeNull()
    }
    expect(checkRateLimit('1.1.1.1', now + MAX_REQUESTS)).toBeTruthy()
    expect(checkRateLimit('2.2.2.2', now)).toBeNull()
  })

  it('читает X-Forwarded-For только от доверенного прокси', () => {
    const headers = new Headers({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8' })
    expect(getClientIp(headers, false)).toBe('unknown')
    expect(getClientIp(headers, true)).toBe('9.9.9.9')
  })
})
