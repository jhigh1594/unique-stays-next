<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UniqueStaysUSA — Agent Guide

## Project Overview

Affiliate directory for unique vacation rentals. Hub-and-spoke model: 5 spokes, ~250 listings.
Stack: Next.js 16 App Router + Payload CMS 3.84 + Neon PostgreSQL + Vercel.

## Payload REST API

**Base URL:** `${NEXT_PUBLIC_SERVER_URL}/api/{collection}`

### Collections and slugs

| Collection | Slug | Description |
|---|---|---|
| Stays | `stays` | Vacation rental listings (primary content) |
| Categories | `categories` | Property types (treehouses, a-frames, etc.) |
| Spokes | `spokes` | Hub sections (unique, work-friendly, etc.) |
| Blog Posts | `blog-posts` | Journal articles published at `/journal/{slug}` |
| Media | `media` | Uploaded images |
| Users | `users` | Admin users (auth) |

### Authentication

All write operations require auth. Two methods:

**API key (recommended for agents):**
```
Authorization: users API-Key <key>
```
Mint a key in the Payload admin under your user record after enabling API keys.

**Session cookie (browser):**
POST to `/api/users/login` with `{ email, password }`, then use the returned `token` as `Authorization: Bearer <token>`.

### Enum values

**`stays.region`** (required):
`West` | `Southwest` | `South` | `Midwest` | `Northeast` | `Southeast`

**`stays.platform`** (required):
`Airbnb` | `VRBO` | `Wander` | `Direct`

**`spokes.slug`** (canonical):
`unique` | `work-friendly` | `pet-friendly` | `rv-ready` | `ev-ready`

## Slug-based upsert pattern

Payload has no native upsert. Use this pattern for seeding or idempotent writes:

```bash
# 1. Look up by slug
GET /api/stays?where[slug][equals]=treehouse-catskills-pine&depth=0&limit=1

# Response: { docs: [...], totalDocs: N }
# If totalDocs === 0 → create with POST
# If totalDocs === 1 → update with PATCH /api/stays/{docs[0].id}
```

Use `depth=0` when you only need IDs. Use `depth=1` to populate relationship fields.

Same pattern applies to categories and spokes (look up by `slug` field).

## Blog post publishing via Payload API

Agents with Jon's admin API key may create and publish journal posts through the Payload REST API. Do not hardcode the key in files or logs; read it from the runtime secret/context the agent was given and send it only in the auth header.

**Endpoint:** `${NEXT_PUBLIC_SERVER_URL}/api/blog-posts`

**Auth header:**
```bash
Authorization: users API-Key <admin_api_key>
```

### Blog post fields

Required for create:
- `slug` — URL-safe unique slug, used at `/journal/{slug}`.
- `title`
- `excerpt` — 1–2 sentence summary for cards and meta description.

Publish controls:
- `status` — `draft` or `published`. New posts default to `draft`.
- `publishedAt` — ISO datetime string. Set when publishing.

Optional editorial fields:
- `subtitle`
- `heroImage` — media collection ID.
- `content` — Payload Lexical JSON.
- `linkedStays` — array of stay IDs.
- `city`, `state`, `latitude`, `longitude`
- `metaTitle`, `metaDescription`

### Minimal Lexical content shape

Use Payload's Lexical JSON shape for `content`. A simple paragraph can be sent like this:

```json
{
  "root": {
    "type": "root",
    "format": "",
    "indent": 0,
    "version": 1,
    "direction": "ltr",
    "children": [
      {
        "type": "paragraph",
        "format": "",
        "indent": 0,
        "version": 1,
        "direction": "ltr",
        "children": [
          {
            "type": "text",
            "text": "Write the article body here.",
            "format": 0,
            "style": "",
            "mode": "normal",
            "detail": 0,
            "version": 1
          }
        ]
      }
    ]
  }
}
```

### Idempotent publish workflow

1. Build a URL-safe slug from the final headline.
2. Check for an existing post by slug:
   ```bash
   GET /api/blog-posts?where[slug][equals]=best-unique-stays-in-vermont&depth=0&limit=1
   ```
3. If `totalDocs === 0`, create it with `POST /api/blog-posts`.
4. If `totalDocs === 1`, update it with `PATCH /api/blog-posts/{id}`.
5. To publish, set `status: "published"` and `publishedAt` to an ISO timestamp. If publishing immediately and no date was provided, use the current time.
6. Verify the API record:
   ```bash
   GET /api/blog-posts?where[slug][equals]=best-unique-stays-in-vermont&depth=1&limit=1
   ```
7. Verify the public page loads at `/journal/{slug}`. The public journal index and sitemap include only `status: "published"` posts.

### Create-and-publish example

