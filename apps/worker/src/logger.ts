import pino from 'pino'

export function createLogger(options: { level: string; pretty: boolean }) {
  return pino({
    name: 'worker',
    level: options.level,
    ...(options.pretty
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
      : {}),
  })
}

export type Logger = ReturnType<typeof createLogger>
