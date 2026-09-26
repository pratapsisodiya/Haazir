import { randomUUID } from 'node:crypto'
import type { Redis } from 'ioredis'
import type { KeyValue, Locks } from './deps'

export function redisKeyValue(redis: Redis): KeyValue {
  return {
    exists: async (key) => (await redis.exists(key)) === 1,
    set: async (key, value, ttlSeconds) => {
      await redis.set(key, value, 'EX', ttlSeconds)
    },
  }
}

// Delete the lock only if we still own it: after a timeout another worker may.
const RELEASE = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`

/**
 * A per-key mutex on Redis (SET NX PX + owner token). Messages from one person
 * are processed in order; different people run in parallel (spec §7).
 */
export function redisLocks(
  redis: Redis,
  { ttlMs = 30_000, waitMs = 15_000, pollMs = 50 } = {},
): Locks {
  return {
    async withLock(key, fn) {
      const lockKey = `haazir:lock:${key}`
      const token = randomUUID()
      const deadline = Date.now() + waitMs
      while ((await redis.set(lockKey, token, 'PX', ttlMs, 'NX')) !== 'OK') {
        if (Date.now() > deadline) throw new Error(`Timed out waiting for lock ${key}`)
        await new Promise((r) => setTimeout(r, pollMs))
      }
      try {
        return await fn()
      } finally {
        await redis.eval(RELEASE, 1, lockKey, token)
      }
    },
  }
}
