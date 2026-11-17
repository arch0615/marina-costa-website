# Professional Presentation Website & Digital Business Card

A production-ready personal-branding site for one professional, made of two pages that share one design system and one data source:

| Page    | URL     | What it does                                                                                                                   |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Website | `/`     | Hero, About, Services, Portfolio, Testimonials and a working contact form                                                      |
| Card    | `/card` | Mobile-first digital business card: one-tap call/email/WhatsApp, save contact (.vcf), QR code, social links and native sharing |

> **Demo content.** The database is seeded with a fictional designer, "Marina Costa".
> Phone numbers use the reserved 555-01xx range and email/links use `example.com`.
> See [Replacing the demo content](#replacing-the-demo-content).

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui (Radix), Lucide, Motion (Framer Motion), React Router, React Hook Form, Zod
- **Backend:** Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL, Zod, Helmet, express-rate-limit, Pino, Nodemailer
- **Testing:** Vitest + React Testing Library (frontend), Vitest + Supertest against a real database (backend), Playwright (end-to-end)
- **Monorepo:** pnpm workspaces (`shared`, `backend`, `frontend`, `e2e`)

## Quick start

Requirements: **Node.js 22.12+** (24 recommended), **pnpm 9+**, **PostgreSQL 14+**.

```bash
# 1. Install dependencies
pnpm install

# 2. Create a database user and two databases (dev + test)
sudo -u postgres psql -c "CREATE ROLE presence WITH LOGIN PASSWORD 'choose-a-password' CREATEDB;"
sudo -u postgres createdb -O presence presence_dev
sudo -u postgres createdb -O presence presence_test

# 3. Configure environment variables
cp backend/.env.example backend/.env      # set DATABASE_URL and TEST_DATABASE_URL
cp frontend/.env.example frontend/.env

# 4. Create the schema and load the demo profile
pnpm db:migrate
pnpm db:seed

# 5. Start the API (port 4000) and the website (port 5180)
pnpm dev
```

Open http://localhost:5180 for the website and http://localhost:5180/card for the card.
In development Vite proxies `/api` to the backend, so no CORS setup is needed.

> The dev server uses port **5180** with `strictPort` so it never silently moves to another port:
> the QR code and canonical URLs are built from the configured URL.

## Scripts (run from the repository root)

| Command           | Description                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm dev`        | API with hot reload + Vite dev server                                                           |
| `pnpm build`      | Production build of `shared`, `backend` (to `backend/dist`) and `frontend` (to `frontend/dist`) |
| `pnpm start`      | Run the production API; it also serves `frontend/dist` (single origin)                          |
| `pnpm lint`       | ESLint (TypeScript, React Hooks, accessibility rules)                                           |
| `pnpm typecheck`  | Strict TypeScript checks for every package                                                      |
| `pnpm test`       | Backend + frontend unit/integration tests                                                       |
| `pnpm test:e2e`   | Playwright end-to-end tests (builds and starts a production server on port 4100)                |
| `pnpm check`      | lint + typecheck + test + build                                                                 |
| `pnpm format`     | Prettier                                                                                        |
| `pnpm db:migrate` | Create/apply migrations in development (`prisma migrate dev`)                                   |
| `pnpm db:deploy`  | Apply migrations in production (`prisma migrate deploy`)                                        |
| `pnpm db:seed`    | Create or update the profile from `backend/prisma/seed-data.ts` (idempotent)                    |
| `pnpm db:reset`   | Drop, re-migrate and re-seed the dev database                                                   |
| `pnpm db:studio`  | Browse the database with Prisma Studio                                                          |

### Tests

```bash
pnpm test                                   # 57 backend + 35 frontend tests
pnpm --filter @presence/e2e install-browsers # once: download Playwright's Chromium
pnpm test:e2e                               # 52 end-to-end tests (desktop + mobile)
```

Backend and e2e tests use `TEST_DATABASE_URL` and **never** touch the development database.
The backend suite wipes and re-seeds the test database on every run.

## Project structure

```
├── shared/             Zod schemas + API types used by both frontend and backend
├── backend/
│   ├── prisma/         schema.prisma, migrations/, seed-data.ts (content), seed.ts
│   ├── src/
│   │   ├── config/      environment validation, database client, constants
│   │   ├── controllers/ thin HTTP handlers
│   │   ├── middleware/  security headers, CORS, rate limits, validation, logging, errors
│   │   ├── routes/      /api router and the static/SPA router
│   │   ├── services/    profile, content, contact, mail, SEO (metadata injection)
│   │   ├── utils/       vCard generator, HTML escaping, errors, logger
│   │   └── validators/
│   └── tests/          integration tests against PostgreSQL
├── frontend/
│   ├── public/         images, icons, OG image, web manifest
│   └── src/
│       ├── components/  shared UI (ui/ = shadcn primitives), contact form, QR, share
│       ├── hooks/       data fetching, document metadata, share, clipboard
│       ├── layouts/     site header/footer/layout, card layout
│       ├── pages/       HomePage, CardPage, NotFoundPage (lazy-loaded)
│       ├── sections/    home/ and card/ page sections
│       ├── services/    API client
│       ├── styles/      globals.css: the design system tokens
│       └── utils/       contact links, QR, formatting, site configuration
├── e2e/                Playwright tests
└── docs/               architecture.md, api-documentation.md, deployment.md
```

## Replacing the demo content

1. Edit `backend/prisma/seed-data.ts`: name, title, biography, contact details, services,
   projects, testimonials, experience and qualifications. Store phone numbers in international
   format (for example `+55 11 91234 5678`); they are used for `tel:`, WhatsApp and the vCard.
2. Replace the images in `frontend/public/`:
   - `images/profile/…` portrait, at least 720×900 px (4:5), WebP or JPEG. Update `profileImage` in the seed.
   - `images/portfolio/…` project thumbnails, 4:3, at least 800×600 px.
   - `og-image.png` (1200×630) is the social preview shown when links are shared.
   - `favicon.svg`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` are the monogram icons.
3. Update `VITE_SITE_TITLE` / `VITE_SITE_DESCRIPTION` in `frontend/.env` and the names in
   `frontend/public/site.webmanifest`.
4. Run `pnpm db:seed`. It updates the profile in place and replaces its related content.
   Contact submissions are kept.

The QR code encodes `<VITE_SITE_URL>/card`. That address never changes when the profile is
edited, so printed QR codes stay valid.

## Email notifications

Contact submissions are always stored in PostgreSQL. To also receive an email for each one,
set the SMTP variables in `backend/.env` (any provider works: Resend, Gmail app password,
Mailgun, Amazon SES, Postmark…). For example, with Resend:

```dotenv
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_api_key
MAIL_FROM="Website <no-reply@your-domain.com>"
CONTACT_RECIPIENT=you@your-domain.com   # optional, defaults to the profile email
```

Credentials are only read by the backend and never reach the browser.

## Documentation

- [Architecture](docs/architecture.md): structure, data model, design system, security, decisions
- [API documentation](docs/api-documentation.md): every endpoint with examples
- [Deployment](docs/deployment.md): production build, HTTPS, environment, operations
