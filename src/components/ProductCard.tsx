import Image from 'next/image'
import Link from 'next/link'

import type { Media, Product } from '@/payload-types'
import { toLocalMediaUrl } from '@/lib/mediaUrl'
import { AddToRequestButton } from './AddToRequestButton'

type Props = {
  product: Product
}

function coverUrl(product: Product): string | null {
  const first = product.gallery?.[0]
  if (!first || typeof first !== 'object') return null
  const media = first as Media
  return toLocalMediaUrl(media.sizes?.card?.url || media.url)
}

export function ProductCard({ product }: Props) {
  const image = coverUrl(product)
  const onStock = product.availability === 'stock'

  return (
    <article className="flex flex-col gap-3">
      <Link
        href={`/catalog/${product.slug}`}
        className="block overflow-hidden border border-line bg-panel no-underline"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            width={600}
            height={450}
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-panel text-sm text-ink-soft">
            Нет фото
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <Link
          href={`/catalog/${product.slug}`}
          className="font-semibold leading-snug text-ink no-underline hover:text-signal-ink"
        >
          {product.name}
        </Link>

        {product.formula && <p className="formula">{product.formula}</p>}

        {product.altNames && product.altNames.length > 0 && (
          <p className="text-sm text-ink-soft">{product.altNames.join(', ')}</p>
        )}

        {product.packaging && (
          <p className="text-sm text-ink-soft">Фасовка: {product.packaging}</p>
        )}

        <p className={`text-sm font-medium ${onStock ? 'text-stock' : 'text-ink-soft'}`}>
          {onStock ? 'На складе' : 'Под заказ'}
        </p>

        <div className="mt-auto pt-1">
          <AddToRequestButton productId={String(product.id)} />
        </div>
      </div>
    </article>
  )
}
