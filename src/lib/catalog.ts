import type { Where } from 'payload'

import { getPayloadClient } from './payload'

export const CATALOG_PAGE_SIZE = 24

export type CatalogFilters = {
  q?: string
  category?: string
  availability?: 'stock' | 'order'
  page?: number
}

export async function findPublishedProducts(filters: CatalogFilters = {}) {
  const payload = await getPayloadClient()
  const page = Math.max(1, filters.page || 1)

  const and: Where[] = [{ published: { equals: true } }]

  if (filters.category) {
    const categories = await payload.find({
      collection: 'categories',
      where: { slug: { equals: filters.category } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const categoryId = categories.docs[0]?.id
    if (categoryId) {
      and.push({ categories: { contains: categoryId } })
    } else {
      and.push({ id: { equals: '___none___' } })
    }
  }

  if (filters.availability) {
    and.push({ availability: { equals: filters.availability } })
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim()
    and.push({
      or: [
        { name: { like: q } },
        { altNames: { like: q } },
        { formula: { like: q } },
        { cas: { like: q } },
        { sku: { like: q } },
      ],
    })
  }

  return payload.find({
    collection: 'products',
    where: { and },
    limit: CATALOG_PAGE_SIZE,
    page,
    sort: 'name',
    depth: 1,
    overrideAccess: true,
  })
}

export async function findProductBySlug(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [{ slug: { equals: slug } }, { published: { equals: true } }],
    },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

export async function findRelatedProducts(productId: string | number, categoryIds: (string | number)[]) {
  if (categoryIds.length === 0) return []
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [
        { published: { equals: true } },
        { id: { not_equals: productId } },
        { categories: { in: categoryIds } },
      ],
    },
    limit: 4,
    sort: 'name',
    depth: 1,
    overrideAccess: true,
  })
  return result.docs
}

export async function findCategoriesWithProducts() {
  const payload = await getPayloadClient()
  const products = await payload.find({
    collection: 'products',
    where: { published: { equals: true } },
    limit: 500,
    depth: 0,
    select: { categories: true },
    overrideAccess: true,
  })

  const used = new Set<string>()
  for (const product of products.docs) {
    for (const category of product.categories || []) {
      const id = typeof category === 'object' && category ? String(category.id) : String(category)
      used.add(id)
    }
  }

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'order',
    depth: 0,
    overrideAccess: true,
  })

  return categories.docs.filter((category) => used.has(String(category.id)))
}

export async function getSiteSettings() {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
}
