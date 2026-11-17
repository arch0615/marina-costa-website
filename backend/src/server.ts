import { createApp } from './app.js'
import { createDatabase } from './config/database.js'
import { loadConfig } from './config/env.js'
import { createMailer } from './services/mail.service.js'
import { createLogger } from './utils/logger.js'

const config = loadConfig()
const logger = createLogger({
  level: config.logLevel,
  pretty: config.env === 'development' && process.stdout.isTTY,
})
const db = createDatabase(config.databaseUrl)
const mailer = createMailer(config.mail)
const { app } = createApp({ config, db, mailer, logger })

if (!mailer.isConfigured) {
  logger.warn('SMTP is not configured: contact submissions are stored but no email is sent')
}
if (config.isProduction && !config.publicSiteUrl.startsWith('https://')) {
  logger.warn('PUBLIC_SITE_URL is not HTTPS. Serve the site over HTTPS in production.')
}

const server = app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      env: config.env,
      servesFrontend: Boolean(config.frontendDistDir),
    },
    `API listening on http://localhost:${config.port}`,
  )
})

let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Shutting down gracefully')
  const forceExit = setTimeout(() => process.exit(1), 10_000)
  forceExit.unref()
  server.close(async () => {
    await db.$disconnect()
    process.exit(0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection')
})
