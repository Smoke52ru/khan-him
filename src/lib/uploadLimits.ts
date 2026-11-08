import type { CollectionBeforeOperationHook } from 'payload'

const MB = 1024 * 1024

export const MEDIA_MAX_BYTES = 10 * MB
export const DOCUMENT_MAX_BYTES = 20 * MB

function createFilesizeHook(maxBytes: number, label: string): CollectionBeforeOperationHook {
  return ({ operation, req }) => {
    if (operation !== 'create' && operation !== 'update') return
    const file = req.file
    if (!file?.size) return
    if (file.size > maxBytes) {
      throw new Error(
        `${label}: размер файла превышает ${Math.round(maxBytes / MB)} МБ (получено ${(file.size / MB).toFixed(1)} МБ)`,
      )
    }
  }
}

export const enforceMediaSize = createFilesizeHook(MEDIA_MAX_BYTES, 'Фото')
export const enforceDocumentSize = createFilesizeHook(DOCUMENT_MAX_BYTES, 'Документ')
