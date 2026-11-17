import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx --conditions=source prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` does not need a database; migrate/seed commands do.
    url: process.env.DATABASE_URL ?? '',
  },
})
