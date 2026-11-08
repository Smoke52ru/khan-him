import Link from 'next/link'

import type { SiteSetting } from '@/payload-types'
import { OfferDisclaimer } from './OfferDisclaimer'

type Props = {
  settings: SiteSetting
}

export function SiteFooter({ settings }: Props) {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-100">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-semibold text-teal-900">{settings.companyName}</p>
          {settings.phone && <p className="mt-2 text-sm">{settings.phone}</p>}
          {settings.email && <p className="text-sm">{settings.email}</p>}
          {settings.address && <p className="mt-2 text-sm text-stone-600">{settings.address}</p>}
        </div>
        <div className="text-sm text-stone-700">
          {settings.inn && <p>ИНН {settings.inn}</p>}
          {settings.ogrn && <p>ОГРН {settings.ogrn}</p>}
          {settings.kpp && <p>КПП {settings.kpp}</p>}
          {settings.legalAddress && <p className="mt-2">{settings.legalAddress}</p>}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/pd-consent">Согласие на обработку ПДн</Link>
          <Link href="/catalog">Каталог</Link>
        </div>
      </div>
      <div className="border-t border-stone-200 px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <OfferDisclaimer />
        </div>
      </div>
    </footer>
  )
}
