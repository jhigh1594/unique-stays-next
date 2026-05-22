# Backfill Stays — Structural Data Enrichment

**Date:** 2026-05-21
**Status:** Approved

## Problem

117 stays are missing price, 120 missing bedrooms, 69 missing rating, 80 missing reviewCount, and 44 missing amenity tags. These structural gaps affect listing quality on the public site.

## Solution

A dedicated `scripts/backfill-stays.ts` script that scrapes live listing pages via Firecrawl JSON schema extraction and fills missing structural fields. Separate from the existing editorial enrichment pipeline (`enrich-stays.ts`) which focuses on body content, area guides, and FAQs.

## Current Data Gaps

| Field | Missing | % |
|-------|---------|---|
| price | 117 | 33% |
| bedrooms | 120 | 34% |
| rating | 69 | 20% |
| reviewCount | 80 | 23% |
| tags (amenities) | 44 | 12% |

67 stays are missing 2+ fields. Platform distribution: 182 Airbnb, 94 VRBO, 68 Direct, 8 Wander.

## Script Design

### Entry point

```bash
node --env-file=.env.local --import tsx/esm scripts/backfill-stays.ts
```

### CLI flags

| Flag | Description | Default |
|------|-------------|---------|
| `--platform <name>` | Filter to one platform (airbnb, vrbo, wander, direct) | all |
| `--chunk <N>` | Process only chunk N (1-indexed) | all |
| `--chunk-size <N>` | Stays per chunk | 25 |
| `--delay <ms>` | Delay between scrapes | 3000 |
| `--dry-run` | Show what would update without writing | false |
| `--force` | Re-scrape stays that already have values | false |

### Processing flow

1. Fetch all stays from Payload (limit 500, depth 0)
2. Filter to stays missing at least one target field (price, bedrooms, rating, reviewCount, tags) unless `--force`
3. Skip `Direct` platform stays (no scrape target)
4. Apply `--platform` filter if set
5. Apply chunk filter: take `chunkSize` stays starting at `(chunk - 1) * chunkSize`
6. For each stay:
   a. Call Firecrawl with extended JSON schema
   b. Map extracted data to Payload fields
   c. For amenities: use JSON-extracted list, fall back to markdown-based extraction from `scripts/lib/scraper.ts`
   d. Map amenities to `tags[]` format: `{ tag: "name" }`
   e. Only include fields that were actually missing (partial updates)
   f. PATCH the stay via Payload `update()`
7. Print summary with per-field counts

### Firecrawl JSON schema

```json
{
  "type": "object",
  "properties": {
    "price": { "type": "number" },
    "sleeps": { "type": "number" },
    "bedrooms": { "type": "number" },
    "rating": { "type": "number" },
    "reviewCount": { "type": "number" },
    "amenities": { "type": "array", "items": { "type": "string" } }
  }
}
```

### Field mapping

| Scraped field | Payload field | Notes |
|---------------|---------------|-------|
| price | price | Integer USD, skip if 0 |
| sleeps | sleeps | Skip if 0 or null |
| bedrooms | bedrooms | Skip if 0 or null |
| rating | rating | 1-5 scale, skip if 0 |
| reviewCount | reviewCount | Integer, skip if null |
| amenities | tags | Map to `[{ tag: "name" }]` |

### Error handling

- **Rate limits (429):** Retry up to 2x with exponential backoff (4s, 8s, 16s)
- **Scrape failures:** Log error, set `needsReview: true` on the stay, continue
- **Invalid data (price=0, rating=0):** Don't overwrite existing values, log warning
- **Direct platform:** Skip entirely, log count

### Amenity extraction strategy

Two-tier approach:

1. **Primary:** Firecrawl JSON schema extraction — returns structured amenity list
2. **Fallback:** Reuse `extractAmenities()` from `scripts/lib/scraper.ts` which parses the markdown content for amenity sections

Only update tags if the scraped list is non-empty and the stay currently has no tags.

### Output format

```
✓ treehouse-catskills-pine (price=285, rating=4.9, reviewCount=142)
⚑ cozy-aframe-portland (rating=4.7, amenities=6) — needs review
⊘ luxury-dome-sedona (already complete)
✗ cabin-bend: scrape failed (timeout)

═══ Backfill Report ═══
  Total:     25
  Succeeded: 18
  Failed:    2
  Skipped:   5

  Fields filled:
    price:       12
    bedrooms:    8
    rating:      10
    reviewCount: 9
    tags:        4
```

## Dependencies

- Reuses `scripts/lib/scraper.ts` for amenity extraction fallback
- No new library dependencies
- Required env vars: `DATABASE_URI`, `PAYLOAD_SECRET`, `FIRECRAWL_API_KEY`

## Chunked execution plan

Suggested run order (Airbnb first, largest gap):

```bash
# Airbnb (182 stays, ~8 chunks of 25)
pnpm backfill --platform airbnb --chunk 1
pnpm backfill --platform airbnb --chunk 2
# ... through chunk 8

# VRBO (94 stays, ~4 chunks)
pnpm backfill --platform vrbo --chunk 1
# ... through chunk 4

# Wander (8 stays, 1 chunk)
pnpm backfill --platform wander --chunk 1
```

## Out of scope

- Editorial content enrichment (handled by `enrich-stays.ts`)
- Direct platform stays (no scrape target — manual entry or separate solution)
- Gallery image upload
- Discovery of new listings
