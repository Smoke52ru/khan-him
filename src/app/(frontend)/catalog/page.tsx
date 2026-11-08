import Link from 'next/link'

import { OfferDisclaimer } from '@/components/OfferDisclaimer'
import { ProductCard } from '@/components/ProductCard'
import {
  CATALOG_PAGE_SIZE,
  findCategoriesWithProducts,
  findPublishedProducts,
} from '@/lib/catalog'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = first(params.q)
  return {
    title: q ? `Поиск: ${q}` : 'Каталог',
    description: 'Каталог химической продукции оптом',
  }
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = first(params.q)
  const category = first(params.category)
  const availability = first(params.availability) as 'stock' | 'order' | undefined
  const page = Number(first(params.page) || '1') || 1

  const [products, categories] = await Promise.all([
    findPublishedProducts({ q, category, availability, page }),
    findCategoriesWithProducts(),
  ])

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    const merged = {
      q,
      category,
      availability,
      page: page > 1 ? String(page) : undefined,
      ...overrides,
    }
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value)
    }
    const query = next.toString()
    return query ? `/catalog?${query}` : '/catalog'
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-stone-900">Каталог товаров</h1>
      <OfferDisclaimer className="mt-3" />

      <form className="mt-6 flex flex-wrap gap-3" action="/catalog" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q || ''}
          placeholder="Название, формула, CAS, артикул"
          className="min-w-[16rem] flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={category || ''}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">Все категории</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug || ''}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="availability"
          defaultValue={availability || ''}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">Любое наличие</option>
          <option value="stock">На складе</option>
          <option value="order">Под заказ</option>
        </select>
        <button type="submit" className="rounded-md bg-teal-800 px-4 py-2 text-sm text-white">
          Применить
        </button>
      </form>

      {products.docs.length === 0 ? (
        <div className="mt-10 rounded-md bg-stone-100 p-6">
          <p>Ничего не найдено.</p>
          <Link href="/request" className="mt-3 inline-block text-teal-800 underline">
            Оставить быструю заявку
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.docs.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {products.totalPages > 1 && (
        <nav className="mt-10 flex items-center gap-4 text-sm">
          {page > 1 && (
            <Link href={buildHref({ page: String(page - 1) })} className="underline">
              Назад
            </Link>
          )}
          <span>
            Страница {products.page} из {products.totalPages} ({products.totalDocs} позиций, по{' '}
            {CATALOG_PAGE_SIZE})
          </span>
          {page < products.totalPages && (
            <Link href={buildHref({ page: String(page + 1) })} className="underline">
              Вперёд
            </Link>
          )}
        </nav>
      )}
    </main>
  )
}
