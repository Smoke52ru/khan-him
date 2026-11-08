import Link from 'next/link'

import { ProductCard } from '@/components/ProductCard'
import { findCategoriesWithProducts, findPublishedProducts, getSiteSettings } from '@/lib/catalog'

export default async function HomePage() {
  const [settings, categories, products] = await Promise.all([
    getSiteSettings(),
    findCategoriesWithProducts(),
    findPublishedProducts({ page: 1 }),
  ])

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-teal-950">
          {settings.companyName || 'Хан-Хим'}
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Оптовые поставки химического сырья. Каталог без цен — оставьте заявку, менеджер свяжется с
          вами.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white"
        >
          Перейти в каталог
        </Link>
      </section>

      {categories.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-stone-900">Категории</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/catalog?category=${category.slug}`}
                  className="rounded-md border border-stone-300 px-3 py-2 text-sm hover:border-teal-800"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-stone-900">Товары</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.docs.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          ['От производителя', 'Прямые контракты и стабильные поставки.'],
          ['Подбор объёма', 'Фасовка и объём обсуждаются в заявке.'],
          ['Документы', 'Паспорта и SDS доступны в карточке товара.'],
        ].map(([title, text]) => (
          <div key={title}>
            <h3 className="font-semibold text-stone-900">{title}</h3>
            <p className="mt-2 text-sm text-stone-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-md bg-stone-100 p-6">
        <h2 className="text-xl font-semibold">Быстрая заявка</h2>
        <p className="mt-2 text-stone-600">
          Напишите, что ищете и в каких объёмах — менеджер ответит.
        </p>
        <Link href="/request" className="mt-4 inline-flex text-teal-800 underline">
          Оставить заявку
        </Link>
      </section>
    </main>
  )
}
