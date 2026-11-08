'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'

import { getRequestCount, subscribeRequestList } from '@/lib/requestList'

export function RequestCounter() {
  const count = useSyncExternalStore(subscribeRequestList, getRequestCount, () => 0)

  return (
    <Link href="/request-list" className="btn btn-dark min-h-10 px-3 text-sm no-underline">
      Запрос{count > 0 ? ` (${count})` : ''}
    </Link>
  )
}
