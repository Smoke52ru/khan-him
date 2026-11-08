'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { RequestForm } from '@/components/RequestForm'
import {
  getRequestList,
  removeFromRequestList,
  subscribeRequestList,
  updateRequestQuantity,
  type RequestListItem,
} from '@/lib/requestList'

type ProductInfo = {
  id: string
  name: string
  sku?: string | null
  published?: boolean | null
}

export function RequestListClient({ phoneFallback }: { phoneFallback?: string }) {
  const items = useSyncExternalStore(subscribeRequestList, getRequestList, () => [])
  const [products, setProducts] = useState<Record<string, ProductInfo>>({})
  const [removedNames, setRemovedNames] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const idsKey = items.map((item) => item.productId).join(',')

  useEffect(() => {
    if (!idsKey) return
    let cancelled = false
    fetch(`/api/request-products?ids=${idsKey}`)
      .then((res) => res.json())
      .then((data: { products: ProductInfo[] }) => {
        if (cancelled) return
        const map: Record<string, ProductInfo> = {}
        for (const product of data.products) map[String(product.id)] = product
        const missing: string[] = []
        for (const id of idsKey.split(',')) {
          const product = map[id]
          if (!product || !product.published) {
            missing.push(product?.name || id)
            removeFromRequestList(id)
          }
        }
        if (missing.length) setRemovedNames(missing)
        setProducts(map)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [idsKey])

  const resolvedProducts = idsKey ? products : {}
  const liveItems = items.filter((item) => resolvedProducts[item.productId]?.published)

  if (submitted) {
    return (
      <div className="rounded-md bg-teal-50 p-4 text-teal-950">
        <p className="font-medium">Заявка принята. Менеджер свяжется с вами.</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md bg-stone-100 p-4 text-stone-700">
        Список пуст. Добавьте товары из каталога.
        {removedNames.length > 0 && (
          <p className="mt-2 text-sm">
            Некоторые позиции больше недоступны и были удалены: {removedNames.join(', ')}.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {removedNames.length > 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Товар больше недоступен и удалён из списка: {removedNames.join(', ')}.
        </p>
      )}
      <ul className="space-y-4">
        {liveItems.map((item) => (
          <RequestListRow
            key={item.productId}
            item={item}
            product={resolvedProducts[item.productId]}
          />
        ))}
      </ul>
      <RequestForm
        source="list"
        phoneFallback={phoneFallback}
        items={liveItems.map((item) => ({
          productId: item.productId,
          name: resolvedProducts[item.productId]?.name || 'Товар',
          sku: resolvedProducts[item.productId]?.sku || undefined,
          quantity: item.quantity,
        }))}
        onSuccess={() => setSubmitted(true)}
      />
    </div>
  )
}

function RequestListRow({
  item,
  product,
}: {
  item: RequestListItem
  product?: ProductInfo
}) {
  return (
    <li className="rounded-md border border-stone-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{product?.name || 'Загрузка…'}</p>
          {product?.sku && <p className="text-sm text-stone-500">{product.sku}</p>}
        </div>
        <button
          type="button"
          className="text-sm text-red-700 underline"
          onClick={() => removeFromRequestList(item.productId)}
        >
          Удалить
        </button>
      </div>
      <label className="mt-3 block text-sm">
        Объём и фасовка
        <input
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          value={item.quantity}
          onChange={(e) => updateRequestQuantity(item.productId, e.target.value)}
          placeholder="например, 2 бочки по 200 кг"
        />
      </label>
    </li>
  )
}
