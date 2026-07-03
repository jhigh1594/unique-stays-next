# Wander Printing Press CLI Spec

Date: 2026-07-03
Target repo: `unique-stays-next`
Proposed CLI: `wander-pp-cli`

## Purpose

Build a small, agent-native CLI that turns Wander public listing and search surfaces into reliable UniqueStaysUSA candidate and stay enrichment data.

The CLI should not be a generic booking client. Its job is narrower:

- discover Wander listing URLs by state, category, city, search URL, sitemap, or explicit slug list
- extract structured listing data from Wander property pages and any stable public API traffic discovered during browser sniffing
- enrich existing Payload `stays` and `candidate-stays` records with Wander metadata
- copy usable listing images into the existing Cloudflare R2-backed media path
- produce deterministic JSON that local scripts can consume safely

## Context From Printing Press

The `cli-printing-press` repo is built around generating Go CLIs from OpenAPI, GraphQL, docs, HAR, or browser-sniffed website traffic. The useful constraints for this project are:

- generated CLIs are Cobra-based Go binaries with matching MCP servers
- default UX should be agent-native: `--json`, `--compact`, `--select`, `--dry-run`, typed exit codes, auto-JSON when piped
- high-value entities should land in SQLite with `sync`, `search`, `sql`, and freshness controls
- undocumented websites should use browser-sniff or HAR evidence, but runtime commands should prefer replayable HTTP/HTML paths over a resident browser
- generated output should pass build, dogfood, verify, and live smoke checks before being trusted

Wander has no obvious official public API spec. Live inspection shows:

- `www.wander.com` is a Next app with public listing pages under `/property/{slugOrId}`
- listing pages expose `application/ld+json` with VacationRental fields, ratings, reviews, amenities, capacity, coordinates, and image URLs
- listing pages also advertise a machine-readable markdown URL: `/property/{slug}.md`
- region/category pages expose property links and useful listing cards
- the app preconnects and calls `https://api.wander.com`, and bundled JS references `/guest-api/...` paths including availability, listings, users, payments, bookings, checkout, coupons, and referrals

So the first implementation should be a public-data scraper/enricher with optional browser-sniffed API support, not an authenticated booking CLI.

## Non-Obvious Insight

Wander is not just a luxury rental marketplace. For UniqueStaysUSA, every Wander property page is a normalized quality signal: professionally managed homes, amenity completeness, reliable media, work-friendly attributes, coordinates, and review data in a shape that can feed editorial selection faster than marketplace crawling.

## Primary Commands

### `wander-pp-cli get <slug-or-url>`

Fetch one Wander property and return normalized listing JSON.

Inputs:
- `slug-or-url`: `wander-charleston-green`, numeric property IDs, or full `https://www.wander.com/property/...` URL
- `--source html|markdown|api|auto` default `auto`
- `--check-in YYYY-MM-DD --check-out YYYY-MM-DD --guests N` for availability/pricing probes when supported
- `--images-limit N` default `10`
- `--agent` alias for `--json --compact=false`
- `--raw` include raw JSON-LD, markdown, and sniffed API fragments

Output contract:

```json
{
  "id": "wander-charleston-green",
  "slug": "wander-charleston-green",
  "url": "https://www.wander.com/property/wander-charleston-green",
  "name": "Wander Charleston Green",
  "description": "...",
  "city": "Charleston",
  "state": "South Carolina",
  "country": "US",
  "latitude": 32.7893496,
  "longitude": -79.9460664,
  "bedrooms": 4,
  "bathrooms": 3,
  "sleeps": 10,
  "nightlyMin": 562,
  "rating": 4.91,
  "reviewCount": 35,
  "amenities": ["Wifi", "EV Charger", "Patio"],
  "images": [
    {
      "url": "https://assets.wander.com/611197331961806980/640.webp",
      "width": 640,
      "caption": ""
    }
  ],
  "policies": {
    "petsAllowed": true,
    "smokingAllowed": false,
    "checkinTime": "16:00:00",
    "checkoutTime": "10:00:00"
  },
  "source": {
    "fetchedAt": "2026-07-03T17:28:55.000Z",
    "strategy": "jsonld",
    "warnings": []
  }
}
```

### `wander-pp-cli discover`

Find candidate Wander listings.

