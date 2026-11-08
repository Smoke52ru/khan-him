import React from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getSiteSettings } from '@/lib/catalog'

import './styles.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Оптовый каталог химической продукции',
  title: {
    default: 'Хан-Хим',
    template: '%s — Хан-Хим',
  },
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col">
        <SiteHeader settings={settings} />
        <div className="flex-1">{children}</div>
        <SiteFooter settings={settings} />
      </body>
    </html>
  )
}
