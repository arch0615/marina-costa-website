# API documentation

Base path: `/api`. Requests and responses use JSON (UTF-8), except `GET /api/vcard`.

## Conventions

**Success**

```json
{ "data": {} }
```

**Error**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": { "email": ["Please enter a valid email address."] },
    "requestId": "6fb46b72-49f6-417a-b861-f960980aa6f7"
  }
}
```

| HTTP | `code`                   | When                                                      |
| ---- | ------------------------ | --------------------------------------------------------- |
| 400  | `BAD_REQUEST`            | Malformed JSON                                            |
| 400  | `VALIDATION_ERROR`       | Body failed validation; `details` maps fields to messages |
| 404  | `NOT_FOUND`              | Unknown endpoint, or the profile has not been seeded      |
| 413  | `PAYLOAD_TOO_LARGE`      | Body over 16 kB                                           |
| 415  | `UNSUPPORTED_MEDIA_TYPE` | `POST` body that is not `application/json`                |
| 429  | `RATE_LIMITED`           | Too many requests (see `Retry-After`)                     |
| 500  | `INTERNAL_ERROR`         | Unexpected error (details are only in the server logs)    |
| 503  | `SERVICE_UNAVAILABLE`    | Database unreachable                                      |

**Headers on every response**

- `X-Request-Id`: echoes a valid incoming `X-Request-Id` (8–64 chars `[A-Za-z0-9_-]`) or a generated UUID. It also appears in error bodies and logs.
- `RateLimit` / `RateLimit-Policy`: IETF draft-8 rate limit headers.

**Rate limits** (per client IP; configurable via environment)

- All endpoints: 300 requests per 15 minutes (`RATE_LIMIT_*`)
- `POST /api/contact`: 5 requests per hour (`CONTACT_RATE_LIMIT_*`)

**Caching:** content endpoints send `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
Health and contact responses send `no-store`.

**CORS:** browsers may call the API from `PUBLIC_SITE_URL` and the origins in `CORS_ORIGINS`.
Same-origin calls (the default production setup) need no CORS.

---

## `GET /api/health`

Liveness and database check. Returns `200` when healthy and `503` when the database is down.

```json
{
  "data": {
    "status": "ok",
    "database": "up",
    "uptimeSeconds": 3600,
    "timestamp": "2026-11-17T15:30:45.439Z"
  }
}
```

## `GET /api/profile`

The professional profile with active social links, experience and qualifications.

```json
{
  "data": {
    "id": "01a1ea21-353a-74ea-bb6a-030c2b44f8d7",
    "fullName": "Marina Costa",
    "professionalTitle": "Brand & Digital Product Designer",
    "companyName": "Costa Studio",
    "headline": "I help growing companies turn complex ideas into clear brands…",
    "biography": "Paragraph one.\n\nParagraph two.",
    "profileImage": "/images/profile/marina-costa.webp",
    "email": "marina@example.com",
    "phone": "+1 212 555 0148",
    "whatsapp": "+1 212 555 0148",
    "website": "https://www.example.com",
    "location": "New York, NY",
    "skills": ["Brand strategy", "Figma"],
    "socialLinks": [{ "id": "…", "platform": "LINKEDIN", "url": "https://www.linkedin.com/" }],
    "experience": [
      {
        "id": "…",
        "role": "Founder & Principal Designer",
        "organization": "Costa Studio",
        "startDate": "2019-03-01",
        "endDate": null,
        "description": "…"
      }
    ],
    "qualifications": [
      { "id": "…", "title": "B.A. in Graphic Design", "institution": "…", "year": 2013 }
    ],
    "updatedAt": "2026-11-17T15:24:17.000Z"
  }
}
```

`404 NOT_FOUND` means no profile has been seeded (`pnpm db:seed`).

## `GET /api/services`

Active services in display order.

```json
{ "data": [{ "id": "…", "title": "Brand Identity", "description": "…", "icon": "palette" }] }
```

`icon` is a Lucide icon name. Supported: `palette`, `monitor-smartphone`, `layout-dashboard`,
`component`, `scan-search`, `messages-square`, `pen-tool` (others fall back to `sparkles`).

## `GET /api/portfolio`

Active projects in display order.

```json
{
  "data": [
    {
      "id": "…",
      "title": "Lumen Bank",
      "description": "…",
      "image": "/images/portfolio/lumen-bank.svg",
      "projectUrl": "https://example.com/case-studies/lumen-bank",
      "category": "Product Design",
      "technologies": ["Figma", "iOS"],
      "isFeatured": true
    }
  ]
}
```

## `GET /api/testimonials`

Active testimonials in display order.

```json
{
  "data": [
    {
      "id": "…",
      "authorName": "Daniel Reyes",
      "authorRole": "Head of Product",
      "authorCompany": "Lumen Bank",
      "authorImage": null,
      "quote": "…"
    }
  ]
}
```

## `GET /api/vcard`

Downloads the profile as a vCard 3.0 file.

```
HTTP/1.1 200 OK
Content-Type: text/vcard; charset=utf-8
Content-Disposition: attachment; filename="marina-costa.vcf"

BEGIN:VCARD
VERSION:3.0
PRODID:-//Presence//Digital Business Card//EN
N:Costa;Marina;;;
FN:Marina Costa
ORG:Costa Studio
TITLE:Brand & Digital Product Designer
TEL;TYPE=CELL,VOICE:+12125550148
EMAIL;TYPE=INTERNET,PREF:marina@example.com
URL:https://www.example.com
item2.URL:https://www.example.com/card
item2.X-ABLabel:Digital card
ADR;TYPE=WORK:;;;New York\, NY;;;
NOTE:I help growing companies…
X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/
REV:2026-11-17T15:24:17Z
END:VCARD
```

The WhatsApp number is added as a labelled second `TEL` only when it differs from the phone number.

## `POST /api/contact`

Stores a contact form submission and, when SMTP is configured, emails a notification to
`CONTACT_RECIPIENT` (default: the profile email) with `Reply-To` set to the sender.

**Request** (`Content-Type: application/json`)

| Field       | Type   | Rules                                                                                       |
| ----------- | ------ | ------------------------------------------------------------------------------------------- |
| `name`      | string | Required, 2–100 chars, single line                                                          |
| `email`     | string | Required, valid email, max 254                                                              |
| `phone`     | string | Optional; empty or 7–30 chars of digits, spaces, `+ ( ) . -`                                |
| `subject`   | string | Required, 3–150 chars, single line                                                          |
| `message`   | string | Required, 20–5000 chars                                                                     |
| `botField`  | string | Honeypot. Must be absent or empty                                                           |
| `elapsedMs` | number | Optional. Milliseconds the form was open; below `CONTACT_MIN_FILL_MS` (3000) counts as spam |

Values are trimmed and control characters removed; line breaks in single-line fields become
spaces; unknown fields are ignored.

```bash
curl -X POST https://www.example.com/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","subject":"New website","message":"I would love to discuss a new website for our company.","elapsedMs":8000}'
```

**Response** `201 Created`

```json
{ "data": { "message": "Thank you! Your message has been sent and I will get back to you soon." } }
```

Submissions detected as spam get the same `201` response but are not stored or emailed.

**Errors:** `400 VALIDATION_ERROR` (with `details`), `400 BAD_REQUEST`, `413`, `415`, `429 RATE_LIMITED`, `503`.
