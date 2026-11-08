import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@/lib/richText'

export const metadata = { title: 'Политика конфиденциальности' }

export default async function PrivacyPage() {
  const payload = await getPayloadClient()
  const page = await payload.findGlobal({ slug: 'privacy-policy', overrideAccess: true })
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Политика конфиденциальности</h1>
      {page.isDraft && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Черновик</p>
      )}
      <div className="mt-6">
        <RichText data={page.body} />
      </div>
    </main>
  )
}
