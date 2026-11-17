import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    testDatabaseUrl: string
  }
}

/** Applies all migrations to the dedicated test database before the suite runs. */
export default function setup(project: TestProject) {
  if (existsSync('.env')) process.loadEnvFile('.env')
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set. See backend/.env.example.')
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL: tests wipe the database.')
  }

  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  })
  project.provide('testDatabaseUrl', url)
}
