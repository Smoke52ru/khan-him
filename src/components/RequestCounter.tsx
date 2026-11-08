'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'

import { getRequestCount, subscribeRequestList } from '@/lib/requestList'

export function RequestCounter() {
  const count = useSyncExternalStore(subscribeRequestList, getRequestCount, () => 0)

  return (
    <Link
      href="/request-list"
      className="rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white"
    >
      Запрос{count > 0 ? ` (${count})` : ''}
    </Link>
  )
}
