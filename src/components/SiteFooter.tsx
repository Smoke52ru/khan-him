import Link from 'next/link'

import type { SiteSetting } from '@/payload-types'
import { OfferDisclaimer } from './OfferDisclaimer'

type Props = {
  settings: SiteSetting
}

export function SiteFooter({ settings }: Props) {
  return (
    <footer className="mt-auto border-t border-line bg-panel">
      <div className="site-shell grid gap-8 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="brand-mark text-xl text-ink">{settings.companyName}</p>
          {settings.phone && <p className="mt-3 text-sm text-ink">{settings.phone}</p>}
          {settings.email && (
            <p className="text-sm">
              <a href={`mailto:${settings.email}`} className="text-signal-ink">
                {settings.email}
              </a>
            </p>
          )}
          {settings.address && <p className="mt-3 max-w-sm text-sm text-ink-soft">{settings.address}</p>}
        </div>

        <div className="font-mono text-sm leading-relaxed text-ink-soft">
          {settings.inn && <p>ИНН {settings.inn}</p>}
          {settings.ogrn && <p>ОГРН {settings.ogrn}</p>}
          {settings.kpp && <p>КПП {settings.kpp}</p>}
          {settings.legalAddress && <p className="mt-3 font-sans">{settings.legalAddress}</p>}
        </div>

        <div className="flex flex-col gap-2 text-sm text-ink-soft">
          <Link href="/catalog" className="hover:text-ink">
            Каталог
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Политика конфиденциальности
          </Link>
          <Link href="/pd-consent" className="hover:text-ink">
            Согласие на обработку ПДн
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="site-shell py-4">
          <OfferDisclaimer />
        </div>
      </div>
    </footer>
  )
}
