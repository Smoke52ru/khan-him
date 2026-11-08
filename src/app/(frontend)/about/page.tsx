import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@/lib/richText'

export const metadata = { title: 'О компании' }

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const page = await payload.findGlobal({ slug: 'about-page', overrideAccess: true })

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">О компании</h1>
      {page.isDraft && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Черновик</p>
      )}
      <div className="mt-6">
        <RichText data={page.body} />
      </div>
    </main>
  )
}
