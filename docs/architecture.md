# Architecture

## Overview

```
                ┌──────────────────────── Browser ────────────────────────┐
                │  React SPA  ─  "/" presentation page   "/card" card     │
                └───────────────┬─────────────────────────────────────────┘
                                │ HTTPS
                     ┌──────────▼───────────┐
                     │ Reverse proxy (TLS)  │   Caddy / Nginx / platform LB
                     └──────────┬───────────┘
                                │
       ┌────────────────────────▼──────────────────────────┐
       │ Express 5 (one Node.js process)                   │
       │                                                   │
       │  request log → Helmet (CSP, HSTS…) ─┬─ /api/*     │
       │                                     │  CORS allow-list → rate limit
       │                                     │  → JSON (16 kB) → router → controllers
       │                                     │  → services → Prisma ──────────────┐
       │                                     └─ everything else                   │
       │                                        static assets (immutable cache)   │
       │                                        index.html + per-route metadata   │
       │  centralized error handler (no stack traces in responses)                │
       └───────────────────────────────────────────────────┬──────────────────────┘
                                                           │
                                     ┌─────────────────────▼───┐   ┌──────────────┐
                                     │ PostgreSQL               │   │ SMTP provider│
                                     └──────────────────────────┘   └──────────────┘
```

In production one Express process serves both the API and the built frontend from the same
origin. That removes CORS from the production path, keeps a single deployable unit, and lets
the server inject route-specific `<title>`, Open Graph and JSON-LD metadata into `index.html`.
Link previews on WhatsApp, LinkedIn and Slack don't execute JavaScript, so without this
injection a shared `/card` link would show a generic preview. Hosting the frontend separately is
also supported (see [deployment](deployment.md#option-b-separate-frontend-hosting)).

## Packages

| Package    | Responsibility                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared`   | The contact form Zod schema (one set of rules for browser and API) and the API DTO types. Exposes TS sources via a `source` export condition for dev. |
| `backend`  | REST API, database access, email, vCard generation, SPA serving with SEO metadata.                                                                    |
| `frontend` | React SPA. Route-level code splitting: each page is its own chunk, and the QR library loads only on `/card`.                                          |
| `e2e`      | Playwright tests against a production build on port 4100 and the test database.                                                                       |

### Backend layering

`routes` → `controllers` (HTTP only) → `services` (logic) → Prisma.
The app is built by `createApp({ config, db, mailer, logger })`, so tests inject a real test
database, a fake mailer and custom limits without patching modules.

- `config/env.ts` validates every environment variable with Zod at startup and lists all
  problems at once. Empty values count as unset.
- `services/contact.service.ts` checks for spam, stores the submission, then sends the email
  in the background. An email failure never fails the request and is recorded as `notifiedAt = null`.
- `services/seo.service.ts` replaces the `<!--seo:start-->…<!--seo:end-->` block of the built
  `index.html` with escaped, profile-based tags (cached for 60 s). Unknown paths get a 404
  status and `noindex`.
- `utils/vcard.ts` is a dependency-free RFC 2426 (vCard 3.0) generator: escaping, CRLF, and
  75-octet line folding that never splits UTF-8 characters.

### Frontend structure

- `useResource` caches each API resource for the page session, deduplicates concurrent
  requests, and exposes `loading | error | success` plus `retry`. Every section renders its
  own skeleton, error (with retry) and empty state.
- `useDocumentMeta` keeps the title, description, canonical and OG tags in sync during
  client-side navigation.
- Contact links (`tel:`, `mailto:`, `wa.me`, Google Maps) are built in `utils/contactLinks.ts`.
  External URLs from the database pass through `safeExternalUrl`, which allows only http/https.
- Sharing uses the Web Share API when available. Otherwise, or if it fails, a dialog offers
  copy link (Clipboard API with an `execCommand` fallback), WhatsApp, email, LinkedIn and X.

## Data model

```
Profile 1 ── * Service
        1 ── * PortfolioItem
        1 ── * SocialLink        (unique per platform)
        1 ── * Experience
        1 ── * Qualification
        1 ── * Testimonial
        1 ── * ContactSubmission (profile_id nullable, ON DELETE SET NULL)
```

| Model               | Notes                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Profile`           | Spec fields plus `slug` (unique, `default`), `headline` (short intro) and `skills`.                               |
| `Service`           | `icon` is a Lucide icon name from a curated list (unknown names fall back to a neutral icon).                     |
| `PortfolioItem`     | The spec's "Portfolio" model. Adds `technologies` and `isFeatured` (featured projects appear on the card).        |
| `SocialLink`        | `platform` enum: LINKEDIN, INSTAGRAM, FACEBOOK, X, YOUTUBE, GITHUB. Only active links are shown.                  |
| `Experience`        | Added for the About section (`endDate = null` means current).                                                     |
| `Qualification`     | Added for the About section.                                                                                      |
| `Testimonial`       | Added: the spec has a Testimonials section but no model. The section hides itself when empty.                     |
| `ContactSubmission` | `status` enum NEW/READ/ARCHIVED/SPAM; `notifiedAt` records email delivery. No IP address or user agent is stored. |

All IDs are time-ordered UUIDv7 (`uuid(7)` stored as `uuid`). Tables and columns use
snake_case. Every content table has a composite index `(profile_id, is_active, display_order)`
that matches the public queries. String columns have length limits that match the validation rules.

Content is managed through `prisma/seed-data.ts` and `pnpm db:seed` (idempotent). There is no
admin UI, as agreed in scope.

## Design system

Defined once in `frontend/src/styles/globals.css` (Tailwind v4 `@theme` + CSS variables) and
used by both pages.

| Token       | Value                                      | Use                                                         |
| ----------- | ------------------------------------------ | ----------------------------------------------------------- |
| Primary     | `#1c2b4a` ink navy                         | Main buttons, card cover, footer, action buttons            |
| Secondary   | `#ebe6db` warm sand                        | Secondary surfaces, chips                                   |
| Accent      | `#a84a23` terracotta (`highlight`)         | Eyebrows, small marks, used sparingly                       |
| Background  | `#f7f5f0` paper / `#ffffff` card surfaces  |                                                             |
| Text        | `#15171c` ink / `#565b66` muted            | All text pairs meet WCAG 2.2 AA contrast                    |
| Typography  | Fraunces (display serif) + Inter (UI/body) | Self-hosted variable fonts, fluid `display`/`heading` sizes |
| Radius      | 0.75 rem base scale (`sm`–`2xl`)           | Pill-shaped buttons                                         |
| Shadows     | `shadow-soft`, `shadow-lift`               | Two elevation levels only                                   |
| Spacing     | Tailwind 4 px scale + fluid `py-section`   | Vertical rhythm between sections                            |
| Breakpoints | 768 / 1024 / 1440 (`md` / `lg` / `2xl`)    | Mobile-first                                                |

Button variants: `default`, `secondary`, `outline`, `ghost`, `inverted`, `outline-inverted`,
`link`, `destructive`. Sizes `default` and `lg` are 44–48 px tall, so they are touch-friendly.

Motion is limited to subtle fade/rise reveals and is disabled for users who prefer reduced
motion (`MotionConfig reducedMotion="user"`).

## Security

| Concern          | Measure                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Input validation | Shared Zod schema: trims, strips control characters, collapses line breaks in single-line fields (no email header injection), enforces lengths, drops unknown keys |
| XSS              | React escapes output; no `dangerouslySetInnerHTML`; server-injected metadata is HTML-escaped and JSON-LD is `<`/`>`-escaped; `javascript:` URLs are rejected       |
| Headers          | Helmet with a strict CSP (`default-src 'self'`, `frame-ancestors 'none'`, no inline scripts), HSTS when the site URL is HTTPS, `nosniff`, referrer policy          |
| CORS             | Allow-list (`CORS_ORIGINS` + `PUBLIC_SITE_URL`); other origins get no CORS headers                                                                                 |
| Rate limiting    | Global API limit (300 per 15 min per IP) plus a strict contact limit (5 per hour per IP); `TRUST_PROXY` makes client IPs correct behind a proxy                    |
| Spam             | Honeypot field + minimum fill time (measured as a duration, so it is immune to clock skew) + rate limit. Spam gets the same `201` response but is not stored       |
| CSRF-style posts | `POST /api/contact` accepts only `application/json`, so cross-site HTML forms can't submit                                                                         |
| Errors           | Central handler returns `{ error: { code, message, requestId } }`; internals and stack traces are only logged                                                      |
| Secrets          | Only in `backend/.env` (git-ignored). Frontend variables (`VITE_*`) contain no secrets                                                                             |
| Logging          | Structured JSON (Pino) with request IDs; authorization/cookie headers are redacted; submission contents are not logged                                             |

## Testing strategy

| Layer    | Tool                          | Covers                                                                                                                                                                                                                                                                          |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | Vitest + Supertest + PG       | Health, profile, content, contact (storage, email, escaping, failures), validation, spam, rate limits, CORS/headers, errors, SPA metadata, vCard, config                                                                                                                        |
| Frontend | Vitest + RTL                  | Navigation and routing, mobile menu, contact form validation and states, contact links, card actions, vCard link, QR (decoded), sharing and fallback, data hook race                                                                                                            |
| E2E      | Playwright (desktop + mobile) | Real browser against a production build: section navigation, no horizontal overflow at 320–1440 px, card actions, vCard download parsed, QR PNG decoded and opened, share fallback and clipboard, form success (row verified in PostgreSQL) and failures, SEO files and headers |

## Key decisions

- **Single origin in production:** simpler HTTPS, no CORS, and server-side metadata for link previews.
- **The vCard is generated server-side** (`GET /api/vcard`) and served as `text/vcard` with
  `Content-Disposition: attachment`. This is the most reliable path on iOS and Android, and it works as a plain link.
- **QR generated client-side** from `VITE_SITE_URL + /card`. It contains no profile data, so it
  never changes when the profile does.
- **No React Query or MSW:** a ~50-line cached hook and a fetch stub cover this app's needs.
- **Nodemailer over SMTP** instead of a provider SDK, so the provider can change by editing environment variables.
- **TypeScript 6.0** rather than 7, because typescript-eslint supports TS < 6.1.
- **ESLint 9** rather than 10, because `eslint-plugin-jsx-a11y` doesn't support ESLint 10 yet.
- **Prisma 7.10.1 is pinned:** npm's `latest` tag currently points at an 8.0 release candidate.
