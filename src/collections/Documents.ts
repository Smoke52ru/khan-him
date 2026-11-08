import path from 'path'
import { fileURLToPath } from 'url'
import type { CollectionConfig } from 'payload'

import { enforceDocumentSize } from '../lib/uploadLimits'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: {
    singular: 'Документ',
    plural: 'Документы',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeOperation: [enforceDocumentSize],
  },
  upload: {
    staticDir: path.resolve(dirname, '../../uploads/documents'),
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Название документа',
      required: true,
      admin: {
        description: 'Например: «Паспорт качества», «Паспорт безопасности (SDS)».',
      },
    },
  ],
}