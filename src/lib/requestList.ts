export type RequestListItem = {
  productId: string
  quantity: string
}

const STORAGE_KEY = 'khan-him-request-list'

type Listener = () => void

const listeners = new Set<Listener>()
let cached: RequestListItem[] = []
let cachedRaw: string | null = null

function read(): RequestListItem[] {
  if (typeof window === 'undefined') return cached
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw) return cached
    cachedRaw = raw
    if (!raw) {
      cached = []
      return cached
    }
    const parsed = JSON.parse(raw) as RequestListItem[]
    cached = Array.isArray(parsed) ? parsed : []
    return cached
  } catch {
    cached = []
    cachedRaw = null
    return cached
  }
}

function write(items: RequestListItem[]): void {
  cached = items
  cachedRaw = JSON.stringify(items)
  window.localStorage.setItem(STORAGE_KEY, cachedRaw)
  listeners.forEach((listener) => listener())
}

export function subscribeRequestList(listener: Listener): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cachedRaw = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function getRequestList(): RequestListItem[] {
  return read()
}

export function getRequestCount(): number {
  return read().length
}

export function addToRequestList(productId: string): void {
  const items = read()
  if (items.some((item) => item.productId === productId)) return
  write([...items, { productId, quantity: '' }])
}

export function updateRequestQuantity(productId: string, quantity: string): void {
  write(read().map((item) => (item.productId === productId ? { ...item, quantity } : item)))
}

export function removeFromRequestList(productId: string): void {
  write(read().filter((item) => item.productId !== productId))
}

export function clearRequestList(): void {
  write([])
}

export function hasInRequestList(productId: string): boolean {
  return read().some((item) => item.productId === productId)
}
