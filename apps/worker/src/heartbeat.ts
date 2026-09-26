import type { Job } from 'bullmq'
import { WORKER_HEARTBEAT_KEY } from '@haazir/shared'
export const HEARTBEAT_EVERY_MS = 60_000

interface KeyValue {
  set(key: string, value: string, mode: 'EX', seconds: number): Promise<unknown>
}

/**
 * Proves the whole job path works, not just that the process is alive: the
 * scheduler enqueues through Redis, a worker picks it up, and the result lands
 * where the API's /ready can read it. It expires after three missed beats.
 */
export function heartbeatProcessor(redis: KeyValue, now: () => Date = () => new Date()) {
  return async (_job: Job) => {
    const at = now().toISOString()
    await redis.set(WORKER_HEARTBEAT_KEY, at, 'EX', (HEARTBEAT_EVERY_MS / 1000) * 3)
    return { at }
  }
}
