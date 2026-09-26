import type { Job } from 'bullmq'
import { describe, expect, it } from 'vitest'
import { WORKER_HEARTBEAT_KEY } from '@haazir/shared'
import { heartbeatProcessor } from '../heartbeat'

describe('heartbeatProcessor', () => {
  it('writes the time with an expiry of three missed beats', async () => {
    const calls: unknown[][] = []
    const redis = { set: async (...args: unknown[]) => void calls.push(args) }
    const fixed = new Date('2026-10-06T14:30:00.000Z')

    const result = await heartbeatProcessor(redis, () => fixed)({} as Job)

    expect(result).toEqual({ at: '2026-10-06T14:30:00.000Z' })
    expect(calls).toEqual([[WORKER_HEARTBEAT_KEY, '2026-10-06T14:30:00.000Z', 'EX', 180]])
  })
})