Inputs:
- `--state "South Carolina"` or `--state-code SC`
- `--city Charleston`
- `--category beach|mountain|ski-season|lake|hawaii|pet-friendly|groups|national-parks|families|forest|city|desert|pools|make-an-offer`
- `--search-url "https://www.wander.com/s?..."`
- `--sitemap` to crawl Wander sitemap/AI sitemap inputs
- `--limit N`
- `--dedupe-file path`
- `--json`, `--csv`, `--compact`

Behavior:
- fetch region/category/search pages
- extract `/property/...` links
- dedupe by normalized slug and canonical URL
- optionally call `get` for each listing when `--hydrate` is passed

### `wander-pp-cli sync`

Persist Wander listings into local SQLite.

Inputs:
- same filters as `discover`
- `--db path`
- `--full`
- `--since duration`
- `--concurrency N` default low, e.g. `2`
- `--max-pages N`

SQLite tables:
- `properties`: slug, url, name, city, state, lat, lng, sleeps, bedrooms, bathrooms, rating, review_count, nightly_min, description, fetched_at, raw_hash
- `property_images`: property_slug, url, width, caption, sort_order, fetched_at
- `property_amenities`: property_slug, code, label
- `property_reviews`: property_slug, author_name, rating, date_published, body_hash, excerpt

Generated `search` and `sql` commands should work over this store.

### `wander-pp-cli unique-stays candidate`

Write discovered listings into Payload `candidate-stays`.

Inputs:
- `--from-json path` or live filters from `discover`
- `--payload-url $NEXT_PUBLIC_SERVER_URL`
- `--payload-api-key-env PAYLOAD_ADMIN_API_KEY`
- `--target-spoke unique|work-friendly|pet-friendly|rv-ready|ev-ready`
- `--status pending|approved`, default `pending`
- `--dry-run`
- `--yes`

Behavior:
- never hardcode API keys
- use Payload slug/source URL upsert: check `candidate-stays?where[sourceUrl][equals]=...`
- default write target is `candidate-stays`, not `stays`
- map platform to `Wander`
- fill `sourceUrl`, `title`, `location`, `city`, `state`, `region`, `price`, `rating`, `reviewCount`, `imageUrl`, `scrapedDescription`, `scrapedAmenities`, `noveltyScore`, `noveltyReason`, `targetSpoke`, `spokeFields`, `discoveredAt`

### `wander-pp-cli unique-stays enrich`

Patch existing Payload `stays` records for platform `Wander`.

Inputs:
- `--payload-url`
- `--payload-api-key-env`
- `--price-only`
- `--meta-only`
- `--images`
- `--limit`
- `--dry-run`

Behavior:
- replace the Wander branch in `scripts/enrich-unified.mjs`
- use `execFile` from Node wrappers, not shell string interpolation
- patch only missing or obviously stale fields unless `--force` is supplied
- preserve human editorial fields unless explicitly requested

### `wander-pp-cli unique-stays images`

Download selected Wander images and upload them through the repo's R2 flow.

This command can either be implemented in the Go CLI via S3-compatible R2 env vars, or kept as a TypeScript repo wrapper that calls `wander-pp-cli get` and then `scripts/lib/r2-upload.ts`. Prefer the TypeScript wrapper if we want to avoid duplicating R2 upload logic in Go.

Required behavior:
- never write Vercel Blob URLs
- R2 key pattern: `stays/{slug}/hero.webp`, `stays/{slug}/gallery-{n}.webp`
- include content hash/versioning when practical
- cap default gallery uploads to 5 images
- skip images already on `media.uniquestaysusa.com` or `.r2.dev`

## UniqueStays Mapping

`stays` required fields:

- `slug`: `wander-{clean city/name}` or upstream slug if already `wander-*`
- `title`: Wander `name`
- `subtitle`: optional short location or amenity line
- `location`: `City, State`
- `city`, `state`, `stateCode`, `region`
- `category`: resolved separately by local rules or manual review
- `spokes`: default `unique`; add `work-friendly` when strong work signals exist
- `platform`: `Wander`
- `affiliateUrl`: canonical Wander property URL
- `imageUrl`: R2 URL once copied; external Wander URL only in dry discovery records
- `price`: `nightlyMin`, rounded
- `rating`, `reviewCount`
- `sleeps`, `bedrooms`, `bathrooms`
- `description`: concise extracted description
- `body`: longer extracted/cleaned description when available
- `tags`: normalized amenities
- `hidden`: true when auto-promoted without editorial review
- `needsReview`: true for auto-created records

Spoke detection:

