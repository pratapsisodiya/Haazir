import { Queue, Worker, type Job } from 'bullmq'
import { Redis } from 'ioredis'
import { AiNotConfiguredError, createModels, createTranscriber, type Models } from '@haazir/ai-core'
import { createDb } from '@haazir/db'
import {
  graphClientFor,
  type AiReplyJob,
  type InboundJob,
  type IngestJob,
  type MediaJob,
  type OutboundJob,
} from '@haazir/messaging'
import { JOB_OPTIONS, QUEUES } from '@haazir/shared'
import { createStorage } from '@haazir/storage'
import type { Deps } from './deps'
import { env } from './env'
import { HEARTBEAT_EVERY_MS, heartbeatProcessor } from './heartbeat'
import { createLogger } from './logger'
import { processAiReply } from './processors/aiReply'
import { processInbound } from './processors/inbound'
import { processIngest } from './processors/ingest'
import { processMedia } from './processors/media'
import { processOutbound } from './processors/outbound'
import { redisKeyValue, redisLocks } from './redis'

const logger = createLogger({ level: env.LOG_LEVEL, pretty: env.NODE_ENV === 'development' })

// BullMQ needs `maxRetriesPerRequest: null` on worker connections: blocking
// commands must wait for Redis to come back rather than error out.
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
connection.on('error', (err) => logger.warn({ err: err.message }, 'redis error'))

const database = createDb(env.DATABASE_URL, { max: 20 })

const queue = <T>(name: string, defaultJobOptions: object) =>
  new Queue<T>(name, { connection, defaultJobOptions })
const systemQueue = new Queue(QUEUES.system, { connection })
const aiReplyQueue = queue<AiReplyJob>(QUEUES.aiReply, JOB_OPTIONS.aiReply)
const mediaQueue = queue<MediaJob>(QUEUES.media, JOB_OPTIONS.media)
const outboundQueue = queue<OutboundJob>(QUEUES.outbound, JOB_OPTIONS.outbound)

// Without a key the worker still runs: the bot hands every chat to staff
// rather than leaving people unanswered.
let models: Models | null = null
try {
  models = createModels(env)
  logger.info({ provider: env.LLM_PROVIDER, ...models.ids }, 'AI brain ready')
} catch (err) {
  if (!(err instanceof AiNotConfiguredError)) throw err
  logger.warn(
    { missing: err.missing },
    'AI not configured: every conversation will be handed to staff',
  )
}

const stt = createTranscriber(env)
if (!stt)
  logger.warn(
    { provider: env.STT_PROVIDER },
    'speech-to-text not configured: voice notes go to staff',
  )

const deps: Deps = {
  db: database.db,
  kv: redisKeyValue(connection),
  locks: redisLocks(connection),
  queues: {
    aiReply: { add: (name, data, opts) => aiReplyQueue.add(name, data, opts) },
    media: { add: (name, data, opts) => mediaQueue.add(name, data, opts) },
    outbound: { add: (name, data, opts) => outboundQueue.add(name, data, opts) },
  },
  storage: createStorage(env),
  graph: (account) => graphClientFor(account, env),
  models,
  stt,
  log: logger,
  now: () => new Date(),
}

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

const isLastAttempt = (job: Job) => job.attemptsMade + 1 >= (job.opts.attempts ?? 1)

// Concurrency per spec §7. The outbound limiter keeps us under WhatsApp's
// default 80 messages/second per number (one number in Phase 1; per-number
// limits come with multi-tenancy in Phase 3).
const workers = [
  new Worker(QUEUES.system, heartbeatProcessor(connection), { connection, concurrency: 1 }),
  new Worker<InboundJob>(
    QUEUES.inbound,
    (job) => processInbound(deps, job.data, job.attemptsMade),
    { connection, concurrency: 20 },
  ),
  new Worker<AiReplyJob>(QUEUES.aiReply, (job) => processAiReply(deps, job.data), {
    connection,
    concurrency: 10,
  }),
  new Worker<OutboundJob>(
    QUEUES.outbound,
    (job) => processOutbound(deps, job.data, isLastAttempt(job)),
    { connection, concurrency: 20, limiter: { max: 80, duration: 1000 } },
  ),
  new Worker<MediaJob>(QUEUES.media, (job) => processMedia(deps, job.data, isLastAttempt(job)), {
    connection,
    concurrency: 5,
  }),
  new Worker<IngestJob>(QUEUES.ingest, (job) => processIngest(deps, job.data), {
    connection,
    concurrency: 3,
  }),
]

for (const worker of workers) {
  worker.on('failed', (job, err) =>
    logger.error(
      { queue: worker.name, jobId: job?.id, attempt: job?.attemptsMade, err: err.message },
      'job failed',
    ),
  )
  worker.on('error', (err) =>
    logger.error({ queue: worker.name, err: err.message }, 'worker error'),
  )
}

logger.info({ queues: workers.map((w) => w.name) }, 'worker ready')

// Graceful shutdown: let running jobs finish (BullMQ waits for them), then
// release Redis and Postgres. Anything unfinished is retried by the next worker.
let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')
  const force = setTimeout(() => process.exit(1), 30_000)
  force.unref()
  await Promise.allSettled(workers.map((w) => w.close()))
  await Promise.allSettled(
    [systemQueue, aiReplyQueue, mediaQueue, outboundQueue].map((q) => q.close()),
  )
  await Promise.allSettled([connection.quit(), database.close()])
  logger.info('bye')
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
