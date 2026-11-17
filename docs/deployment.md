# Deployment

The recommended setup is **one Node.js process** that serves the API and the built website from
the same HTTPS origin, behind a reverse proxy that terminates TLS (option A). The website can
also be hosted separately on a static host (option B).

## Environment variables

### Backend (`backend/.env`, never commit it)

| Variable                                  | Production value / notes                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| `NODE_ENV`                                | `production` (also set by `pnpm start`)                                                 |
| `PORT`                                    | Internal port, e.g. `4000`                                                              |
| `LOG_LEVEL`                               | `info`                                                                                  |
| `TRUST_PROXY`                             | `1` behind one reverse proxy (needed for correct client IPs in rate limiting)           |
| `DATABASE_URL`                            | `postgresql://user:password@host:5432/db?schema=public`                                 |
| `PUBLIC_SITE_URL`                         | `https://www.your-domain.com`, the permanent public URL (canonical, previews, vCard)    |
| `CORS_ORIGINS`                            | Extra allowed browser origins (comma-separated); can stay empty with a single origin    |
| `FRONTEND_DIST_DIR`                       | `../frontend/dist` to serve the website; empty for API-only                             |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Defaults: 15 min / 300                                                                  |
| `CONTACT_RATE_LIMIT_WINDOW_MS` / `_MAX`   | Defaults: 60 min / 5                                                                    |
| `CONTACT_MIN_FILL_MS`                     | Default 3000                                                                            |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`   | Email transport (leave `SMTP_HOST` empty to disable emails)                             |
| `SMTP_USER`, `SMTP_PASS`                  | SMTP credentials                                                                        |
| `MAIL_FROM`                               | Required with SMTP, e.g. `"Website <no-reply@your-domain.com>"` (use a verified domain) |
| `CONTACT_RECIPIENT`                       | Optional; defaults to the profile email                                                 |

The server validates all of these at startup and exits with a list of problems if any are invalid.

### Frontend (`frontend/.env`, read at **build** time)

| Variable                | Notes                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| `VITE_SITE_URL`         | Same as `PUBLIC_SITE_URL`. The QR code encodes `VITE_SITE_URL/card`         |
| `VITE_SITE_TITLE`       | Default `<title>` in `index.html`                                           |
| `VITE_SITE_DESCRIPTION` | Default meta description                                                    |
| `VITE_API_URL`          | Empty for single-origin hosting; `https://api.your-domain.com` for option B |

`VITE_*` values end up in public JavaScript. Never put secrets in them.

## Option A: single Linux server (Ubuntu 24.04)

### 1. Install the runtime

```bash
# Node.js 24 + pnpm
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql caddy
sudo corepack enable && corepack prepare pnpm@9.12.0 --activate
```

