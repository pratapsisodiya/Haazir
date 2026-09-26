import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { text } from 'node:stream/consumers'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { assertKey, createStorage, extensionFor, LocalStorage, S3Storage } from '../index'

let dir: string
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'haazir-storage-'))
})
afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('LocalStorage', () => {
  it('stores a buffer, a Node stream and a web stream, and reads them back', async () => {
    const storage = new LocalStorage(dir)
    await storage.put('orgs/o1/media/a.txt', Buffer.from('buffer'), 'text/plain')
    await storage.put('orgs/o1/media/b.txt', Readable.from(['node ', 'stream']), 'text/plain')
    const web = new Response('web stream').body!
    const { size } = await storage.put('orgs/o1/media/c.txt', web, 'text/plain')
    expect(size).toBe(10)

    const got = await storage.get('orgs/o1/media/b.txt')
    expect(await text(got.body)).toBe('node stream')
    expect(got.contentType).toBe('text/plain')
    expect(await readFile(join(dir, 'orgs/o1/media/c.txt'), 'utf8')).toBe('web stream')
  })

  it('deletes, and a missing key fails on get', async () => {
    const storage = new LocalStorage(dir)
    await storage.put('x/y.txt', Buffer.from('1'), 'text/plain')
    await storage.delete('x/y.txt')
    await expect(storage.get('x/y.txt')).rejects.toThrow(/ENOENT/)
  })

  it('refuses keys that could escape the folder', async () => {
    const storage = new LocalStorage(dir)
    for (const key of ['../etc/passwd', '/abs', 'a/../../b', 'sp ace', '']) {
      await expect(storage.put(key, Buffer.from('x'), 'text/plain')).rejects.toThrow(
        /Invalid storage key/,
      )
    }
  })
})

describe('S3Storage', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterAll(() => server.close())

  it('uploads with path-style addressing and the content type', async () => {
    let seen: { url: string; type: string | null; body: string } | undefined
    server.use(
      http.put('https://r2.test/haazir-media/*', async ({ request }) => {
        seen = {
          url: request.url,
          type: request.headers.get('content-type'),
          body: await request.text(),
        }
        return new HttpResponse(null, { status: 200, headers: { etag: '"abc"' } })
      }),
    )
    const storage = new S3Storage({
      endpoint: 'https://r2.test',
      region: 'auto',
      bucket: 'haazir-media',
      accessKeyId: 'id',
      secretAccessKey: 'secret',
    })
    const { size } = await storage.put('orgs/o1/media/m.ogg', Buffer.from('OggS...'), 'audio/ogg')
    expect(seen?.url).toMatch(/^https:\/\/r2\.test\/haazir-media\/orgs\/o1\/media\/m\.ogg/)
    expect(seen?.type).toBe('audio/ogg')
    expect(seen?.body).toBe('OggS...')
    expect(size).toBe(7)
  })
})

describe('helpers', () => {
  it('chooses the driver from env', () => {
    const base = { STORAGE_REGION: 'auto', STORAGE_LOCAL_DIR: dir }
    expect(createStorage(base)).toBeInstanceOf(LocalStorage)
    expect(
      createStorage({
        ...base,
        STORAGE_ENDPOINT: 'https://r2.test',
        STORAGE_BUCKET: 'b',
        STORAGE_ACCESS_KEY: 'k',
        STORAGE_SECRET_KEY: 's',
      }),
    ).toBeInstanceOf(S3Storage)
  })

  it('maps WhatsApp media types to extensions', () => {
    expect(extensionFor('audio/ogg; codecs=opus')).toBe('ogg')
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('application/x-unknown')).toBe('bin')
    expect(extensionFor(undefined)).toBe('bin')
  })

  it('validates keys', () => {
    expect(() => assertKey('orgs/1/media/a.ogg')).not.toThrow()
    expect(() => assertKey('orgs/../x')).toThrow()
  })
})
