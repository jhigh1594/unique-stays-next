// Discover new unique stays from Airbnb, VRBO, and Wander
// Run: node --env-file=.env.local --import tsx/esm scripts/discover-stays.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, FIRECRAWL_API_KEY, NVIDIA_NIM_API_KEY
// Flags: --pilot            Scrape only (fast, for testing)
//        --force            Re-discover even if candidates exist
//        --delay <ms>       Delay between scrapes (default 2000)
//        --limit <n>        Max candidates to write (default 20)
//        --source <list>    Comma-separated sources: airbnb,vrbo,wander
//        --min-score <n>    Minimum novelty score threshold (default 5)
//        --no-notify        Skip email notification

import { getPayload } from 'payload'
import config from '@payload-config'
import { discoverAll } from './lib/discoverer'
import { scoreBatch } from './lib/scorer'
import { sendDiscoveryNotification } from './lib/notify'

// ── CLI arg parsing ──────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const pilot = hasFlag('pilot')
const force = hasFlag('force')
const delay = parseInt(getArg('delay') ?? '2000', 10)
const limit = parseInt(getArg('limit') ?? '20', 10)
const minScore = parseInt(getArg('minScore') ?? '5', 10)
const noNotify = hasFlag('no-notify')
const sourceArg = getArg('source')
const sources = sourceArg
  ? sourceArg.split(',').map((s) => s.trim() as 'airbnb' | 'vrbo' | 'wander')
  : undefined

const MODEL_ID = process.env.DISCOVER_MODEL_ID

// ── State mapping ─────────────────────────────────────────────────

// Simple state extraction from location string
function extractState(location: string): string {
  // Try "City, ST" or "City, State" pattern
  const match = location.match(/,\s*([A-Z]{2})\s*$/)
  if (match) return match[1]

  const stateMatch = location.match(/,\s*([A-Za-z ]+)$/)
  if (stateMatch) return stateMatch[1].trim()

  return ''
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const payload = await getPayload({ config })

  console.log('═══ Stay Discovery Pipeline ═══')
  console.log(`  Sources: ${sources?.join(', ') ?? 'all'}`)
  console.log(`  Limit: ${limit}`)
  console.log(`  Min score: ${minScore}`)
  console.log(`  Pilot: ${pilot}`)

  // Step 1: Discover listings from platforms
  console.log('\n── Phase 1: Crawling platforms ──')
  const rawListings = await discoverAll(sources, pilot ? 5 : undefined)
  console.log(`  Raw listings discovered: ${rawListings.length}`)

  if (rawListings.length === 0) {
    console.log('\nNo listings discovered. Exiting.')
    process.exit(0)
  }

  // Step 2: Deduplicate against existing stays and existing candidates
  console.log('\n── Phase 2: Deduplicating ──')

  const existingStays = await payload.find({
    collection: 'stays',
    limit: 500,
    depth: 0,
  })
  const existingUrls = new Set(existingStays.docs.map((s) => s.affiliateUrl as string))

  const existingCandidates = await payload.find({
    collection: 'candidate-stays',
    limit: 500,
    depth: 0,
  })
  const candidateUrls = new Set(existingCandidates.docs.map((c) => c.sourceUrl as string))

  const newListings = rawListings.filter((l) => {
    if (existingUrls.has(l.sourceUrl)) return false
    if (!force && candidateUrls.has(l.sourceUrl)) return false
    return true
  })

  console.log(`  After dedup: ${newListings.length} new listings`)

  if (newListings.length === 0) {
    console.log('\nNo new listings after dedup. Exiting.')
    process.exit(0)
  }

  // Step 3: Score with LLM for novelty
  console.log('\n── Phase 3: Scoring novelty ──')

  const scored = await scoreBatch(newListings, MODEL_ID, delay)

  // Merge scored results with original listing data (sourceUrl, rating, etc)
  const scoredWithSource = scored.map((s, i) => ({
    ...s,
    sourceUrl: newListings[i].sourceUrl,
    platform: newListings[i].platform,
    rating: newListings[i].rating,
    reviewCount: newListings[i].reviewCount,
  }))

  // Filter by minimum score
  const passing = scoredWithSource
    .filter((s) => s.novelty.score >= minScore)
    .sort((a, b) => b.novelty.score - a.novelty.score)
    .slice(0, limit)

  console.log(`  Scored: ${scored.length} listings`)
  console.log(`  Passing (score >= ${minScore}): ${passing.length} listings`)

  if (passing.length === 0) {
    console.log('\nNo listings passed novelty threshold. Exiting.')
    process.exit(0)
  }

  // Step 4: Write candidates to Payload
  console.log('\n── Phase 4: Writing candidates ──')

  let written = 0
  let failed = 0
  const candidates: Array<{
    title: string
    location: string
    imageUrl?: string
    noveltyScore: number
    sourceUrl: string
    platform: string
  }> = []

  for (const item of passing) {
    try {
      await payload.create({
        collection: 'candidate-stays',
        data: {
          sourceUrl: item.sourceUrl,
          platform: item.platform,
          title: item.title,
          location: item.location,
          state: extractState(item.location),
          price: item.price,
          rating: item.rating,
          reviewCount: item.reviewCount,
          imageUrl: item.imageUrl ?? '',
          scrapedDescription: item.description,
          scrapedAmenities: item.amenities?.map((a) => ({ amenity: a })) ?? [],
          noveltyScore: item.novelty.score,
          noveltyReason: item.novelty.reason,
          status: 'pending',
          discoveredAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })

      candidates.push({
        title: item.title,
        location: item.location,
        imageUrl: item.imageUrl,
        noveltyScore: item.novelty.score,
        sourceUrl: item.sourceUrl,
        platform: item.platform,
      })

      written++
      process.stdout.write(`✓ ${item.title} (${item.novelty.score}/10)\n`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      failed++
      process.stdout.write(`✗ ${item.title}: ${message}\n`)
    }
  }

  // Step 5: Send notification
  if (!noNotify && written > 0) {
    console.log('\n── Phase 5: Sending notification ──')
    const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/admin/collections/candidate-stays`
    const notifyResult = await sendDiscoveryNotification(written, candidates, adminUrl)
    if (notifyResult.success) {
      console.log('  Notification sent.')
    } else {
      console.log(`  Notification failed: ${notifyResult.error}`)
    }
  }

  // ── Report ──────────────────────────────────────────────────────
  console.log('\n═══ Discovery Report ═══')
  console.log(`  Raw discovered:  ${rawListings.length}`)
  console.log(`  After dedup:     ${newListings.length}`)
  console.log(`  Scored:          ${scored.length}`)
  console.log(`  Passing filter:  ${passing.length}`)
  console.log(`  Written:         ${written}`)
  console.log(`  Failed:          ${failed}`)

  if (candidates.length > 0) {
    console.log('\nTop candidates:')
    candidates.slice(0, 5).forEach((c) => {
      console.log(`  ${c.noveltyScore}/10  ${c.title} (${c.platform})`)
    })
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
