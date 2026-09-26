import type { AnyDatabase } from '@haazir/db'
import type {
  AiReplyJob,
  JobQueue,
  MediaJob,
  OutboundJob,
  WhatsappAccount,
} from '@haazir/messaging'
import type { Storage } from '@haazir/storage'
import type { GraphClient } from '@haazir/whatsapp'

/** Small key-value store with expiry (Redis in production, a Map in tests). */
export interface KeyValue {
  exists(key: string): Promise<boolean>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
}

export interface Locks {
  /** Runs `fn` while holding `key`, so work for one contact never interleaves. */
  withLock<T>(key: string, fn: () => Promise<T>): Promise<T>
}

export interface Log {
  debug(obj: object, msg?: string): void
  info(obj: object, msg?: string): void
  warn(obj: object, msg?: string): void
  error(obj: object, msg?: string): void
}

/**
 * Everything a processor touches, passed in rather than imported, so the same
 * code runs against Redis + Postgres in production and fakes + PGlite in tests.
 */
export interface Deps {
  db: AnyDatabase
  kv: KeyValue
  locks: Locks
  queues: {
    aiReply: JobQueue<AiReplyJob>
    media: JobQueue<MediaJob>
    outbound: JobQueue<OutboundJob>
  }
  storage: Storage
  graph(account: WhatsappAccount): GraphClient
  log: Log
  now(): Date
}
