import { getSiteSettings } from '@/lib/catalog'

export const metadata = { title: 'Контакты' }

export default async function ContactsPage() {
  const settings = await getSiteSettings()
  return (
    <main className="site-shell max-w-3xl py-10 sm:py-14">
      <h1 className="page-title">Контакты</h1>
      <dl className="mt-8 divide-y divide-line border-y border-line">
        {settings.phone && (
          <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm text-ink-soft">Телефон</dt>
            <dd>
              <a
                href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                className="font-semibold text-signal-ink"
              >
                {settings.phone}
              </a>
            </dd>
          </div>
        )}
        {settings.email && (
          <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm text-ink-soft">Email</dt>
            <dd>
              <a href={`mailto:${settings.email}`} className="font-semibold text-signal-ink">
                {settings.email}
              </a>
            </dd>
          </div>
        )}
        {settings.address && (
          <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm text-ink-soft">Адрес</dt>
            <dd>{settings.address}</dd>
          </div>
        )}
      </dl>
    </main>
  )
}
