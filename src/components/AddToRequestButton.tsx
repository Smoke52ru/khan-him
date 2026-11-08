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
      className={className || 'btn btn-primary text-sm'}
    >
      {added ? 'Уже в запросе' : 'В запрос'}
    </button>
  )
}
