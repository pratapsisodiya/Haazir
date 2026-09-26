import express, { Router } from 'express'
import type { InboundJob, JobQueue } from '@haazir/messaging'
import { AppError } from '@haazir/shared'
import { verifySignature, verifySubscription } from '@haazir/whatsapp'

export interface WhatsappWebhookDeps {
  /** Meta app secret: the HMAC key for X-Hub-Signature-256. */
  appSecret?: string
  /** The token typed into the Meta dashboard when subscribing the webhook. */
  verifyToken?: string
  inboundQueue: JobQueue<InboundJob>
}

/**
 * GET/POST /webhooks/whatsapp (spec §10).
 *
 * POST does the minimum and answers fast (Meta wants a 200 within seconds and
 * retries otherwise): read the raw body, verify the signature over exactly
 * those bytes, queue the payload, reply 200. Everything else happens in the
 * worker, where it can retry without Meta noticing.
 *
 * Mounted before the global JSON parser, because it needs the raw bytes.
 */
export function whatsappWebhookRouter(deps: WhatsappWebhookDeps) {
  const router = Router()

  router.get('/webhooks/whatsapp', (req, res, next) => {
    if (!deps.verifyToken)
      return next(new AppError('UNAVAILABLE', 'WhatsApp webhook is not configured'))
    const challenge = verifySubscription(req.query as Record<string, unknown>, deps.verifyToken)
    if (challenge === null) return next(new AppError('FORBIDDEN', 'Verify token does not match'))
    res.type('text/plain').send(challenge)
  })

  router.post(
    '/webhooks/whatsapp',
    // Meta's batches are small; 3 MB is generous and stops abuse.
    express.raw({ type: '*/*', limit: '3mb' }),
    async (req, res, next) => {
      try {
        if (!deps.appSecret) throw new AppError('UNAVAILABLE', 'WhatsApp webhook is not configured')

        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0)
        if (!verifySignature(raw, req.get('x-hub-signature-256'), deps.appSecret)) {
          req.log.warn({ ip: req.ip }, 'webhook signature mismatch')
          throw new AppError('UNAUTHENTICATED', 'Invalid signature')
        }

        let payload: unknown
        try {
          payload = JSON.parse(raw.toString('utf8'))
        } catch {
          throw new AppError('VALIDATION', 'Body is not valid JSON')
        }

        await deps.inboundQueue.add('webhook', { payload, receivedAt: new Date().toISOString() })
        res.sendStatus(200)
      } catch (err) {
        next(err)
      }
    },
  )

  return router
}
