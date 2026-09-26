import type { ErrorRequestHandler, RequestHandler } from 'express'
import { z } from 'zod'
import { AppError } from '@haazir/shared'

/** Unknown routes get the same error shape as everything else. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError('NOT_FOUND', `No route for ${req.method} ${req.path}`))
}

/**
 * The one place errors become responses: `{ error: { code, message, details? } }`.
 * Anything that isn't an AppError is logged in full and returned as INTERNAL,
 * so stack traces and SQL never reach the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof z.ZodError) {
    const error = new AppError('VALIDATION', 'Some fields are invalid', z.flattenError(err))
    res.status(error.status).json(error.toBody())
    return
  }

  // express.json() throws these for malformed bodies.
  if (err?.type === 'entity.parse.failed') {
    const error = new AppError('VALIDATION', 'Request body is not valid JSON')
    res.status(error.status).json(error.toBody())
    return
  }

  if (err instanceof AppError) {
    if (err.status >= 500) req.log.error({ err }, err.message)
    res.status(err.status).json(err.toBody())
    return
  }

  req.log.error({ err }, 'Unhandled error')
  res.status(500).json(new AppError('INTERNAL', 'Something went wrong').toBody())
}
