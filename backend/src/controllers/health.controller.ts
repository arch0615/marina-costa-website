import type { RequestHandler } from 'express'
import type { HealthDto } from '@presence/shared'
import type { Database } from '../config/database.js'
import { sendData } from '../utils/respond.js'

const DB_CHECK_TIMEOUT_MS = 2000

async function isDatabaseUp(db: Database): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Database health check timed out')),
        DB_CHECK_TIMEOUT_MS,
      )
    })
    await Promise.race([db.$queryRaw`SELECT 1`, timeout])
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export function createHealthController(db: Database): { check: RequestHandler } {
  return {
    async check(_req, res) {
      const databaseUp = await isDatabaseUp(db)
      const health: HealthDto = {
        status: databaseUp ? 'ok' : 'degraded',
        database: databaseUp ? 'up' : 'down',
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      }
      sendData(res, health, { status: databaseUp ? 200 : 503 })
    },
  }
}
