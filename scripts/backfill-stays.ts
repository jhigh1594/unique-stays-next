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

if ([chunk, chunkSize, delay].some((v) => v !== undefined && isNaN(v))) {
  console.error('Error: --chunk, --chunk-size, and --delay must be valid integers')
  process.exit(1)
}

// ── Helpers ──────────────────────────────────────────────────────
interface Stay {
  id: number
  slug: string
  platform: string
  affiliateUrl: string
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  rating: number | null
  reviewCount: number | null
  tags: Array<{ tag: string }> | null
  reviewReason?: string | null
}

function isMissingFields(s: Stay): boolean {
  return (
    !s.price ||
    s.price === 0 ||
    s.bedrooms == null ||
    s.bedrooms === 0 ||
    s.bathrooms == null ||
    s.bathrooms === 0 ||
    !s.rating ||
    s.rating === 0 ||
    s.reviewCount == null ||
    !s.tags ||
    s.tags.length === 0
  )
}

function buildUpdate(
  stay: Stay,
  scraped: { price: number | null; sleeps: number | null; bedrooms: number | null; bathrooms: number | null; rating: number | null; reviewCount: number | null; amenities: string[] },
): { data: Record<string, unknown>; fields: string[] } {
  const data: Record<string, unknown> = {}
  const fields: string[] = []

  if ((!stay.price || stay.price === 0) && scraped.price && scraped.price > 0) {
    data.price = Math.round(scraped.price)
    fields.push('price')
  }
  if ((stay.bedrooms == null || stay.bedrooms === 0) && scraped.bedrooms && scraped.bedrooms > 0) {
    data.bedrooms = Math.round(scraped.bedrooms)
    fields.push('bedrooms')
  }
  if ((stay.bathrooms == null || stay.bathrooms === 0) && scraped.bathrooms && scraped.bathrooms > 0) {
    data.bathrooms = Math.round(scraped.bathrooms)
    fields.push('bathrooms')
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
  const fieldCounts: Record<string, number> = { price: 0, bedrooms: 0, bathrooms: 0, rating: 0, reviewCount: 0, tags: 0 }
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
          const reason = stay.reviewReason
            ? `${stay.reviewReason}; Backfill scrape failed: ${message}`
            : `Backfill scrape failed: ${message}`
          await payload.update({
            collection: 'stays',
            id: stay.id,
            data: { needsReview: true, reviewReason: reason },
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
    console.log(`    bathrooms:   ${fieldCounts.bathrooms ?? 0}`)
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

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
