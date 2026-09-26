/**
 * Stable error codes (spec §9). The dashboard switches on `code`, never on
 * `message`, so messages can be reworded without breaking the UI.
 */
export const ERROR_CODES = [
  'VALIDATION',
  'NOT_FOUND',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'RATE_LIMITED',
  'WINDOW_CLOSED',
  'PLAN_LIMIT',
  'TEMPLATE_NOT_APPROVED',
  'INTERNAL',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

/** Wire shape of every error response: `{ error: { code, message, details? } }`. */
export interface ErrorBody {
  error: { code: ErrorCode; message: string; details?: unknown }
}

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  WINDOW_CLOSED: 409,
  PLAN_LIMIT: 402,
  TEMPLATE_NOT_APPROVED: 409,
  INTERNAL: 500,
}

export class AppError extends Error {
  readonly status: number

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
    this.status = STATUS[code]
  }

  toBody(): ErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details === undefined ? {} : { details: this.details }),
      },
    }
  }
}
