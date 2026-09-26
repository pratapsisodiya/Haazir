import pino from 'pino'

/**
 * JSON logs in production (for the log collector), readable lines in dev.
 * Secrets never belong in a log line; the redact list is the safety net.
 */
export function createLogger(options: { level: string; pretty: boolean; name: string }) {
  return pino({
    name: options.name,
    level: options.level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-hub-signature-256"]',
        '*.access_token',
        '*.accessToken',
        '*.password',
      ],
      censor: '[redacted]',
    },
    ...(options.pretty
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
      : {}),
  })
}

export type Logger = ReturnType<typeof createLogger>
