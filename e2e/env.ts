import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

const here = path.dirname(fileURLToPath(import.meta.url))
const backendEnvFile = path.join(here, '../backend/.env')
const backendEnv = existsSync(backendEnvFile) ? parseEnv(readFileSync(backendEnvFile, 'utf8')) : {}

/** End-to-end tests run against a production build on their own port and database. */
export const E2E_PORT = Number(process.env.E2E_PORT ?? 4100)
export const BASE_URL = `http://localhost:${E2E_PORT}`
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? backendEnv.TEST_DATABASE_URL ?? ''
