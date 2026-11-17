import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const SITE_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/card', priority: '0.8', changefreq: 'monthly' },
]

/**
 * Replaces %SITE_URL%, %SITE_TITLE% and %SITE_DESCRIPTION% in index.html and emits
 * robots.txt and sitemap.xml for the configured permanent site URL.
 */
function siteMetadata(site: { url: string; title: string; description: string }): Plugin {
  const escapeXml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  return {
    name: 'presence:site-metadata',
    transformIndexHtml(html) {
      return html
        .replaceAll('%SITE_URL%', escapeXml(site.url))
        .replaceAll('%SITE_TITLE%', escapeXml(site.title))
        .replaceAll('%SITE_DESCRIPTION%', escapeXml(site.description))
    },
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10)
      const urls = SITE_ROUTES.map(
        (route) =>
          `  <url>\n    <loc>${escapeXml(site.url + route.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`,
      ).join('\n')

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site.url}/sitemap.xml\n`,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const site = {
    url: (env.VITE_SITE_URL || 'http://localhost:5180').replace(/\/+$/, ''),
    title: env.VITE_SITE_TITLE || 'Marina Costa — Brand & Digital Product Designer',
    description:
      env.VITE_SITE_DESCRIPTION ||
      'Independent brand and digital product designer helping growing companies build clear brands and digital products.',
  }
  const apiTarget = env.VITE_DEV_API_PROXY || 'http://localhost:4000'

  return {
    plugins: [react(), tailwindcss(), siteMetadata(site)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@presence/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
      },
    },
    server: {
      port: 5180,
      strictPort: true,
      proxy: { '/api': { target: apiTarget, changeOrigin: false } },
    },
    preview: {
      port: 4180,
      strictPort: true,
      proxy: { '/api': { target: apiTarget, changeOrigin: false } },
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      restoreMocks: true,
      // Generous limits: user-event typing is slow when suites run in parallel on busy CI machines.
      testTimeout: 15_000,
    },
  }
})