```bash
curl -X POST "$NEXT_PUBLIC_SERVER_URL/api/blog-posts" \
  -H "Authorization: users API-Key $PAYLOAD_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "slug": "best-unique-stays-in-vermont",
    "title": "Best Unique Stays in Vermont",
    "subtitle": "Design-forward cabins, treehouses, and off-grid escapes",
    "status": "published",
    "publishedAt": "2026-05-10T12:00:00.000Z",
    "excerpt": "A concise guide to memorable Vermont stays with distinctive settings and practical booking notes.",
    "city": "Stowe",
    "state": "Vermont",
    "metaTitle": "Best Unique Stays in Vermont",
    "metaDescription": "Explore unique Vermont cabins, treehouses, and off-grid stays for memorable getaways."
  }'
```

### Publish an existing draft

```bash
curl -X PATCH "$NEXT_PUBLIC_SERVER_URL/api/blog-posts/{id}" \
  -H "Authorization: users API-Key $PAYLOAD_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "status": "published",
    "publishedAt": "2026-05-10T12:00:00.000Z"
  }'
```

Publishing or unpublishing triggers journal cache revalidation in `src/collections/BlogPosts.ts`.

## Relationship ID resolution

Stays reference categories and spokes by numeric ID in write payloads.

```bash
# Get category ID from slug
GET /api/categories?where[slug][equals]=treehouses&depth=0&limit=1
# → categories[0].id

# Get spoke IDs from slugs
GET /api/spokes?where[slug][in]=work-friendly,pet-friendly&depth=0
# → spokes[].id

# Create a stay with resolved IDs
POST /api/stays
{
  "slug": "treehouse-catskills-pine",
  "title": "Catskills Pine Treehouse",
  "category": <category_id>,
  "spokes": [<spoke_id_1>, <spoke_id_2>],
  ...
}
```

## Full stay POST body example

```json
{
  "slug": "treehouse-catskills-pine",
  "title": "Catskills Pine Treehouse",
  "subtitle": "40 feet up in the canopy",
  "location": "Woodstock, New York",
  "state": "New York",
  "region": "Northeast",
  "category": 3,
  "spokes": [1],
  "platform": "Airbnb",
  "affiliateUrl": "https://www.airbnb.com/rooms/12345678",
  "imageUrl": "https://a0.muscache.com/im/pictures/...",
  "price": 285,
  "rating": 4.9,
  "reviewCount": 142,
  "sleeps": 4,
  "bedrooms": 2,
  "description": "A hand-crafted treehouse...",
  "tags": [
    { "tag": "Stargazing Deck" },
    { "tag": "Wood-Burning Stove" }
  ],
  "featured": false,
  "editorsPick": false,
  "isNew": false
}
```

## Image field strategy

During migration, stays use `imageUrl` (legacy external CDN URL). After migration, stays use `image` (Payload upload relationship).

When reading: prefer `image` if populated, fall back to `imageUrl`.
When writing during seed: set `imageUrl` with the external URL. Upload to `media` collection later.

`affiliateUrl` and `imageUrl` must be valid `https://` URLs — Payload validates this.

## Spoke-specific fields

| Spoke | Group field | Inner fields |
|---|---|---|
| `work-friendly` | `workFriendly` | `wifiSpeed` (text), `hasDesk` (boolean) |
| `pet-friendly` | `petDetails` | `petFriendly` (boolean), `petPolicy` (text) |
| `rv-ready` | `rvDetails` | `rvHookup` (boolean), `rvInfo` (text) |
| `ev-ready` | `evDetails` | `evCharger` (boolean), `evInfo` (text) |

Only populate the group that matches the stay's assigned spokes.

## CLI scripts

```bash
pnpm generate:types   # Regenerate src/payload-types.ts after schema changes
pnpm migrate          # Run pending migrations against Neon
pnpm migrate:create   # Generate a new migration from schema diff
pnpm migrate:down     # Roll back the last migration
```

Always run `pnpm generate:types` and `pnpm migrate` after changing any collection schema.

## Important constraints

- **`push: false`** in Payload config — changes are never auto-pushed. Always create + run migrations.
- **`"type": "module"`** in package.json — all files are ESM. Required for tsx on Node 24.
- **Keep-alive cron** runs at `/keep-alive` every 5 minutes to prevent Neon idle. Requires `CRON_SECRET` env var.
- **Payload admin** at `/admin` — use `maxDuration = 60` on any admin-adjacent route file.
- **Route groups**: `(app)/` = public site, `(payload)/` = CMS admin.

## Learned Workspace Facts

- Prefer `pnpm` for installs and project scripts (`packageManager` is pinned to pnpm). `npx` works for one-off CLIs; avoid `npm install` so the pnpm lockfile stays authoritative.
- Vercel builds should run `next build`; `pnpm index:search` is a manual search-index regeneration step that should tolerate missing `.env.local`.
- Vercel deployments need `PAYLOAD_SECRET` and `DATABASE_URI`; sitemap and public pages import Payload during build.
- The third-party `emrld.ltd` head script is intentionally installed only in `src/app/(app)/layout.tsx`; keep Payload admin routes untouched unless Jon explicitly asks otherwise.
