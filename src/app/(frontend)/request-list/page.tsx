import { RequestListClient } from '@/components/RequestListClient'
import { getSiteSettings } from '@/lib/catalog'

export const metadata = { title: 'Список запроса' }

export default async function RequestListPage() {
  const settings = await getSiteSettings()
  return (
    <main className="site-shell max-w-3xl py-10 sm:py-14">
      <h1 className="page-title text-[clamp(1.85rem,3.5vw,2.5rem)]">Список запроса</h1>
      <p className="mt-4 text-ink-soft">
        Укажите объём и фасовку для каждой позиции и отправьте заявку.
      </p>
      <div className="mt-8">
        <RequestListClient phoneFallback={settings.phone || undefined} />
      </div>
    </main>
  )
}
