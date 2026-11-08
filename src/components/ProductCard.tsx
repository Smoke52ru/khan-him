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
  const availability = product.availability === 'stock' ? 'На складе' : 'Под заказ'

  return (
    <article className="flex flex-col gap-3">
      <Link href={`/catalog/${product.slug}`} className="block overflow-hidden bg-stone-200">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            width={600}
            height={450}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-sm text-stone-500">
            Нет фото
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <Link href={`/catalog/${product.slug}`} className="font-medium text-stone-900 hover:underline">
          {product.name}
        </Link>
        {product.altNames && product.altNames.length > 0 && (
          <p className="text-sm text-stone-500">{product.altNames.join(', ')}</p>
        )}
        {product.packaging && <p className="text-sm text-stone-600">Фасовка: {product.packaging}</p>}
        <p className="text-sm text-teal-800">{availability}</p>
        <AddToRequestButton productId={String(product.id)} />
      </div>
    </article>
  )
}
