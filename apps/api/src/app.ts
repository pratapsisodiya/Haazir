import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { errorHandler, notFound } from './middleware/errorHandler'
import { healthRouter, type HealthDeps } from './routes/health'
import type { Logger } from './logger'

export interface AppDeps extends HealthDeps {
  logger: Logger
  /** Origins allowed to call the API from a browser (the dashboard). */
  corsOrigins: string[]
}

/**
 * Builds the Express app without listening, so tests drive it with supertest.
 *
 * Middleware order matters and is fixed here:
 *   1. security headers   2. request logging   3. health (no CORS, no body)
 *   4. CORS               5. JSON body         6. /api/v1 routes
 *   7. 404                8. error handler
 * The WhatsApp webhook (Phase 1) mounts before step 5: it needs the raw body
 * to verify Meta's signature.
 */
export function createApp(deps: AppDeps) {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    pinoHttp({
      logger: deps.logger,
      // Health probes every few seconds would drown everything else.
      autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/ready' },
    }),
  )

  app.use(healthRouter(deps))

  app.use(cors({ origin: deps.corsOrigins, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  const api = express.Router()
  // Resource routers (spec §9) mount here from Phase 1 onwards.
  app.use('/api/v1', api)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
