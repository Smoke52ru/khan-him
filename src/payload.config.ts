import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { Documents } from './collections/Documents'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Requests } from './collections/Requests'
import { Users } from './collections/Users'
import { AboutPage, PdConsent, PrivacyPolicy } from './globals/ContentPages'
import { SiteSettings } from './globals/SiteSettings'
import { createEmailAdapter } from './lib/email'
import { createStoragePlugins } from './lib/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Хан-Хим',
    },
  },
  i18n: {
    fallbackLanguage: 'ru',
    supportedLanguages: { ru },
  },
  collections: [Users, Categories, Media, Documents, Products, Requests],
  globals: [SiteSettings, AboutPage, PrivacyPolicy, PdConsent],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  email: createEmailAdapter(),
  sharp,
  plugins: [...createStoragePlugins()],
})
