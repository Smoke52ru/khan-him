import { getSiteSettings } from '@/lib/catalog'

export const metadata = { title: 'Контакты' }

export default async function ContactsPage() {
  const settings = await getSiteSettings()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Контакты</h1>
      <dl className="mt-6 space-y-3 text-stone-700">
        {settings.phone && (
          <div>
            <dt className="text-sm text-stone-500">Телефон</dt>
            <dd>
              <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>{settings.phone}</a>
            </dd>
          </div>
        )}
        {settings.email && (
          <div>
            <dt className="text-sm text-stone-500">Email</dt>
            <dd>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </dd>
          </div>
        )}
        {settings.address && (
          <div>
            <dt className="text-sm text-stone-500">Адрес</dt>
            <dd>{settings.address}</dd>
          </div>
        )}
      </dl>
    </main>
  )
}
