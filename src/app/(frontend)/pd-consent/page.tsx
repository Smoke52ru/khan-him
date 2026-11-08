import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@/lib/richText'

export const metadata = { title: 'Согласие на обработку персональных данных' }

export default async function PdConsentPage() {
  const payload = await getPayloadClient()
  const page = await payload.findGlobal({ slug: 'pd-consent', overrideAccess: true })
  return (
    <main className="site-shell max-w-3xl py-10 sm:py-14">
      <h1 className="page-title text-[clamp(1.85rem,3.5vw,2.5rem)]">
        Согласие на обработку персональных данных
      </h1>
      {page.isDraft && (
        <p className="mt-4 border border-warn bg-warn-soft px-3 py-2 text-sm text-warn">Черновик</p>
      )}
      <div className="mt-8">
        <RichText data={page.body} />
      </div>
    </main>
  )
}
