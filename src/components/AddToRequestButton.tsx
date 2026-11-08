'use client'

import { useSyncExternalStore } from 'react'

import {
  addToRequestList,
  hasInRequestList,
  subscribeRequestList,
} from '@/lib/requestList'

type Props = {
  productId: string
  className?: string
}

export function AddToRequestButton({ productId, className = '' }: Props) {
  const added = useSyncExternalStore(
    subscribeRequestList,
    () => hasInRequestList(productId),
    () => false,
  )

  return (
    <button
      type="button"
      disabled={added}
      onClick={() => addToRequestList(productId)}
      className={
        className ||
        'rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white disabled:bg-stone-400'
      }
    >
      {added ? 'Уже в запросе' : 'В запрос'}
    </button>
  )
}
