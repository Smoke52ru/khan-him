import { afterEach, describe, expect, it, vi } from 'vitest'

describe('createStoragePlugins', () => {
  afterEach(() => {
    vi.resetModules()
    delete process.env.S3_BUCKET
    delete process.env.S3_ACCESS_KEY_ID
    delete process.env.S3_SECRET_ACCESS_KEY
    delete process.env.S3_REGION
    delete process.env.S3_ENDPOINT
  })

  it('без S3_BUCKET не подключает адаптер', async () => {
    const { createStoragePlugins, isS3Enabled } = await import('@/lib/storage')
    expect(isS3Enabled()).toBe(false)
    expect(createStoragePlugins()).toEqual([])
  })

  it('с S3_BUCKET возвращает один плагин', async () => {
    process.env.S3_BUCKET = 'test-bucket'
    process.env.S3_ACCESS_KEY_ID = 'key'
    process.env.S3_SECRET_ACCESS_KEY = 'secret'
    const { createStoragePlugins, isS3Enabled } = await import('@/lib/storage')
    expect(isS3Enabled()).toBe(true)
    expect(createStoragePlugins()).toHaveLength(1)
  })
})
