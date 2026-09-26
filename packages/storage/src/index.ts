import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as NodeWebStream } from 'node:stream/web'
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

/**
 * Where media and brochures live (spec §4): one small interface, two drivers.
 * S3-compatible in staging and production (Cloudflare R2, MinIO, AWS), a
 * folder on disk in development. Keys look like `orgs/<orgId>/media/<id>.ogg`.
 */
export interface Storage {
  put(key: string, body: Body, contentType: string): Promise<{ key: string; size: number }>
  get(key: string): Promise<{ body: Readable; contentType?: string }>
  delete(key: string): Promise<void>
}

export type Body = Buffer | Readable | ReadableStream<Uint8Array>

// Letters, digits and . _ - / only; no "..", no leading slash. Keys are built
// from our own ids, so anything else is a bug worth failing loudly on.
const KEY = /^(?!.*\.\.)(?!\/)[A-Za-z0-9._\-/]{1,512}$/

export function assertKey(key: string) {
  if (!KEY.test(key)) throw new Error(`Invalid storage key: ${JSON.stringify(key)}`)
}

function toNodeStream(body: Body): Readable {
  if (Buffer.isBuffer(body)) return Readable.from(body)
  if (body instanceof Readable) return body
  return Readable.fromWeb(body as NodeWebStream<Uint8Array>)
}

export class LocalStorage implements Storage {
  private readonly root: string

  constructor(dir: string) {
    this.root = resolve(dir)
  }

  private path(key: string) {
    assertKey(key)
    const full = resolve(this.root, key)
    if (!full.startsWith(this.root + sep)) throw new Error(`Invalid storage key: ${key}`)
    return full
  }

  async put(key: string, body: Body, contentType: string) {
    const file = this.path(key)
    await mkdir(dirname(file), { recursive: true })
    await pipeline(toNodeStream(body), createWriteStream(file))
    await writeFile(`${file}.meta.json`, JSON.stringify({ contentType }))
    return { key, size: (await stat(file)).size }
  }

  async get(key: string) {
    const file = this.path(key)
    await stat(file) // throws ENOENT before handing back a stream
    const meta = await readFile(`${file}.meta.json`, 'utf8')
      .then((s) => JSON.parse(s) as { contentType?: string })
      .catch(() => ({ contentType: undefined }))
    return { body: createReadStream(file), contentType: meta.contentType }
  }

  async delete(key: string) {
    const file = this.path(key)
    await rm(file, { force: true })
    await rm(`${file}.meta.json`, { force: true })
  }
}

export interface S3Config {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export class S3Storage implements Storage {
  private readonly client: S3Client

  constructor(private readonly config: S3Config) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      // Path-style works on R2, MinIO and AWS alike; virtual-host style doesn't on MinIO.
      forcePathStyle: true,
    })
  }

  async put(key: string, body: Body, contentType: string) {
    assertKey(key)
    let size = 0
    const counted = toNodeStream(body).on('data', (chunk: Buffer) => {
      size += chunk.length
    })
    // Upload streams in parts, so a 16 MB voice note never sits in memory whole.
    await new Upload({
      client: this.client,
      params: { Bucket: this.config.bucket, Key: key, Body: counted, ContentType: contentType },
    }).done()
    return { key, size }
  }

  async get(key: string) {
    assertKey(key)
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
    )
    if (!res.Body) throw new Error(`Empty object: ${key}`)
    return { body: res.Body as Readable, contentType: res.ContentType }
  }

  async delete(key: string) {
    assertKey(key)
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }))
  }
}

/** Picks the driver from the validated env: S3 when an endpoint is set, else local disk. */
export function createStorage(env: {
  STORAGE_ENDPOINT?: string
  STORAGE_REGION: string
  STORAGE_BUCKET?: string
  STORAGE_ACCESS_KEY?: string
  STORAGE_SECRET_KEY?: string
  STORAGE_LOCAL_DIR: string
}): Storage {
  if (env.STORAGE_ENDPOINT) {
    return new S3Storage({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      bucket: env.STORAGE_BUCKET!,
      accessKeyId: env.STORAGE_ACCESS_KEY!,
      secretAccessKey: env.STORAGE_SECRET_KEY!,
    })
  }
  return new LocalStorage(env.STORAGE_LOCAL_DIR)
}

/** A sensible file extension for a MIME type, so stored files open correctly. */
export function extensionFor(mime: string | undefined): string {
  const base = mime?.split(';')[0]?.trim().toLowerCase()
  const known: Record<string, string> = {
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/amr': 'amr',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
  }
  return (base && known[base]) ?? 'bin'
}
