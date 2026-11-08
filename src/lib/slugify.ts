const GOST_7_79: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'j',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'shh',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

/** Транслит по ГОСТ 7.79 (система Б) → kebab-case slug. */
export function slugify(input: string): string {
  const lower = input.trim().toLowerCase()
  let out = ''
  for (const char of lower) {
    if (GOST_7_79[char] !== undefined) {
      out += GOST_7_79[char]
      continue
    }
    if (/[a-z0-9]/.test(char)) {
      out += char
      continue
    }
    out += '-'
  }
  return out
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Подбирает уникальный slug, добавляя -2, -3, ... при совпадениях. */
export function uniqueSlug(base: string, existing: Iterable<string>): string {
  const taken = new Set(existing)
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
