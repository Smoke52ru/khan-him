import { getSiteSettings } from '@/lib/catalog'

export const metadata = { title: 'Реквизиты' }

export default async function RequisitesPage() {
  const settings = await getSiteSettings()
  return (
    <main className="site-shell max-w-3xl py-10 sm:py-14">
      <h1 className="page-title">Реквизиты</h1>
      <dl className="mt-8 divide-y divide-line border-y border-line">
        <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
          <dt className="text-sm text-ink-soft">Название</dt>
          <dd className="font-semibold">{settings.companyName}</dd>
        </div>
        {settings.inn && (
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-ink-soft">ИНН</dt>
            <dd className="font-mono text-sm">{settings.inn}</dd>
          </div>
        )}
        {settings.ogrn && (
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-ink-soft">ОГРН</dt>
            <dd className="font-mono text-sm">{settings.ogrn}</dd>
          </div>
        )}
        {settings.kpp && (
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-ink-soft">КПП</dt>
            <dd className="font-mono text-sm">{settings.kpp}</dd>
          </div>
        )}
        {settings.legalAddress && (
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-ink-soft">Юридический адрес</dt>
            <dd>{settings.legalAddress}</dd>
          </div>
        )}
      </dl>
    </main>
  )
}
