import fs from 'fs'
import os from 'os'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { DOCUMENT_MAX_BYTES, MEDIA_MAX_BYTES } from '@/lib/uploadLimits'

let payload: Payload
const tmpFiles: string[] = []

function writeTemp(name: string, bytes: number, header: Buffer): string {
  const filePath = path.join(os.tmpdir(), `khan-him-${Date.now()}-${name}`)
  const body = Buffer.alloc(Math.max(0, bytes - header.length), 0)
  fs.writeFileSync(filePath, Buffer.concat([header, body]))
  tmpFiles.push(filePath)
  return filePath
}

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(() => {
  for (const file of tmpFiles) {
    try {
      fs.unlinkSync(file)
    } catch {
      // ignore
    }
  }
})

describe('uploads', () => {
  it('отклоняет фото неверного типа', async () => {
    const filePath = writeTemp('bad.txt', 64, Buffer.from('not-an-image'))
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'тест' },
        filePath,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('отклоняет слишком большое фото', async () => {
    // минимальный JPEG-заголовок + большой размер
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00,
    ])
    const filePath = writeTemp('big.jpg', MEDIA_MAX_BYTES + 1024, jpegHeader)
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'большое' },
        filePath,
        overrideAccess: true,
      }),
    ).rejects.toThrow(/МБ/)
  })

  it('отклоняет слишком большой документ', async () => {
    const filePath = writeTemp('big.pdf', DOCUMENT_MAX_BYTES + 1024, Buffer.from('%PDF-1.4'))
    await expect(
      payload.create({
        collection: 'documents',
        data: { title: 'Паспорт' },
        filePath,
        overrideAccess: true,
      }),
    ).rejects.toThrow(/МБ/)
  })
})
