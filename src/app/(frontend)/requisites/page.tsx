import { getSiteSettings } from '@/lib/catalog'

export const metadata = { title: 'Реквизиты' }

export default async function RequisitesPage() {
  const settings = await getSiteSettings()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Реквизиты</h1>
      <dl className="mt-6 space-y-3 text-stone-700">
        <div>
          <dt className="text-sm text-stone-500">Название</dt>
          <dd>{settings.companyName}</dd>
        </div>
        {settings.inn && (
          <div>
            <dt className="text-sm text-stone-500">ИНН</dt>
            <dd>{settings.inn}</dd>
          </div>
        )}
        {settings.ogrn && (
          <div>
            <dt className="text-sm text-stone-500">ОГРН</dt>
            <dd>{settings.ogrn}</dd>
          </div>
        )}
        {settings.kpp && (
          <div>
            <dt className="text-sm text-stone-500">КПП</dt>
            <dd>{settings.kpp}</dd>
          </div>
        )}
        {settings.legalAddress && (
          <div>
            <dt className="text-sm text-stone-500">Юридический адрес</dt>
            <dd>{settings.legalAddress}</dd>
          </div>
        )}
      </dl>
    </main>
  )
}
