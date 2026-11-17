import { defineConfig, devices } from '@playwright/test'
import { BASE_URL, E2E_PORT, TEST_DATABASE_URL } from './env.js'

if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is not set (environment or backend/.env).')
}

const serverEnv = {
  NODE_ENV: 'production',
  PORT: String(E2E_PORT),
  LOG_LEVEL: 'warn',
  DATABASE_URL: TEST_DATABASE_URL,
  PUBLIC_SITE_URL: BASE_URL,
  CORS_ORIGINS: BASE_URL,
  FRONTEND_DIST_DIR: '.app-dist',
  RATE_LIMIT_MAX: '5000',
  CONTACT_RATE_LIMIT_MAX: '1000',
  CONTACT_MIN_FILL_MS: '1000',
  // Build-time frontend configuration: the QR code must point at this server.
  VITE_SITE_URL: BASE_URL,
  VITE_API_URL: '',
}

// Prepare the database, build everything into an isolated dist folder, then serve it.
const startCommand = [
  'pnpm --dir ../backend exec prisma migrate deploy',
  'pnpm --dir ../backend exec tsx --conditions=source prisma/seed.ts',
  'pnpm --dir .. --filter @presence/shared build',
  'pnpm --dir .. --filter @presence/backend build',
  'pnpm --dir ../frontend exec vite build --outDir ../e2e/.app-dist --emptyOutDir --logLevel warn',
  'node ../backend/dist/server.js',
].join(' && ')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // Software rendering keeps headless Chromium producing frames on machines
      // without a usable GPU stack (otherwise screenshots and rAF can stall).
      args: ['--use-gl=disabled'],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: startCommand,
    url: `${BASE_URL}/api/health`,
    env: serverEnv,
    timeout: 240_000,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
