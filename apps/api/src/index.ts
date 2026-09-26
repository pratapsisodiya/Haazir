import { Redis } from 'ioredis'
import { createDb } from '@haazir/db'
import { createApp } from './app'
import { env } from './env'
import { createLogger } from './logger'

const logger = createLogger({
  name: 'api',
  level: env.LOG_LEVEL,
  pretty: env.NODE_ENV === 'development',
})

const database = createDb(env.DATABASE_URL)
// Fail fast on commands while Redis is down instead of queueing them forever;
// /ready reports it and recovers on its own when Redis is back.
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: false })
redis.on('error', (err) => logger.warn({ err: err.message }, 'redis error'))

const app = createApp({
  logger,
  database,
  redis,
  corsOrigins: [env.APP_URL],
})

const port = Number(new URL(env.API_URL).port || 4000)
const server = app.listen(port, () => {
  logger.info(`API listening on http://localhost:${port}`)
})

// Graceful shutdown: stop taking connections, let in-flight requests finish,
// then close pools. Containers get SIGTERM; Ctrl-C sends SIGINT.
let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  const force = setTimeout(() => {
    logger.error('forced exit after 10s')
    process.exit(1)
  }, 10_000)
  force.unref()

  server.close(async () => {
    await Promise.allSettled([database.close(), redis.quit()])
    logger.info('bye')
    process.exit(0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unhandled rejection')
})
