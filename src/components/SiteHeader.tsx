import Link from 'next/link'

import type { SiteSetting } from '@/payload-types'
import { RequestCounter } from './RequestCounter'

type Props = {
  settings: SiteSetting
}

export function SiteHeader({ settings }: Props) {
  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/[^\d+]/g, '')}` : undefined
  const brand = settings.companyName || 'Хан-Хим'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="site-shell grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 py-3 xl:grid-cols-[auto_auto_minmax(12rem,18rem)_auto]">
        <Link href="/" className="brand-mark shrink-0 text-[1.35rem] text-ink no-underline">
          {brand}
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-[0.9375rem] text-ink-soft xl:justify-start">
          <Link href="/catalog" className="hover:text-ink">
            Каталог
          </Link>
          <Link href="/about" className="hover:text-ink">
            О компании
          </Link>
          <Link href="/contacts" className="hover:text-ink">
            Контакты
          </Link>
          <Link href="/requisites" className="hover:text-ink">
            Реквизиты
          </Link>
        </nav>

        <form
          action="/catalog"
          method="get"
          className="col-span-2 flex w-full xl:col-span-1 xl:max-w-none"
        >
          <input
            type="search"
            name="q"
            placeholder="Поиск по каталогу"
            className="field min-h-9 rounded-r-none border-r-0 py-1.5"
            aria-label="Поиск по каталогу"
          />
          <button type="submit" className="btn btn-primary min-h-9 rounded-l-none px-3 text-sm">
            Найти
          </button>
        </form>

        <div className="col-span-2 flex flex-wrap items-center justify-end gap-2.5 text-sm xl:col-span-1">
          {phoneHref && (
            <a href={phoneHref} className="font-semibold text-signal-ink no-underline">
              {settings.phone}
            </a>
          )}
          <Link href="/request" className="btn btn-secondary min-h-9 px-3 text-sm">
            Быстрая заявка
          </Link>
          <RequestCounter />
        </div>
      </div>
    </header>
  )
}
