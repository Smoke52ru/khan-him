import { RequestForm } from '@/components/RequestForm'
import { getPayloadClient } from '@/lib/payload'
import { getSiteSettings } from '@/lib/catalog'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const metadata = { title: 'Заявка' }

export default async function RequestPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const productId = Array.isArray(params.product) ? params.product[0] : params.product
  const settings = await getSiteSettings()

  let items: { productId?: string; name: string; sku?: string }[] = []
  let source: 'quick' | 'price' = 'quick'
  let title = 'Быстрая заявка'

  if (productId) {
    const payload = await getPayloadClient()
    try {
      const product = await payload.findByID({
        collection: 'products',
        id: productId,
        depth: 0,
        overrideAccess: true,
      })
      if (product.published) {
        items = [{ productId: String(product.id), name: product.name, sku: product.sku || undefined }]
        source = 'price'
        title = `Запросить цену: ${product.name}`
      }
    } catch {
      // ignore invalid id
    }
  }

  return (
    <main className="site-shell max-w-xl py-10 sm:py-14">
      <h1 className="page-title text-[clamp(1.85rem,3.5vw,2.5rem)]">{title}</h1>
      <p className="mt-4 text-ink-soft">
        Это предварительная заявка. Укажите адрес доставки, объём и фасовку в комментарии.
      </p>
      <div className="mt-8">
        <RequestForm source={source} items={items} phoneFallback={settings.phone || undefined} />
      </div>
    </main>
  )
}
