import { RequestListClient } from '@/components/RequestListClient'
import { getSiteSettings } from '@/lib/catalog'

export const metadata = { title: 'Список запроса' }

export default async function RequestListPage() {
  const settings = await getSiteSettings()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Список запроса</h1>
      <p className="mt-3 text-stone-600">
        Укажите объём и фасовку для каждой позиции и отправьте заявку.
      </p>
      <div className="mt-6">
        <RequestListClient phoneFallback={settings.phone || undefined} />
      </div>
    </main>
  )
}
