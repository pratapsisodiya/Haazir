import { Router } from 'express'
import { WORKER_HEARTBEAT_KEY } from '@haazir/shared'

export interface HealthDeps {
  database: { ping(): Promise<void> }
  redis: {
    ping(): Promise<unknown>
    get(key: string): Promise<string | null>
  }
}

const CHECK_TIMEOUT_MS = 2_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timed out')), ms).unref()),
  ])
}

async function check(fn: () => Promise<unknown>): Promise<'ok' | 'down'> {
  try {
    await withTimeout(fn(), CHECK_TIMEOUT_MS)
    return 'ok'
  } catch {
    return 'down'
  }
}

export function healthRouter(deps: HealthDeps) {
  const router = Router()

  /** Liveness: the process is up. Never touches dependencies, so it can't flap. */
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) })
  })

  /**
   * Readiness: can this instance do useful work? 503 when Postgres or Redis is
   * unreachable, so the load balancer stops sending traffic. The worker's
   * heartbeat is reported but doesn't fail readiness: the API can still serve
   * the dashboard while the worker restarts.
   */
  router.get('/ready', async (_req, res) => {
    const [database, redis] = await Promise.all([
      check(() => deps.database.ping()),
      check(() => deps.redis.ping()),
    ])

    let worker: 'ok' | 'stale' | 'unknown' = 'unknown'
    if (redis === 'ok') {
      const beat = await deps.redis.get(WORKER_HEARTBEAT_KEY).catch(() => null)
      if (beat) worker = Date.now() - Date.parse(beat) < 3 * 60_000 ? 'ok' : 'stale'
    }

    const ready = database === 'ok' && redis === 'ok'
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks: { database, redis, worker },
    })
  })

  return router
}
