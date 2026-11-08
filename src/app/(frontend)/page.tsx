import Link from 'next/link'

import { ProductCard } from '@/components/ProductCard'
import { findCategoriesWithProducts, findPublishedProducts, getSiteSettings } from '@/lib/catalog'

export default async function HomePage() {
  const [settings, categories, products] = await Promise.all([
    getSiteSettings(),
    findCategoriesWithProducts(),
    findPublishedProducts({ page: 1 }),
  ])

  const brand = settings.companyName || 'Хан-Хим'

  return (
    <main>
      <section className="relative isolate min-h-[min(92vh,52rem)] overflow-hidden bg-ink text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-yard.svg')" }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, var(--hero-veil) 18%, transparent 72%)' }}
          aria-hidden
        />

        <div className="site-shell relative flex min-h-[min(92vh,52rem)] flex-col justify-end pb-14 pt-24 sm:pb-20">
          <div className="max-w-3xl">
            <h1 className="brand-mark hero-enter text-[clamp(3.05rem,9.4vw,6.1rem)] text-white">
              {brand}
            </h1>
            <p className="hero-enter-delay mt-5 max-w-xl text-lg text-white/85 sm:text-xl">
              Оптовые поставки химического сырья. Каталог без цен — оставьте заявку, менеджер
              свяжется с вами.
            </p>
            <div className="hero-enter-delay mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="btn btn-hero-solid no-underline">
                Открыть каталог
              </Link>
              <Link href="/request" className="btn btn-hero-ghost no-underline">
                Оставить заявку
              </Link>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="site-shell py-14">
          <h2 className="section-title">Категории</h2>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-6">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/catalog?category=${category.slug}`}
                  className="text-[1.05rem] text-signal-ink no-underline hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-y border-line bg-panel/60">
        <div className="site-shell py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="section-title">Товары</h2>
            <Link href="/catalog" className="text-sm font-semibold text-signal-ink">
              Весь каталог
            </Link>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {products.docs.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="site-shell py-16">
        <h2 className="section-title">Как работаем</h2>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {[
            ['От производителя', 'Прямые контракты и стабильные поставки сырья.'],
            ['Подбор объёма', 'Фасовку и объём обсуждаем в заявке под ваш процесс.'],
            ['Документы', 'Паспорта качества и SDS скачиваются из карточки товара.'],
          ].map(([title, text]) => (
            <div key={title} className="border-t border-line pt-5">
              <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-signal-ink text-white">
        <div className="site-shell flex flex-col gap-5 py-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Быстрая заявка
            </h2>
            <p className="mt-3 text-white/80">
              Напишите, что ищете и в каких объёмах — менеджер ответит.
            </p>
          </div>
          <Link href="/request" className="btn btn-hero-solid no-underline">
            Оставить заявку
          </Link>
        </div>
      </section>
    </main>
  )
}
