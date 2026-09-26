import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { QUEUES } from '@haazir/shared'
import { env } from './env'
import { HEARTBEAT_EVERY_MS, heartbeatProcessor } from './heartbeat'
import { createLogger } from './logger'

const logger = createLogger({ level: env.LOG_LEVEL, pretty: env.NODE_ENV === 'development' })

// BullMQ needs `maxRetriesPerRequest: null` on worker connections: blocking
// commands must wait for Redis to come back rather than error out.
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
connection.on('error', (err) => logger.warn({ err: err.message }, 'redis error'))

// Phase 0 runs only the system queue. The processors in spec §7 (inbound,
// ai-reply, outbound, …) are added phase by phase, each as its own Worker.
const systemQueue = new Queue(QUEUES.system, { connection })

// Registered on every (re)connect, not just at boot: if Redis restarts without
// its data, the schedule would otherwise vanish until the worker restarted.
// Upserting is idempotent, so repeating it is harmless.
async function scheduleHeartbeat() {
  await systemQueue.upsertJobScheduler(
    'heartbeat',
    { every: HEARTBEAT_EVERY_MS },
    { name: 'heartbeat', opts: { removeOnComplete: 10, removeOnFail: 50 } },
  )
}
await scheduleHeartbeat()
connection.on('ready', () => {
  scheduleHeartbeat().catch((err) =>
    logger.error({ err: err.message }, 'heartbeat schedule failed'),
  )
})

const workers = [
  new Worker(QUEUES.system, heartbeatProcessor(connection), { connection, concurrency: 1 }),
]

for (const worker of workers) {
  worker.on('failed', (job, err) =>
    logger.error({ queue: worker.name, jobId: job?.id, err: err.message }, 'job failed'),
  )
  worker.on('error', (err) =>
    logger.error({ queue: worker.name, err: err.message }, 'worker error'),
  )
}

logger.info({ queues: workers.map((w) => w.name) }, 'worker ready')

// Graceful shutdown: let running jobs finish (BullMQ waits for them), then
// release Redis. Anything unfinished is retried by the next worker.
let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')
  const force = setTimeout(() => process.exit(1), 30_000)
  force.unref()
  await Promise.allSettled(workers.map((w) => w.close()))
  await systemQueue.close()
  await connection.quit()
  logger.info('bye')
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
