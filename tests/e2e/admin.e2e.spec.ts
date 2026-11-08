import { expect, test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const pngPath = path.resolve(dirname, '../../src/seed/assets/KH001.png')
const pdfPath = path.resolve(dirname, '../../src/seed/assets/pasport-obrazec.pdf')

test.describe('Admin Panel', () => {
  test('login, create product, unpublish shows 404', async ({ page }) => {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com'
    const password = process.env.ADMIN_PASSWORD || 'change-me'
    const slug = `e2e-product-${Date.now()}`
    const name = `E2E Товар ${Date.now()}`

    await page.goto('/admin')
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible({
      timeout: 15000,
    })
    await page.locator('input[name="email"], input[type="email"]').first().fill(email)
    await page.locator('input[name="password"], input[type="password"]').first().fill(password)
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page.getByRole('link', { name: 'Выйти' })).toBeVisible({ timeout: 20000 })

    const loginRes = await page.request.post('/api/users/login', {
      data: { email, password },
    })
    expect(loginRes.ok(), await loginRes.text()).toBeTruthy()
    const { token } = (await loginRes.json()) as { token: string }
    const auth = { Authorization: `JWT ${token}` }

    const mediaRes = await page.request.post('/api/media', {
      headers: auth,
      multipart: {
        file: {
          name: 'e2e-photo.png',
          mimeType: 'image/png',
          buffer: fs.readFileSync(pngPath),
        },
        _payload: JSON.stringify({ alt: 'E2E photo' }),
      },
    })
    expect(mediaRes.ok(), await mediaRes.text()).toBeTruthy()
    const media = await mediaRes.json()

    const docRes = await page.request.post('/api/documents', {
      headers: auth,
      multipart: {
        file: {
          name: 'e2e-doc.pdf',
          mimeType: 'application/pdf',
          buffer: fs.readFileSync(pdfPath),
        },
        _payload: JSON.stringify({ title: 'Паспорт качества E2E' }),
      },
    })
    expect(docRes.ok(), await docRes.text()).toBeTruthy()
    const document = await docRes.json()

    const productRes = await page.request.post('/api/products', {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: {
        name,
        slug,
        published: true,
        availability: 'stock',
        gallery: [media.doc.id],
        documents: [document.doc.id],
        packaging: 'мешок 25 кг',
      },
    })
    expect(productRes.ok(), await productRes.text()).toBeTruthy()
    const product = await productRes.json()
    const productId = product.doc.id

    await page.goto(`/catalog/${slug}`)
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('link', { name: /Паспорт качества E2E/i })).toBeVisible()

    const unpublish = await page.request.patch(`/api/products/${productId}`, {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: { published: false },
    })
    expect(unpublish.ok(), await unpublish.text()).toBeTruthy()

    const response = await page.goto(`/catalog/${slug}`)
    expect(response?.status()).toBe(404)
  })
})
