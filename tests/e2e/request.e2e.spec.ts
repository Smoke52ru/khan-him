import { expect, test } from '@playwright/test'

test.describe('Request flow', () => {
  test('add products, submit request, see mailpit message', async ({ page }) => {
    await fetch('http://127.0.0.1:8025/api/v1/messages', { method: 'DELETE' }).catch(() => undefined)

    await page.goto('/catalog')
    const productLinks = page.locator('a[href^="/catalog/"]').filter({ has: page.locator('img') })
    const firstName = (await productLinks.nth(0).innerText()).split('\n')[0].trim()
    const secondName = (await productLinks.nth(1).innerText()).split('\n')[0].trim()
    await page.getByRole('button', { name: 'В запрос' }).nth(0).click()
    await page.getByRole('button', { name: 'В запрос' }).nth(1).click()
    await page.getByRole('link', { name: /Запрос \(/ }).click()
    await expect(page.getByRole('heading', { name: 'Список запроса' })).toBeVisible()
    await expect(page.getByPlaceholder('например, 2 бочки по 200 кг').first()).toBeVisible({
      timeout: 10000,
    })

    await page.getByPlaceholder('например, 2 бочки по 200 кг').first().fill('1 бочка')
    await page.waitForTimeout(3500)
    await page.getByLabel('Имя *').fill('Тест Заказчик')
    await page.getByLabel('Телефон *').fill('+79990001122')
    await page.getByLabel('Email').fill('buyer@example.com')
    await page.locator('input[type="checkbox"]').nth(0).check()
    await page.locator('input[type="checkbox"]').nth(1).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText(/Заявка принята/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('link', { name: /^Запрос$/ })).toBeVisible()

    const messages = await fetch('http://127.0.0.1:8025/api/v1/messages').then((r) => r.json())
    expect(messages.total).toBeGreaterThan(0)
    const latestId = messages.messages[0].ID
    const full = await fetch(`http://127.0.0.1:8025/api/v1/message/${latestId}`).then((r) => r.json())
    const body = `${full.Text || ''}\n${full.HTML || ''}`
    expect(body).toMatch(new RegExp(firstName.slice(0, 8), 'i'))
    expect(body).toMatch(new RegExp(secondName.slice(0, 8), 'i'))

    const email = process.env.ADMIN_EMAIL || 'admin@example.com'
    const password = process.env.ADMIN_PASSWORD || 'change-me'
    await page.goto('/admin')
    await page.locator('input[name="email"], input[type="email"]').first().fill(email)
    await page.locator('input[name="password"], input[type="password"]').first().fill(password)
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page.getByRole('link', { name: 'Выйти' })).toBeVisible({ timeout: 20000 })

    const loginRes = await page.request.post('/api/users/login', {
      data: { email, password },
    })
    expect(loginRes.ok()).toBeTruthy()
    const { token } = (await loginRes.json()) as { token: string }
    const requestsRes = await page.request.get('/api/requests?limit=10&sort=-createdAt', {
      headers: { Authorization: `JWT ${token}` },
    })
    expect(requestsRes.ok()).toBeTruthy()
    const requests = await requestsRes.json()
    const found = (requests.docs as Array<{ name: string }>).some((doc) => doc.name === 'Тест Заказчик')
    expect(found).toBeTruthy()
  })
})

