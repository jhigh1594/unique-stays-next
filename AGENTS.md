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
