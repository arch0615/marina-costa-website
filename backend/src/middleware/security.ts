import cors from 'cors'
import helmet from 'helmet'
import type { AppConfig } from '../config/env.js'

/** Secure HTTP headers, including a strict Content Security Policy for the website. */
export function createSecurityHeaders(config: AppConfig) {
  const servesHttps = config.publicSiteUrl.startsWith('https://')

  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Inline style attributes are used by the animation library.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: servesHttps ? [] : null,
      },
    },
    // HSTS only makes sense when the site is actually served over HTTPS.
    strictTransportSecurity: servesHttps
      ? { maxAge: 63_072_000, includeSubDomains: true, preload: false }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
}

/** CORS restricted to the configured origins (plus the public site itself). */
export function createCors(config: AppConfig) {
  const allowed = new Set([...config.corsOrigins, config.publicSiteUrl])

  return cors({
    origin(origin, callback) {
      // Same-origin and non-browser requests have no Origin header.
      callback(null, !origin || allowed.has(origin))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
    maxAge: 600,
  })
}
