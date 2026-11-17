import { pino, type Logger } from 'pino'

export type { Logger }

export function createLogger(options: { level: string; pretty?: boolean }): Logger {
  return pino({
    level: options.level,
    base: { service: 'presence-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Never write credentials or personal data to logs.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.pass',
      ],
      censor: '[redacted]',
    },
    ...(options.pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss' },
          },
        }
      : {}),
  })
}
