# UniqueStaysUSA

Affiliate directory for unique vacation rentals. Hub-and-spoke model: 5 spokes, ~250 listings.

**Stack:** Next.js 16 App Router + Payload CMS 3 + Neon PostgreSQL + Vercel

## Local Development

```bash
pnpm install
cp .env.local.example .env.local   # fill in your Neon + Payload credentials
pnpm migrate                        # run pending migrations against Neon
pnpm dev                            # starts Next.js + Payload on :3000
```

- **Site:** http://localhost:3000
- **Payload Admin:** http://localhost:3000/admin
- **API:** http://localhost:3000/api/stays (REST, see AGENTS.md for full docs)

## Payload CMS CLI

```bash
pnpm generate:types   # regenerate src/payload-types.ts after schema changes
pnpm migrate          # run pending migrations
pnpm migrate:create   # generate a new migration from schema diff
pnpm migrate:down     # roll back the last migration
```

After any collection schema change: `pnpm generate:types && pnpm migrate`.

## Seed Script

Seeds categories, spokes, and stays from a local JSON data file into Payload.

```bash
pnpm seed
```

Requires `DATABASE_URI` and `PAYLOAD_SECRET` in `.env.local`. Idempotent — skips existing records by slug.

## Architecture

| Route group | Purpose |
|---|---|
| `(app)/` | Public site pages |
| `(payload)/` | CMS admin + REST API (`/api/[...slug]`) |

## Key Endpoints

| Path | Purpose |
|---|---|
| `/keep-alive` | Neon idle-prevention cron (requires `CRON_SECRET` header) |
| `/api/stays` | Stays collection REST API |
| `/api/categories` | Categories REST API |
| `/api/spokes` | Spokes REST API |
| `/api/webhook/snowseo` | SnowSEO content webhook (see `docs/snowseo-webhook.md`) |

## SnowSEO Webhook

Journal posts can be pushed from SnowSEO. Set `SNOWSEO_WEBHOOK_SECRET` in `.env.local` (see `.env.local.example`) to the same bearer token configured in SnowSEO. Full setup: [docs/snowseo-webhook.md](docs/snowseo-webhook.md).

## Deployment

Deployed on Vercel with automatic previews. Production uses a daily cron to keep the Neon database warm.

Required env vars on Vercel: `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `SNOWSEO_WEBHOOK_SECRET` (if using SnowSEO webhooks).
