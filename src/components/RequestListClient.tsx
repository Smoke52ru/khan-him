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
      <div className="border border-stock bg-signal-soft/40 p-5">
        <p className="font-semibold text-stock">Заявка принята. Менеджер свяжется с вами.</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="border border-line bg-panel p-5 text-ink">
        <p className="font-medium">Список пуст.</p>
        <p className="mt-2 text-sm text-ink-soft">Добавьте товары из каталога.</p>
        {removedNames.length > 0 && (
          <p className="mt-3 text-sm text-warn">
            Некоторые позиции больше недоступны и были удалены: {removedNames.join(', ')}.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {removedNames.length > 0 && (
        <p className="border border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
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
    <li className="border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{product?.name || 'Загрузка…'}</p>
          {product?.sku && <p className="mt-1 font-mono text-sm text-ink-soft">{product.sku}</p>}
        </div>
        <button
          type="button"
          className="text-sm font-medium text-danger underline"
          onClick={() => removeFromRequestList(item.productId)}
        >
          Удалить
        </button>
      </div>
      <label className="mt-4 block text-sm font-medium">
        Объём и фасовка
        <input
          className="field mt-1.5"
          value={item.quantity}
          onChange={(e) => updateRequestQuantity(item.productId, e.target.value)}
          placeholder="например, 2 бочки по 200 кг"
        />
      </label>
    </li>
  )
}
