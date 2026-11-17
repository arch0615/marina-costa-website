import { randomUUID } from 'node:crypto'
import { pinoHttp } from 'pino-http'
import type { Logger } from '../utils/logger.js'

const REQUEST_ID_PATTERN = /^[\w-]{8,64}$/

/** Structured access logging with a request id that is echoed back in `X-Request-Id`. */
export function createRequestLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId(req, res) {
      const incoming = req.headers['x-request-id']
      const id =
        typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID()
      res.setHeader('X-Request-Id', id)
      return id
    },
    customLogLevel(_req, res, error) {
      if (error || res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    serializers: {
      req: (req: { id: unknown; method: string; url: string }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
    autoLogging: {
      ignore: (req) => /^\/(assets|images|fonts)\//.test(req.url ?? ''),
    },
  })
}
