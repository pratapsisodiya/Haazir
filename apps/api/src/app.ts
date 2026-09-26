import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { errorHandler, notFound } from './middleware/errorHandler'
import { healthRouter, type HealthDeps } from './routes/health'
import { whatsappWebhookRouter, type WhatsappWebhookDeps } from './webhooks/whatsapp'
import type { Logger } from './logger'

export interface AppDeps extends HealthDeps {
  logger: Logger
  /** Origins allowed to call the API from a browser (the dashboard). */
  corsOrigins: string[]
  whatsapp: WhatsappWebhookDeps
}

/**
 * Builds the Express app without listening, so tests drive it with supertest.
 *
 * Middleware order matters and is fixed here:
 *   1. security headers   2. request logging   3. health (no CORS, no body)
 *   4. webhooks (raw body, signature-checked; no CORS: servers call them)
 *   5. CORS               6. JSON body         7. /api/v1 routes
 *   8. 404                9. error handler
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
  app.use(whatsappWebhookRouter(deps.whatsapp))

  app.use(cors({ origin: deps.corsOrigins, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  const api = express.Router()
  // Resource routers (spec §9) mount here from Phase 1 onwards.
  app.use('/api/v1', api)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