(Caddy may need its apt repository first: see https://caddyserver.com/docs/install.)

### 2. Create the database

```bash
sudo -u postgres psql -c "CREATE ROLE presence WITH LOGIN PASSWORD 'a-long-random-password';"
sudo -u postgres createdb -O presence presence
```

### 3. Get the code, configure and build

```bash
sudo useradd --system --create-home --home-dir /srv/presence presence
sudo -iu presence
git clone <your-repository-url> app && cd app

pnpm install --frozen-lockfile
cp backend/.env.example backend/.env && chmod 600 backend/.env   # edit: see table above
cp frontend/.env.example frontend/.env                            # set VITE_SITE_URL etc.

pnpm build          # shared → backend/dist, frontend/dist
pnpm db:deploy      # apply migrations
pnpm db:seed        # load or update the profile content
```

### 4. Run it as a service

`/etc/systemd/system/presence.service`:

```ini
[Unit]
Description=Professional presence website and API
After=network.target postgresql.service

[Service]
Type=simple
User=presence
WorkingDirectory=/srv/presence/app/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5
# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/srv/presence/app/backend
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now presence
curl -s http://localhost:4000/api/health
```

The process reads `backend/.env` from its working directory and shuts down gracefully on `SIGTERM`.

### 5. HTTPS with Caddy

`/etc/caddy/Caddyfile`:

```caddy
your-domain.com {
	redir https://www.your-domain.com{uri} permanent
}

www.your-domain.com {
	encode zstd gzip
	reverse_proxy localhost:4000
}
```

```bash
sudo systemctl reload caddy
```

Caddy obtains and renews TLS certificates automatically and redirects HTTP to HTTPS. With an
`https://` `PUBLIC_SITE_URL`, the app also sends HSTS and `upgrade-insecure-requests`.
(Using Nginx instead: proxy to `localhost:4000`, set `X-Forwarded-For`/`X-Forwarded-Proto`,
and keep `TRUST_PROXY=1`.)

### 6. Updating

```bash
sudo -iu presence && cd app
git pull
pnpm install --frozen-lockfile
pnpm build
pnpm db:deploy
exit
sudo systemctl restart presence
```

## Option B: separate frontend hosting

Use this when the website goes on a static host (Vercel, Netlify, Cloudflare Pages, S3 + CDN)
and the API runs elsewhere (a server as in option A, or Render/Railway/Fly).

1. **API:** deploy as in option A with `FRONTEND_DIST_DIR=` (empty) and
   `CORS_ORIGINS=https://www.your-domain.com`. Expose it at e.g. `https://api.your-domain.com`.
2. **Website:** build with `VITE_API_URL=https://api.your-domain.com` and `VITE_SITE_URL=https://www.your-domain.com`:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @presence/shared build && pnpm --filter @presence/frontend build`
   - Output directory: `frontend/dist`
   - **SPA fallback:** rewrite all unknown paths to `/index.html` so `/card` works on reload
     (Netlify: `/* /index.html 200`; Vercel: a rewrite to `/index.html`).
3. Link previews then use the defaults baked into `index.html` (`VITE_SITE_TITLE`/`VITE_SITE_DESCRIPTION`)
   rather than per-route metadata. Add the security headers (CSP etc.) through the static host's configuration.

### Platform-as-a-service (Render, Railway, Fly.io…)

| Setting    | Value                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Build      | `corepack enable && pnpm install --frozen-lockfile && pnpm build`                                                          |
| Pre-deploy | `pnpm db:deploy` (and `pnpm db:seed` on the first deploy or after content changes)                                         |
| Start      | `pnpm start`                                                                                                               |
| Health     | `GET /api/health`                                                                                                          |
| Env        | Backend variables from the table above (set `FRONTEND_DIST_DIR=../frontend/dist`) and the `VITE_*` variables at build time |

Set `TRUST_PROXY` to the number of proxies the platform puts in front of the app (usually `1`).

## Production checklist

- [ ] Demo content replaced (`backend/prisma/seed-data.ts`, images in `frontend/public`, manifest, `VITE_SITE_*`)
- [ ] `PUBLIC_SITE_URL` and `VITE_SITE_URL` set to the final HTTPS domain **before** building and printing QR codes
- [ ] HTTPS working; HTTP redirects to HTTPS
- [ ] `TRUST_PROXY` matches the proxy setup (otherwise rate limits apply to the proxy's IP)
- [ ] SMTP configured and tested with a real submission; sender domain verified (SPF/DKIM)
- [ ] `backend/.env` permissions `600`, owned by the service user
- [ ] Daily database backups, e.g. `pg_dump -Fc presence > /backups/presence-$(date +%F).dump`
- [ ] Uptime monitoring on `/api/health`
- [ ] `robots.txt`/`sitemap.xml` show the production domain; submit the sitemap in Google Search Console
- [ ] Lighthouse run on `/` and `/card`

## Operations

- **Logs:** structured JSON on stdout (`journalctl -u presence -f`). For readable output, pipe it through
  `npx pino-pretty`. Every response has an `X-Request-Id` that matches the log entries.
- **Reading contact submissions:**
  ```bash
  sudo -u postgres psql presence -c \
    "SELECT created_at, name, email, subject, status, notified_at FROM contact_submissions ORDER BY created_at DESC LIMIT 20;"
  ```
  or run `pnpm db:studio` locally over an SSH tunnel. `notified_at IS NULL` means the email
  notification was not delivered (SMTP disabled or failed; see the logs).
- **Rotating SMTP credentials:** edit `backend/.env` and run `sudo systemctl restart presence`.
