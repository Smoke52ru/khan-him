import path from 'path'
import { fileURLToPath } from 'url'
import type { CollectionConfig } from 'payload'

import { enforceMediaSize } from '../lib/uploadLimits'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Фото',
    plural: 'Медиатека',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeOperation: [enforceMediaSize],
  },
  upload: {
    staticDir: path.resolve(dirname, '../../uploads/media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      {
        name: 'card',
        width: 600,
        height: 450,
        position: 'centre',
      },
      {
        name: 'thumbnail',
        width: 300,
        height: 225,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Подпись',
      required: true,
    },
  ],
}
