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

  const fields: [string, string | null | undefined][] = [
    ['Артикул', product.sku],
    ['Альтернативные названия', product.altNames?.join(', ')],
    ['Формула', product.formula],
    ['Номер CAS', product.cas],
    ['ГОСТ', product.gost],
    ['ТУ', product.tu],
    ['Фасовка', product.packaging],
    ['Наличие', product.availability === 'stock' ? 'На складе' : 'Под заказ'],
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/catalog" className="text-sm text-teal-800 underline">
        ← В каталог
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
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
                  className="w-full bg-stone-100 object-cover"
                />
              ) : null
            })
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-stone-200 text-stone-500">
              Нет фото
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">{product.name}</h1>
          <OfferDisclaimer className="mt-3" />
          <dl className="mt-6 space-y-2 text-sm">
            {fields
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div key={label} className="grid grid-cols-[10rem_1fr] gap-2">
                  <dt className="text-stone-500">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            {categories.length > 0 && (
              <div className="grid grid-cols-[10rem_1fr] gap-2">
                <dt className="text-stone-500">Категории</dt>
                <dd>{categories.map((category) => category.name).join(', ')}</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <AddToRequestButton productId={String(product.id)} />
            <Link
              href={`/request?product=${product.id}`}
              className="rounded-md border border-teal-800 px-3 py-2 text-sm font-medium text-teal-900"
            >
              Запросить цену
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-12 space-y-8">
        {product.description && (
          <div>
            <h2 className="text-xl font-semibold">Описание</h2>
            <div className="mt-3">
              <RichText data={product.description} />
            </div>
          </div>
        )}
        {product.application && (
          <div>
            <h2 className="text-xl font-semibold">Применение</h2>
            <div className="mt-3">
              <RichText data={product.application} />
            </div>
          </div>
        )}
        {product.specs && product.specs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold">Технические характеристики</h2>
            <table className="mt-3 w-full max-w-2xl text-left text-sm">
              <tbody>
                {product.specs.map((row, index) => (
                  <tr key={index} className="border-b border-stone-200">
                    <th className="py-2 pr-4 font-medium">{row.name}</th>
                    <td className="py-2">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {product.storage && (
          <div>
            <h2 className="text-xl font-semibold">Хранение</h2>
            <div className="mt-3">
              <RichText data={product.storage} />
            </div>
          </div>
        )}
        {product.transport && (
          <div>
            <h2 className="text-xl font-semibold">Транспортировка</h2>
            <div className="mt-3">
              <RichText data={product.transport} />
            </div>
          </div>
        )}
        {product.safety && (
          <div>
            <h2 className="text-xl font-semibold">Техника безопасности</h2>
            <div className="mt-3">
              <RichText data={product.safety} />
            </div>
          </div>
        )}
        {documents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold">Документы</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a href={doc.url || '#'} className="text-teal-800 underline" download>
                    {doc.title}
                  </a>
                  <span className="ml-2 text-stone-500">
                    {[doc.mimeType?.split('/').pop()?.toUpperCase(), formatBytes(doc.filesize)].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Смотрите также</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
