import { describe, it, expect, beforeAll } from 'vitest'
import { getPlatformProxy } from 'wrangler'

describe('Wrangler Proxy', () => {
  it('loads the proxy', async () => {
    const proxy = await getPlatformProxy()
    expect(proxy.env.DB).toBeDefined()
  })
})
