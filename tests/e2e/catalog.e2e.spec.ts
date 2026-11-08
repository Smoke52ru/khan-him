import { expect, test } from '@playwright/test'

test.describe('Catalog', () => {
  test('search, open product, download document', async ({ page }) => {
    await page.goto('/catalog')
    await page.getByPlaceholder('Название, формула, CAS, артикул').fill('Каустик')
    await page.getByRole('button', { name: 'Применить' }).click()
    await expect(page.getByRole('link', { name: /Натрий едкий/i }).first()).toBeVisible()

    await page.goto('/catalog?q=H3BO3')
    await expect(page.getByRole('link', { name: /Борная кислота/i }).first()).toBeVisible()
    await page.getByRole('link', { name: /Борная кислота/i }).first().click()
    await expect(page.getByRole('heading', { name: /Борная кислота/i })).toBeVisible()

    const docLink = page.getByRole('link', { name: /Паспорт качества/i }).first()
    const href = await docLink.getAttribute('href')
    expect(href).toBeTruthy()
    const docRes = await page.request.get(href!)
    expect(docRes.ok()).toBeTruthy()
    expect(docRes.headers()['content-type'] || '').toMatch(/pdf|octet-stream/i)
  })

  test('no horizontal scroll on mobile home, catalog and product', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })

    await page.goto('/')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
    ).toBe(false)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()

    await page.goto('/catalog')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
    ).toBe(false)
    await expect(page.getByPlaceholder('Название, формула, CAS, артикул')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Применить' })).toBeVisible()

    await page.goto('/catalog?q=H3BO3')
    await page.getByRole('link', { name: /Борная кислота/i }).first().click()
    await expect(page.getByRole('heading', { name: /Борная кислота/i })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
    ).toBe(false)
  })
})
