import { describe, expect, it } from 'vitest'

import { slugify, uniqueSlug } from '@/lib/slugify'

describe('slugify', () => {
  it('транслитерирует «Борная кислота»', () => {
    expect(slugify('Борная кислота')).toBe('bornaya-kislota')
  })

  it('обрабатывает ё, щ, ъ, ь', () => {
    expect(slugify('Ёлка')).toBe('yolka')
    expect(slugify('Щёлочь')).toBe('shhyoloch')
    expect(slugify('Объект')).toBe('obekt')
  })

  it('сохраняет латиницу и цифры, заменяет знаки на дефис', () => {
    expect(slugify('CAS 64-19-7 / уксус')).toBe('cas-64-19-7-uksus')
  })

  it('схлопывает повторные дефисы и обрезает края', () => {
    expect(slugify('  ---АБВ---  ')).toBe('abv')
  })
})

describe('uniqueSlug', () => {
  it('возвращает базу, если она свободна', () => {
    expect(uniqueSlug('bornaya-kislota', [])).toBe('bornaya-kislota')
  })

  it('добавляет суффикс при совпадении', () => {
    expect(uniqueSlug('bornaya-kislota', ['bornaya-kislota'])).toBe('bornaya-kislota-2')
    expect(uniqueSlug('bornaya-kislota', ['bornaya-kislota', 'bornaya-kislota-2'])).toBe(
      'bornaya-kislota-3',
    )
  })
})
