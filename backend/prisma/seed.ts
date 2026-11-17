import { existsSync } from 'node:fs'
import { createDatabase } from '../src/config/database.js'
import { seedDatabase } from './seed-data.js'

if (existsSync('.env')) process.loadEnvFile('.env')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Copy backend/.env.example to backend/.env first.')
  process.exit(1)
}

const publicSiteUrl = (process.env.PUBLIC_SITE_URL ?? 'http://localhost:5180').replace(/\/+$/, '')
const db = createDatabase(databaseUrl)

try {
  const profile = await seedDatabase(db, publicSiteUrl)
  console.log(`Seeded profile "${profile.fullName}" (${profile.id}).`)
} catch (error) {
  console.error('Seeding failed:', error)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
