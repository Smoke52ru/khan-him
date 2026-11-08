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
    <main className="site-shell py-10 sm:py-14">
      <h1 className="page-title">Каталог</h1>
      <OfferDisclaimer className="mt-4 max-w-2xl" />

      <form
        className="mt-8 grid gap-3 border border-line bg-white p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
        action="/catalog"
        method="get"
      >
        <input
          type="search"
          name="q"
          defaultValue={q || ''}
          placeholder="Название, формула, CAS, артикул"
          className="field"
          aria-label="Поиск"
        />
        <select
          name="category"
          defaultValue={category || ''}
          className="field"
          aria-label="Категория"
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
          className="field"
          aria-label="Наличие"
        >
          <option value="">Любое наличие</option>
          <option value="stock">На складе</option>
          <option value="order">Под заказ</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Применить
        </button>
      </form>

      {products.docs.length === 0 ? (
        <div className="mt-10 border border-line bg-panel p-6">
          <p className="font-medium">Ничего не найдено.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Попробуйте другой запрос или оставьте быструю заявку — подберём позицию вручную.
          </p>
          <Link href="/request" className="btn btn-secondary mt-4">
            Оставить быструю заявку
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.docs.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {products.totalPages > 1 && (
        <nav className="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-6 text-sm">
          {page > 1 && (
            <Link href={buildHref({ page: String(page - 1) })} className="font-semibold text-signal-ink">
              Назад
            </Link>
          )}
          <span className="text-ink-soft">
            Страница {products.page} из {products.totalPages} ({products.totalDocs} позиций, по{' '}
            {CATALOG_PAGE_SIZE})
          </span>
          {page < products.totalPages && (
            <Link href={buildHref({ page: String(page + 1) })} className="font-semibold text-signal-ink">
              Вперёд
            </Link>
          )}
        </nav>
      )}
    </main>
  )
}
