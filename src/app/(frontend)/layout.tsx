import { Geologica, JetBrains_Mono, Manrope } from 'next/font/google'
import React from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getSiteSettings } from '@/lib/catalog'

import './styles.css'

export const dynamic = 'force-dynamic'

const geologica = Geologica({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-geologica',
})

const manrope = Manrope({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-manrope',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-jetbrains',
})

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
    <html
      lang="ru"
      className={`${geologica.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SiteHeader settings={settings} />
        <div className="flex-1">{children}</div>
        <SiteFooter settings={settings} />
      </body>
    </html>
  )
}
