import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

function parseFrom(raw: string | undefined): { address: string; name: string } {
  const value = raw?.trim() || 'noreply@localhost'
  const match = value.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/)
  if (!match) {
    return { address: value, name: 'Хан-Хим' }
  }
  const name = match[1]?.trim() || 'Хан-Хим'
  const address = match[2]?.trim() || 'noreply@localhost'
  return { address, name }
}

export function createEmailAdapter() {
  const { address, name } = parseFrom(process.env.SMTP_FROM)
  const host = process.env.SMTP_HOST || '127.0.0.1'
  const port = Number(process.env.SMTP_PORT || 1025)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  return nodemailerAdapter({
    defaultFromAddress: address,
    defaultFromName: name,
    transportOptions: {
      host,
      port,
      secure: false,
      ...(user
        ? {
            auth: {
              user,
              pass: pass || '',
            },
          }
        : {}),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    },
  })
}
