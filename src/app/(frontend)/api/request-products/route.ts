import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ids = (searchParams.get('ids') || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => (Number.isFinite(Number(id)) ? Number(id) : id))

  if (ids.length === 0) {
    return NextResponse.json({ products: [] })
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 0,
    overrideAccess: true,
  })

  return NextResponse.json({
    products: result.docs.map((product) => ({
      id: String(product.id),
      name: product.name,
      sku: product.sku,
      published: product.published,
    })),
  })
}
