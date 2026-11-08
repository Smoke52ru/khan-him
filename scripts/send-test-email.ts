import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

await payload.sendEmail({
  to: process.env.REQUESTS_FALLBACK_EMAIL || 'test@example.com',
  subject: 'Тестовое письмо Хан-Хим',
  text: 'Если вы видите это в Mailpit, SMTP настроен верно.',
  html: '<p>Если вы видите это в Mailpit, SMTP настроен верно.</p>',
})

console.log('Test email sent')
process.exit(0)
