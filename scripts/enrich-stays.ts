// Enrich stays with scraped + AI-generated editorial content
// Run: node --env-file=.env.local --import tsx/esm scripts/enrich-stays.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, FIRECRAWL_API_KEY, NVIDIA_NIM_API_KEY, BLOB_READ_WRITE_TOKEN
// Flags: --pilot <slugs>  Process only listed slugs (comma-separated)
//        --force           Re-enrich stays that already have body content
//        --delay <ms>      Delay between scrapes (default 2000)

import { getPayload } from 'payload'
import config from '@payload-config'
import { scrapeListing } from './lib/scraper'
import { generateEditorialContent, type StayMetadata, type ScrapedInput } from './lib/generator'
import { processGalleryImages } from './lib/images'

// ── CLI arg parsing ──────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const pilotSlugs = getArg('pilot')?.split(',').map((s) => s.trim()).filter(Boolean)
const force = hasFlag('force')
const delay = parseInt(getArg('delay') ?? '2000', 10)

const MODEL_ID = process.env.ENRICH_MODEL_ID

// ── Field constraints ────────────────────────────────────────────
const MAX_BODY = 5000
const MAX_AREA_GUIDE = 2000
const MAX_FAQS = 10

function validateOutput(content: {
  body: string
  areaGuide?: string
  faqs?: Array<{ question: string; answer: string }>
}): { body: string; areaGuide?: string; faqs?: Array<{ question: string; answer: string }> } {
  return {
    body: content.body.slice(0, MAX_BODY),
    areaGuide: content.areaGuide?.slice(0, MAX_AREA_GUIDE),
    faqs: content.faqs?.slice(0, MAX_FAQS),
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const payload = await getPayload({ config })

  console.log('Fetching stays from Payload...')
  const result = await payload.find({
    collection: 'stays',
    limit: 500,
    depth: 1,
  })

  let stays = result.docs as Array<Record<string, unknown>>

  // Filter by pilot slugs
  if (pilotSlugs && pilotSlugs.length > 0) {
    stays = stays.filter((s) => pilotSlugs.includes(s.slug as string))
    console.log(`Pilot mode: processing ${stays.length} stays`)
  }

  // Track results
  let processed = 0
  let succeeded = 0
  let failed = 0
  let skipped = 0
  const flaggedForReview: string[] = []
  const failures: Array<{ slug: string; error: string }> = []

  for (const stay of stays) {
    const slug = stay.slug as string
    processed++

    // Idempotency: skip stays that already have body (unless --force)
    if ((stay.body as string) && !force) {
      skipped++
      process.stdoutWrite(`⊘ ${slug} (already enriched)\n`)
      continue
    }

    // Determine tier
    const tier = (stay.featured as boolean) || (stay.editorsPick as boolean) ? 1 : 2

    try {
      // Step 1: Scrape
      const affiliateUrl = stay.affiliateUrl as string
      const scrapeResult = await scrapeListing(affiliateUrl)

      const scraped: ScrapedInput = scrapeResult.success && scrapeResult.data
        ? scrapeResult.data
        : { description: '', amenities: [], neighborhood: '' }

      if (!scrapeResult.success) {
        process.stdoutWrite(`⚠ ${slug}: scrape failed (${scrapeResult.error})\n`)
      }

      // Step 2: Generate editorial content
      const stayMeta: StayMetadata = {
        title: (stay.title as string) ?? '',
        location: (stay.location as string) ?? '',
        state: (stay.state as string) ?? '',
        region: (stay.region as string) ?? '',
        category: typeof stay.category === 'object' && stay.category !== null
          ? ((stay.category as Record<string, unknown>).slug as string) ?? ''
          : '',
        tags: ((stay.tags as Array<{ tag: string }>) ?? []).map((t) => t.tag),
        description: (stay.description as string) ?? '',
        price: (stay.price as number) ?? 0,
      }

      const generated = await generateEditorialContent(stayMeta, scraped, tier as 1 | 2, MODEL_ID)

      // Step 3: Validate output
      const validated = validateOutput(generated)

      // Step 4: Download and upload gallery images
      let galleryImages: Array<{ imageUrl: string }> = []
      if (scraped.photoUrls.length > 0) {
        const imageLimit = tier === 1 ? 5 : 3
        galleryImages = await processGalleryImages(scraped.photoUrls, slug, imageLimit)
      }

      // Step 5: Write to Payload
      const updateData: Record<string, unknown> = {
        body: validated.body,
        bestFor: generated.bestFor,
        bestSeason: generated.bestSeason,
        vibe: generated.vibe,
      }

      if (validated.areaGuide) updateData.areaGuide = validated.areaGuide
      if (validated.faqs && validated.faqs.length > 0) updateData.faqs = validated.faqs
      if (generated.editorNote) updateData.editorNote = generated.editorNote
      if (galleryImages.length > 0) updateData.galleryImages = galleryImages

      await payload.update({
        collection: 'stays',
        id: stay.id as number,
        data: updateData,
        overrideAccess: true,
      })

      if (generated.needsReview) {
        flaggedForReview.push(slug)
        process.stdoutWrite(`⚑ ${slug} (T${tier}, needs review)\n`)
      } else {
        process.stdoutWrite(`✓ ${slug} (T${tier})\n`)
      }

      succeeded++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      failures.push({ slug, error: message })
      failed++
      process.stdoutWrite(`✗ ${slug}: ${message}\n`)
    }

    // Rate limiting delay between stays
    if (delay > 0 && processed < stays.length) {
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  // ── Report ──────────────────────────────────────────────────────
  console.log('\n═══ Enrichment Report ═══')
  console.log(`  Total:     ${stays.length}`)
  console.log(`  Succeeded: ${succeeded}`)
  console.log(`  Failed:    ${failed}`)
  console.log(`  Skipped:   ${skipped}`)

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
