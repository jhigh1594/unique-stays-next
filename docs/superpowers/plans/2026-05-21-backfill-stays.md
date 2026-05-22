# Backfill Stays — Structural Data Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `scripts/backfill-stays.ts` script that scrapes live listing pages via Firecrawl and fills missing structural fields (price, bedrooms, rating, reviewCount, amenities) across 352 stays.

**Architecture:** Dedicated script following the same pattern as `enrich-stays.ts`. Uses Firecrawl's JSON schema extraction (proven in the audit pipeline at `src/lib/audit/scrape-listing.ts`) to pull structured data, with markdown-based amenity extraction from `scripts/lib/scraper.ts` as fallback. Chunked execution via `--chunk` and `--platform` flags.

**Tech Stack:** TypeScript, Payload CMS API, Firecrawl, tsx runtime (ESM)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/backfill-stays.ts` | Create | Main script: CLI parsing, stay fetching, scraping loop, Payload updates |
| `scripts/lib/backfill-scraper.ts` | Create | Firecrawl JSON schema extraction for structural fields |
| `scripts/lib/scraper.ts` | Modify | Export `extractAmenities` so backfill-scraper can reuse it |

No other files need changes. No new dependencies.

---

### Task 1: Export `extractAmenities` from `scripts/lib/scraper.ts`

**Files:**
- Modify: `scripts/lib/scraper.ts:80`

The `extractAmenities` function is currently private (not exported). Export it so the backfill scraper can reuse it as a fallback for amenity extraction.

- [ ] **Step 1: Add the `export` keyword to `extractAmenities`**

In `scripts/lib/scraper.ts`, change line 80 from:

```typescript
function extractAmenities(markdown: string): string[] {
```

to:

```typescript
export function extractAmenities(markdown: string): string[] {
```

- [ ] **Step 2: Verify no existing imports break**

Run: `node --env-file=.env.local --import tsx/esm -e "import './scripts/lib/scraper.ts'; console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/scraper.ts
git commit -m "refactor: export extractAmenities from scraper module"
```

---

### Task 2: Create `scripts/lib/backfill-scraper.ts`

**Files:**
- Create: `scripts/lib/backfill-scraper.ts`

This module handles Firecrawl JSON schema extraction for structural stay fields (price, sleeps, bedrooms, rating, reviewCount, amenities). It reuses the retry-with-backoff pattern from `src/lib/audit/scrape-listing.ts`.

- [ ] **Step 1: Create the backfill scraper module**

```typescript
// scripts/lib/backfill-scraper.ts
// Firecrawl JSON schema extraction for structural stay fields

import Firecrawl from '@mendable/firecrawl-js'
import { extractAmenities } from './scraper'

export interface StructuralData {
  price: number | null
  sleeps: number | null
  bedrooms: number | null
  rating: number | null
  reviewCount: number | null
  amenities: string[]
}

export interface BackfillScrapeResult {
  success: boolean
  data?: StructuralData
  error?: string
}

const SCRAPE_DELAY_MS = 4000

export async function scrapeStructuralData(
  url: string,
  retryCount = 0,
): Promise<BackfillScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    return { success: false, error: 'FIRECRAWL_API_KEY not set' }
  }

  try {
    const client = new Firecrawl({ apiKey })

    const result = await client.scrape(url, {
      formats: [
        {
          type: 'json',
          schema: {
            type: 'object',
            properties: {
              price: { type: 'number' },
              sleeps: { type: 'number' },
              bedrooms: { type: 'number' },
              rating: { type: 'number' },
              reviewCount: { type: 'number' },
              amenities: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        'markdown',
      ],
      timeout: 30000,
    })

    if (!result || !result.json) {
      // Fallback: try markdown-based amenity extraction if we got markdown
      let amenities: string[] = []
      if (result?.markdown) {
        amenities = extractAmenities(result.markdown as string)
      }
      if (amenities.length > 0) {
        return {
          success: true,
          data: {
            price: null,
            sleeps: null,
            bedrooms: null,
            rating: null,
            reviewCount: null,
            amenities,
          },
        }
      }
      return { success: false, error: 'Scrape returned no structured data' }
    }

    const json = result.json as Record<string, unknown>
    const markdown = (result.markdown as string) ?? ''

    // Build amenities: prefer JSON, fall back to markdown extraction
    let amenities: string[] = []
    const jsonAmenities = json.amenities
    if (Array.isArray(jsonAmenities) && jsonAmenities.length > 0) {
      amenities = jsonAmenities.filter((a): a is string => typeof a === 'string')
    } else if (markdown) {
      amenities = extractAmenities(markdown)
    }

    return {
      success: true,
      data: {
        price: parseNumber(json.price),
        sleeps: parseNumber(json.sleeps),
        bedrooms: parseNumber(json.bedrooms),
        rating: parseNumber(json.rating),
        reviewCount: parseNumber(json.reviewCount),
        amenities,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const is429 = message.includes('429') || message.includes('rate limit')

    if (is429 && retryCount < 2) {
      const delay = SCRAPE_DELAY_MS * Math.pow(2, retryCount + 1)
      await new Promise((r) => setTimeout(r, delay))
      return scrapeStructuralData(url, retryCount + 1)
    }

    return { success: false, error: message }
  }
}

function parseNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value > 0 ? value : null
  if (typeof value === 'string') {
    const match = value.match(/\$?([\d.]+)/)
    if (match) {
      const parsed = parseFloat(match[1])
      return parsed > 0 ? parsed : null
    }
  }
  return null
}

export async function scrapeDelay(): Promise<void> {
  await new Promise((r) => setTimeout(r, SCRAPE_DELAY_MS))
}
```

- [ ] **Step 2: Verify the module loads**

Run: `node --env-file=.env.local --import tsx/esm -e "import './scripts/lib/backfill-scraper.ts'; console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/backfill-scraper.ts
git commit -m "feat: add backfill-scraper module for structural field extraction"
```

---

### Task 3: Create `scripts/backfill-stays.ts`

**Files:**
- Create: `scripts/backfill-stays.ts`

The main script. Fetches stays with missing fields, scrapes structural data, and updates Payload. Supports `--platform`, `--chunk`, `--chunk-size`, `--delay`, `--dry-run`, and `--force` flags.

- [ ] **Step 1: Create the main backfill script**

```typescript
// scripts/backfill-stays.ts
// Backfill missing structural fields (price, bedrooms, rating, reviewCount, amenities)
// by scraping live listing pages via Firecrawl.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/backfill-stays.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, FIRECRAWL_API_KEY
//
// Flags:
//   --platform <name>    Filter to one platform (airbnb, vrbo, wander, direct)
//   --chunk <N>          Process only chunk N (1-indexed)
//   --chunk-size <N>     Stays per chunk (default 25)
//   --delay <ms>         Delay between scrapes (default 3000)
//   --dry-run            Show what would update without writing
//   --force              Re-scrape stays that already have all fields

import { getPayload } from 'payload'
import config from '@payload-config'
import { scrapeStructuralData } from './lib/backfill-scraper'

// ── CLI arg parsing ──────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const platformFilter = getArg('platform')?.toLowerCase()
const chunk = getArg('chunk') ? parseInt(getArg('chunk')!, 10) : undefined
const chunkSize = parseInt(getArg('chunk-size') ?? '25', 10)
const delay = parseInt(getArg('delay') ?? '3000', 10)
const dryRun = hasFlag('dry-run')
const force = hasFlag('force')

// ── Helpers ──────────────────────────────────────────────────────
interface Stay {
  id: number
  slug: string
  platform: string
  affiliateUrl: string
  price: number | null
  bedrooms: number | null
  rating: number | null
  reviewCount: number | null
  tags: Array<{ tag: string }> | null
}

function isMissingFields(s: Stay): boolean {
  return (
    !s.price ||
    s.price === 0 ||
    s.bedrooms == null ||
    s.bedrooms === 0 ||
    !s.rating ||
    s.rating === 0 ||
    s.reviewCount == null ||
    !s.tags ||
    s.tags.length === 0
  )
}

function buildUpdate(
  stay: Stay,
  scraped: { price: number | null; sleeps: number | null; bedrooms: number | null; rating: number | null; reviewCount: number | null; amenities: string[] },
): { data: Record<string, unknown>; fields: string[] } {
  const data: Record<string, unknown> = {}
  const fields: string[] = []

  if ((!stay.price || stay.price === 0) && scraped.price && scraped.price > 0) {
    data.price = Math.round(scraped.price)
    fields.push('price')
  }
  if (scraped.sleeps && scraped.sleeps > 0) {
    // Only set sleeps if it's currently at the default
    // (sleeps field is required and always >= 1, so we don't overwrite)
  }
  if ((stay.bedrooms == null || stay.bedrooms === 0) && scraped.bedrooms && scraped.bedrooms > 0) {
    data.bedrooms = Math.round(scraped.bedrooms)
    fields.push('bedrooms')
  }
  if ((!stay.rating || stay.rating === 0) && scraped.rating && scraped.rating > 0 && scraped.rating <= 5) {
    data.rating = Math.round(scraped.rating * 10) / 10
    fields.push('rating')
  }
  if (stay.reviewCount == null && scraped.reviewCount && scraped.reviewCount > 0) {
    data.reviewCount = Math.round(scraped.reviewCount)
    fields.push('reviewCount')
  }
  if ((!stay.tags || stay.tags.length === 0) && scraped.amenities.length > 0) {
    data.tags = scraped.amenities.map((a) => ({ tag: a }))
    fields.push('tags')
  }

  return { data, fields }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const payload = await getPayload({ config })

  console.log('Fetching stays from Payload...')
  const result = await payload.find({
    collection: 'stays',
    limit: 500,
    depth: 0,
  })

  let stays = result.docs as Stay[]

  // Filter to stays with missing fields (unless --force)
  if (!force) {
    stays = stays.filter(isMissingFields)
  }

  // Filter by platform
  if (platformFilter) {
    stays = stays.filter((s) => s.platform.toLowerCase() === platformFilter)
  }

  // Skip Direct platform (no scrape target)
  const directCount = stays.filter((s) => s.platform === 'Direct').length
  stays = stays.filter((s) => s.platform !== 'Direct')

  // Apply chunk filter
  if (chunk !== undefined) {
    const start = (chunk - 1) * chunkSize
    stays = stays.slice(start, start + chunkSize)
  }

  console.log(`Processing ${stays.length} stays${directCount ? ` (skipped ${directCount} Direct)` : ''}${dryRun ? ' (dry run)' : ''}`)
  if (chunk !== undefined) {
    console.log(`  Chunk ${chunk}, chunk-size ${chunkSize}`)
  }

  // Track results
  let processed = 0
  let succeeded = 0
  let failed = 0
  let skipped = 0
  const fieldCounts: Record<string, number> = { price: 0, bedrooms: 0, rating: 0, reviewCount: 0, tags: 0 }
  const flaggedForReview: string[] = []
  const failures: Array<{ slug: string; error: string }> = []

  for (const stay of stays) {
    const slug = stay.slug
    processed++

    try {
      const scrapeResult = await scrapeStructuralData(stay.affiliateUrl)

      if (!scrapeResult.success || !scrapeResult.data) {
        failed++
        failures.push({ slug, error: scrapeResult.error ?? 'unknown error' })
        process.stdout.write(`✗ ${slug}: scrape failed (${scrapeResult.error})\n`)
        continue
      }

      const { data, fields } = buildUpdate(stay, scrapeResult.data)

      if (fields.length === 0) {
        skipped++
        process.stdout.write(`⊘ ${slug} (no fillable fields)\n`)
        continue
      }

      if (dryRun) {
        const fieldSummary = fields.map((f) => {
          if (f === 'tags') return `amenities=${scrapeResult.data!.amenities.length}`
          return `${f}=${data[f]}`
        }).join(', ')
        process.stdout.write(`[dry-run] ${slug} (${fieldSummary})\n`)
        succeeded++
        continue
      }

      await payload.update({
        collection: 'stays',
        id: stay.id,
        data,
        overrideAccess: true,
      })

      const fieldSummary = fields.map((f) => {
        if (f === 'tags') return `amenities=${scrapeResult.data!.amenities.length}`
        return `${f}=${data[f]}`
      }).join(', ')

      process.stdout.write(`✓ ${slug} (${fieldSummary})\n`)
      succeeded++
      fields.forEach((f) => { fieldCounts[f] = (fieldCounts[f] || 0) + 1 })

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      failed++
      failures.push({ slug, error: message })
      process.stdout.write(`✗ ${slug}: ${message}\n`)

      // Flag for review on scrape failure
      if (!dryRun) {
        flaggedForReview.push(slug)
        try {
          await payload.update({
            collection: 'stays',
            id: stay.id,
            data: { needsReview: true, reviewReason: `Backfill scrape failed: ${message}` },
            overrideAccess: true,
          })
        } catch { /* best effort */ }
      }
    }

    // Rate limiting delay between stays
    if (delay > 0 && processed < stays.length) {
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  // ── Report ──────────────────────────────────────────────────────
  console.log('\n═══ Backfill Report ═══')
  console.log(`  Total:     ${stays.length}`)
  console.log(`  Succeeded: ${succeeded}`)
  console.log(`  Failed:    ${failed}`)
  console.log(`  Skipped:   ${skipped}`)

  if (Object.values(fieldCounts).some((v) => v > 0)) {
    console.log('\n  Fields filled:')
    console.log(`    price:       ${fieldCounts.price ?? 0}`)
    console.log(`    bedrooms:    ${fieldCounts.bedrooms ?? 0}`)
    console.log(`    rating:      ${fieldCounts.rating ?? 0}`)
    console.log(`    reviewCount: ${fieldCounts.reviewCount ?? 0}`)
    console.log(`    tags:        ${fieldCounts.tags ?? 0}`)
  }

  if (flaggedForReview.length > 0) {
    console.log(`\n⚑ Needs review (${flaggedForReview.length}):`)
    flaggedForReview.forEach((s) => console.log(`  - ${s}`))
  }

  if (failures.length > 0) {
    console.log(`\n✗ Failures (${failures.length}):`)
    failures.forEach(({ slug, error }) => console.log(`  - ${slug}: ${error}`))
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Verify the script loads without errors**

Run: `node --env-file=.env.local --import tsx/esm -e "import './scripts/backfill-stays.ts'" 2>&1 | head -5`
Expected: Script starts fetching from Payload (may time out or produce output about stays — that's fine, confirms it loads)

- [ ] **Step 3: Run a dry-run on a single chunk to verify end-to-end**

Run: `node --env-file=.env.local --import tsx/esm scripts/backfill-stays.ts --platform airbnb --chunk 1 --dry-run`
Expected: Prints `[dry-run]` lines showing which stays would get which fields, followed by the summary report

- [ ] **Step 4: Commit**

```bash
git add scripts/backfill-stays.ts
git commit -m "feat: add backfill-stays script for structural field enrichment"
```

---

### Task 4: Add `pnpm backfill` script alias

**Files:**
- Modify: `package.json:7` (the `scripts` section)

Add a convenience script alias so the backfill can be run with `pnpm backfill` instead of the full `node --env-file` command.

- [ ] **Step 1: Add the backfill script to package.json**

In `package.json`, add this entry in the `scripts` object (after the existing `migrate-images` line):

```json
"backfill": "node --env-file=.env.local --import tsx/esm scripts/backfill-stays.ts --"
```

The trailing `--` ensures all additional flags pass through correctly: `pnpm backfill --platform airbnb --chunk 1`

- [ ] **Step 2: Verify the alias works with dry-run**

Run: `pnpm backfill --dry-run --platform airbnb --chunk 1`
Expected: Same dry-run output as the direct node command

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add pnpm backfill script alias"
```

---

### Task 5: Run first chunk against production data

**Files:** None (runtime execution)

This is the first real execution against production data. Run chunk 1 of Airbnb stays to validate the pipeline works end-to-end.

- [ ] **Step 1: Run chunk 1 with live data**

Run: `pnpm backfill --platform airbnb --chunk 1`
Expected: Processes 25 Airbnb stays, prints per-stay results and summary. Some scrapes may fail (anti-bot), which is expected.

- [ ] **Step 2: Review the report output**

Check that:
- Price values are reasonable (not 0, not wildly off)
- Ratings are in 1-5 range
- Bedroom counts are positive integers
- Amenity counts look plausible (3-30 range)

- [ ] **Step 3: Spot-check 2-3 updated stays in Payload**

Verify via API or admin that the fields were actually written:

```bash
curl -s "$NEXT_PUBLIC_SERVER_URL/api/stays?where[slug][equals]=UPDATED_SLUG&depth=0&limit=1" | jq '.docs[0] | {slug, price, bedrooms, rating, reviewCount, tagCount: (.tags | length)}'
```

---

### Task 6: Execute remaining chunks

**Files:** None (runtime execution)

Continue running chunks across all platforms. This is a manual process — run each chunk, review the report, then proceed.

- [ ] **Step 1: Run remaining Airbnb chunks (2-8)**

```bash
pnpm backfill --platform airbnb --chunk 2
pnpm backfill --platform airbnb --chunk 3
# ... through chunk 8
```

- [ ] **Step 2: Run VRBO chunks (1-4)**

```bash
pnpm backfill --platform vrbo --chunk 1
pnpm backfill --platform vrbo --chunk 2
# ... through chunk 4
```

- [ ] **Step 3: Run Wander chunks (1)**

```bash
pnpm backfill --platform wander --chunk 1
```

- [ ] **Step 4: Run a final gap check**

```bash
node --env-file=.env.local --import tsx/esm -e "
import { getPayload } from 'payload'
import config from '@payload-config'
async function main() {
  const p = await getPayload({ config })
  const r = await p.find({ collection: 'stays', limit: 500, depth: 0 })
  const s = r.docs
  console.log('Remaining gaps:')
  console.log('  price:', s.filter(x => !x.price || x.price === 0).length)
  console.log('  bedrooms:', s.filter(x => x.bedrooms == null || x.bedrooms === 0).length)
  console.log('  rating:', s.filter(x => !x.rating || x.rating === 0).length)
  console.log('  reviewCount:', s.filter(x => x.reviewCount == null).length)
  console.log('  tags:', s.filter(x => !x.tags || x.tags.length === 0).length)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
"
```

Expected: Significant reduction in all gap counts. Direct platform stays will still show gaps (no scrape target).
