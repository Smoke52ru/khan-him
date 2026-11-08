import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

/** Подключает S3, только если задан S3_BUCKET (Yandex / Selectel / AWS). */
export function createStoragePlugins(): Plugin[] {
  const bucket = process.env.S3_BUCKET
  if (!bucket) return []

  return [
    s3Storage({
      collections: {
        media: true,
        documents: true,
      },
      bucket,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'ru-central1',
        ...(process.env.S3_ENDPOINT
          ? {
              endpoint: process.env.S3_ENDPOINT,
              forcePathStyle: true,
            }
          : {}),
      },
    }),
  ]
}

export function isS3Enabled(): boolean {
  return Boolean(process.env.S3_BUCKET)
}
