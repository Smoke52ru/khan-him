import { execFileSync } from 'child_process'
import path from 'path'
import { getPayload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

const root = path.resolve(process.cwd())

function runSeed(args: string[] = []): void {
  execFileSync('pnpm', ['exec', 'tsx', './scripts/seed.ts', ...args], {
    cwd: root,
    env: process.env,
    stdio: 'pipe',
  })
}

describe('seed', () => {
  beforeAll(async () => {
    await getPayload({ config })
  })

  it('повторный запуск и --reset дают 25 товаров', async () => {
    runSeed(['--reset'])
    const payload = await getPayload({ config })
    const first = await payload.count({ collection: 'products', overrideAccess: true })
    expect(first.totalDocs).toBe(25)

    runSeed()
    const second = await payload.count({ collection: 'products', overrideAccess: true })
    expect(second.totalDocs).toBe(25)

    runSeed(['--reset'])
    const third = await payload.count({ collection: 'products', overrideAccess: true })
    expect(third.totalDocs).toBe(25)
  }, 120_000)
})