- `work-friendly`: wifi, high-speed wifi, Starlink, desk, monitor, workstation, office
- `pet-friendly`: petsAllowed true or pet-friendly category
- `ev-ready`: EV charger amenity
- `rv-ready`: probably false unless explicit parking/hookup evidence exists

Region mapping must use the existing enum:

- West, Southwest, South, Midwest, Northeast, Southeast

## Node Wrapper For This Repo

Add a wrapper analogous to `scripts/lib/airbnb-pp-cli.ts`:

`scripts/lib/wander-pp-cli.ts`

Responsibilities:
- resolve binary from `WANDER_PP_CLI_PATH || 'wander-pp-cli'`
- `extractListingSlug(url)`
- `isAvailable()`
- `extractListingData(url): Promise<WanderListingData | null>`
- `extractImages(url): Promise<ImageWithCaption[] | null>`
- call `execFile`, not `exec` or `execSync`
- parse JSON strictly and return `null` on CLI absence/failure

Then update `scripts/enrich-unified.mjs` or replace it with a typed TS script:

- remove the hardcoded Payload API key
- read `PAYLOAD_ADMIN_API_KEY` from env only
- use wrapper output rather than raw shell execution

## Discovery And Build Plan

1. Capture Wander traffic with Printing Press browser sniff.
   - Visit `/locations`, one state page, one category page, one search page, and 3 property pages.
   - Also fetch `/property/{slug}.md` and `application/ld+json` directly.
   - Save HAR/spec artifacts outside the repo unless sanitized.

2. Generate a first CLI from the discovered public surfaces.
   - Use `wander` as the API name.
   - Prefer public no-auth endpoints and HTML/markdown extractors.
   - Treat guest booking/payment/user endpoints as out of scope unless needed for availability/pricing and safe to call anonymously.

3. Add hand-authored domain commands.
   - `get`
   - `discover`
   - `sync`
   - `unique-stays candidate`
   - `unique-stays enrich`
   - optionally `unique-stays images`

4. Add local fixtures.
   - one property HTML fixture
   - one property markdown fixture
   - one region page fixture
   - one JSON-LD fixture
   - one malformed/no-listing fixture

5. Integrate in `unique-stays-next`.
   - add `scripts/lib/wander-pp-cli.ts`
   - update enrichment scripts
   - add docs and examples
   - keep Payload writes env-driven

## Verification Gates

Minimum local checks:

- `wander-pp-cli --version`
- `wander-pp-cli doctor --json`
- `wander-pp-cli get wander-charleston-green --json`
- `wander-pp-cli get https://www.wander.com/property/wander-charleston-green --agent`
- `wander-pp-cli discover --state "South Carolina" --limit 5 --json`
- `wander-pp-cli sync --state "South Carolina" --limit 5 --db /tmp/wander.db`
- `wander-pp-cli search charleston --db /tmp/wander.db --json`
- `wander-pp-cli unique-stays candidate --from-json fixture.json --dry-run --json`
- `wander-pp-cli unique-stays enrich --dry-run --limit 3 --json`

Repo checks after integration:

- `pnpm test`
- `pnpm generate:types` only if Payload schema changes
- no `*.vercel-storage.com` URLs in generated outputs
- no API key values in scripts, docs, fixtures, HARs, or logs

Acceptance criteria:

- single listing extraction returns all fields needed by `scripts/enrich-unified.mjs`
- discovery returns stable canonical property URLs
- candidate upsert is idempotent
- image flow produces only R2-backed URLs when writes are enabled
- dry runs describe exact Payload mutations without mutating anything
- failures are typed: not found, blocked, parse failure, auth/env missing, rate limited

## Open Questions

- Do we need live availability/pricing, or is public card/JSON-LD pricing good enough for the first pass?
- Should `unique-stays images` live inside the Go CLI or remain a TypeScript repo command that composes the CLI with the existing R2 uploader?
- Do we want the CLI published to the Printing Press library, or kept as a private repo-local tool because it is tailored to UniqueStaysUSA Payload fields?
- Should Wander records go straight to `candidate-stays`, or should there be a separate local review JSON file before Payload writes?

## Recommended V1

Build V1 as a private, repo-aware CLI:

- `get`
- `discover`
- `sync`
- `search`
- `unique-stays candidate --dry-run/--write`
- TypeScript wrapper in `scripts/lib/wander-pp-cli.ts`

Defer authenticated booking, checkout, account, and payment endpoints. They are noisy, higher risk, and not needed for UniqueStaysUSA sourcing.
