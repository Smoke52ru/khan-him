import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToRequestButton } from '@/components/AddToRequestButton'
import { OfferDisclaimer } from '@/components/OfferDisclaimer'
import { ProductCard } from '@/components/ProductCard'
import { findProductBySlug, findRelatedProducts } from '@/lib/catalog'
import { toLocalMediaUrl } from '@/lib/mediaUrl'
import { RichText } from '@/lib/richText'
import type { Category, Document, Media } from '@/payload-types'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const product = await findProductBySlug(slug)
  if (!product) return { title: 'Товар не найден' }
  return {
    title: `${product.name} оптом`,
    description: product.packaging
      ? `${product.name} — фасовка ${product.packaging}`
      : `${product.name} оптом`,
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await findProductBySlug(slug)
  if (!product) notFound()

  const categoryIds = (product.categories || [])
    .map((item) => (typeof item === 'object' && item ? item.id : item))
    .filter(Boolean) as (string | number)[]
  const related = await findRelatedProducts(product.id, categoryIds)

  const gallery = (product.gallery || []).filter(
    (item): item is Media => typeof item === 'object' && item !== null,
  )
  const documents = (product.documents || []).filter(
    (item): item is Document => typeof item === 'object' && item !== null,
  )
  const categories = (product.categories || []).filter(
    (item): item is Category => typeof item === 'object' && item !== null,
  )

  const fields: [string, string | null | undefined, boolean?][] = [
    ['Артикул', product.sku, true],
    ['Альтернативные названия', product.altNames?.join(', ')],
    ['Формула', product.formula, true],
    ['Номер CAS', product.cas, true],
    ['ГОСТ', product.gost],
    ['ТУ', product.tu],
    ['Фасовка', product.packaging],
    ['Наличие', product.availability === 'stock' ? 'На складе' : 'Под заказ'],
  ]

  return (
    <main className="site-shell py-10 sm:py-14">
      <Link href="/catalog" className="text-sm font-semibold text-signal-ink">
        ← В каталог
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-3">
          {gallery.length > 0 ? (
            gallery.map((image) => {
              const src = toLocalMediaUrl(image.url)
              return src ? (
                <Image
                  key={image.id}
                  src={src}
                  alt={image.alt || product.name}
                  width={800}
                  height={600}
                  className="w-full border border-line bg-panel object-cover"
                />
              ) : null
            })
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center border border-line bg-panel text-ink-soft">
              Нет фото
            </div>
          )}
        </div>

        <div>
          <h1 className="page-title text-[clamp(1.85rem,3.5vw,2.6rem)]">{product.name}</h1>
          {product.formula && <p className="formula mt-3 text-base">{product.formula}</p>}
          <OfferDisclaimer className="mt-4" />

          <dl className="mt-8 divide-y divide-line border-y border-line">
            {fields
              .filter(([, value]) => Boolean(value))
              .map(([label, value, mono]) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4"
                >
                  <dt className="text-sm text-ink-soft">{label}</dt>
                  <dd className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</dd>
                </div>
              ))}
            {categories.length > 0 && (
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="text-sm text-ink-soft">Категории</dt>
                <dd className="text-sm">
                  {categories.map((category) => category.name).join(', ')}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToRequestButton productId={String(product.id)} />
            <Link href={`/request?product=${product.id}`} className="btn btn-secondary">
              Запросить цену
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-16 space-y-12">
        {product.description && (
          <div>
            <h2 className="section-title">Описание</h2>
            <div className="mt-4 max-w-3xl">
              <RichText data={product.description} />
            </div>
          </div>
        )}
        {product.application && (
          <div>
            <h2 className="section-title">Применение</h2>
            <div className="mt-4 max-w-3xl">
              <RichText data={product.application} />
            </div>
          </div>
        )}
        {product.specs && product.specs.length > 0 && (
          <div>
            <h2 className="section-title">Технические характеристики</h2>
            <table className="mt-4 w-full max-w-2xl text-left text-sm">
              <tbody>
                {product.specs.map((row, index) => (
                  <tr key={index} className="border-b border-line">
                    <th className="py-3 pr-4 font-medium text-ink-soft">{row.name}</th>
                    <td className="py-3 font-mono">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {product.storage && (
          <div>
            <h2 className="section-title">Хранение</h2>
            <div className="mt-4 max-w-3xl">
              <RichText data={product.storage} />
            </div>
          </div>
        )}
        {product.transport && (
          <div>
            <h2 className="section-title">Транспортировка</h2>
            <div className="mt-4 max-w-3xl">
              <RichText data={product.transport} />
            </div>
          </div>
        )}
        {product.safety && (
          <div>
            <h2 className="section-title">Техника безопасности</h2>
            <div className="mt-4 max-w-3xl">
              <RichText data={product.safety} />
            </div>
          </div>
        )}
        {documents.length > 0 && (
          <div>
            <h2 className="section-title">Документы</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {documents.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 text-sm">
                  <a href={doc.url || '#'} className="font-semibold text-signal-ink" download>
                    {doc.title}
                  </a>
                  <span className="font-mono text-ink-soft">
                    {[doc.mimeType?.split('/').pop()?.toUpperCase(), formatBytes(doc.filesize)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <h2 className="section-title">Смотрите также</h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function formatBytes(size?: number | null): string | null {
  if (!size) return null
  if (size < 1024) return `${size} Б`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} КБ`
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`
}
