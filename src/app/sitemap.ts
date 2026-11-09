import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/payload'
import { resolvePublicServerURL } from '@/lib/serverURL'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolvePublicServerURL().serverURL
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/catalog`, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const payload = await getPayloadClient()
    const products = await payload.find({
      collection: 'products',
      where: { published: { equals: true } },
      limit: 1000,
      depth: 0,
      select: { slug: true, updatedAt: true },
      overrideAccess: true,
    })

    return [
      ...staticRoutes,
      ...products.docs.map((product) => ({
        url: `${base}/catalog/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
