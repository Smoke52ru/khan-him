import Link from 'next/link'

import type { SiteSetting } from '@/payload-types'
import { RequestCounter } from './RequestCounter'

type Props = {
  settings: SiteSetting
}

export function SiteHeader({ settings }: Props) {
  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/[^\d+]/g, '')}` : undefined

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-teal-900">
          {settings.companyName || 'Хан-Хим'}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-stone-700">
          <Link href="/catalog">Каталог</Link>
          <Link href="/about">О компании</Link>
          <Link href="/contacts">Контакты</Link>
          <Link href="/requisites">Реквизиты</Link>
        </nav>
        <form action="/catalog" method="get" className="ml-auto flex min-w-[12rem] flex-1 max-w-sm">
          <input
            type="search"
            name="q"
            placeholder="Поиск по каталогу"
            className="w-full rounded-l-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-r-md bg-teal-800 px-3 py-2 text-sm font-medium text-white"
          >
            Найти
          </button>
        </form>
        <div className="flex items-center gap-3 text-sm">
          {phoneHref && (
            <a href={phoneHref} className="font-medium text-teal-900">
              {settings.phone}
            </a>
          )}
          <Link
            href="/request"
            className="rounded-md border border-teal-800 px-3 py-2 font-medium text-teal-900"
          >
            Быстрая заявка
          </Link>
          <RequestCounter />
        </div>
      </div>
    </header>
  )
}
