import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('homepage shows brand and catalog link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toContainText('Хан-Хим')
    await expect(page.getByRole('link', { name: 'Перейти в каталог' })).toBeVisible()
  })
})
