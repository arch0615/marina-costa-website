import { readFileSync } from 'node:fs'
import path from 'node:path'
import express, { Router } from 'express'
import { isSpaRoute, type SeoService } from '../services/seo.service.js'

/**
 * Serves the built frontend: hashed assets with long-lived caching, and every other
 * GET request with `index.html` (client-side routing) plus route-specific metadata.
 */
export function createSpaRouter(distDir: string, seo: SeoService) {
  const router = Router()
  const template = readFileSync(path.join(distDir, 'index.html'), 'utf8')

  router.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`)
        res.setHeader(
          'Cache-Control',
          isHashedAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
        )
      },
    }),
  )

  router.get('/{*path}', async (req, res) => {
    const html = await seo.render(template, req.path)
    res
      .status(isSpaRoute(req.path) ? 200 : 404)
      .set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' })
      .send(html)
  })

  return router
}
