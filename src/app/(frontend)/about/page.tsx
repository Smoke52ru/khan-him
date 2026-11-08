import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@/lib/richText'

export const metadata = { title: 'О компании' }

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const page = await payload.findGlobal({ slug: 'about-page', overrideAccess: true })

  return (
    <main className="site-shell max-w-3xl py-10 sm:py-14">
      <h1 className="page-title">О компании</h1>
      <div className="mt-8">
        <RichText data={page.body} />
      </div>
    </main>
  )
}
