import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '@payload-config'

import { SEED_CATEGORIES, SEED_PRODUCTS } from './data'
import { paragraph } from './richText'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const assetsDir = path.resolve(dirname, 'assets')

const reset = process.argv.includes('--reset')

async function clearCatalog(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<void> {
  for (const collection of ['products', 'categories', 'documents', 'media'] as const) {
    const existing = await payload.find({
      collection,
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of existing.docs) {
      await payload.delete({
        collection,
        id: doc.id,
        overrideAccess: true,
      })
    }
  }
}

async function ensureAdmin(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'change-me'
  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.totalDocs > 0) {
    console.log(`Admin already exists: ${email}`)
    return
  }
  await payload.create({
    collection: 'users',
    data: { email, password },
    overrideAccess: true,
  })
  console.log(`Admin created: ${email}`)
}

async function seed(): Promise<void> {
  const payload = await getPayload({ config })

  await ensureAdmin(payload)

  if (reset) {
    console.log('Resetting catalog...')
    await clearCatalog(payload)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      companyName: 'Хан-Хим',
      phone: '+7 (900) 000-00-00',
      email: 'info@example.com',
      address: 'Россия (демо-данные)',
      inn: '0000000000',
      ogrn: '0000000000000',
      kpp: '000000000',
      legalAddress: 'Юридический адрес (демо)',
      requestEmails: [{ email: process.env.REQUESTS_FALLBACK_EMAIL || 'requests@example.com' }],
    },
    overrideAccess: true,
  })

  for (const slug of ['about-page', 'privacy-policy', 'pd-consent'] as const) {
    await payload.updateGlobal({
      slug,
      data: {
        isDraft: true,
        body: paragraph(
          'Черновик юридического или информационного текста. Замените содержимым от заказчика.',
        ),
      },
      overrideAccess: true,
    })
  }

  const categoryIds: number[] = []
  for (const category of SEED_CATEGORIES) {
    const existing = await payload.find({
      collection: 'categories',
      where: { name: { equals: category.name } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      categoryIds.push(Number(existing.docs[0].id))
      continue
    }
    const created = await payload.create({
      collection: 'categories',
      data: { name: category.name, order: category.order },
      overrideAccess: true,
    })
    categoryIds.push(Number(created.id))
  }
  console.log('Categories ready:', categoryIds.length)

  let documentId: number | null = null
  const existingDoc = await payload.find({
    collection: 'documents',
    where: { title: { equals: 'Паспорт качества (образец)' } },
    limit: 1,
    overrideAccess: true,
  })
  if (existingDoc.totalDocs > 0) {
    documentId = Number(existingDoc.docs[0].id)
  } else {
    const createdDoc = await payload.create({
      collection: 'documents',
      data: { title: 'Паспорт качества (образец)' },
      filePath: path.join(assetsDir, 'pasport-obrazec.pdf'),
      overrideAccess: true,
    })
    documentId = Number(createdDoc.id)
  }

  for (const product of SEED_PRODUCTS) {
    const existing = await payload.find({
      collection: 'products',
      where: { sku: { equals: product.sku } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`Skip existing product ${product.sku}`)
      continue
    }

    let gallery: number[] = []
    const withImage = product.withImage !== false
    if (withImage) {
      const imagePath = path.join(assetsDir, `${product.sku}.png`)
      const media = await payload.create({
        collection: 'media',
        data: { alt: product.name },
        filePath: imagePath,
        overrideAccess: true,
      })
      gallery = [Number(media.id)]
    }

    await payload.create({
      collection: 'products',
      data: {
        name: product.name,
        sku: product.sku,
        published: true,
        availability: product.availability,
        altNames: product.altNames,
        formula: product.formula,
        cas: product.cas,
        gost: product.gost,
        tu: product.tu,
        packaging: product.packaging,
        categories: [categoryIds[product.categoryIndex]],
        gallery,
        documents: product.withDocument && documentId ? [documentId] : [],
        description: paragraph(product.description),
        application: paragraph(product.application),
        storage: paragraph(product.storage),
        transport: paragraph(product.transport),
        safety: paragraph(product.safety),
        specs: product.specs,
      },
      overrideAccess: true,
    })
    console.log(`Created product ${product.sku}`)
  }

  const count = await payload.count({ collection: 'products', overrideAccess: true })
  console.log(`Seed complete. Products: ${count.totalDocs}`)
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
