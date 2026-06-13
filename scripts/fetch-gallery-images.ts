// Fetch gallery images for all stays by scraping actual listing pages
// Run: node --env-file=.env.local --import tsx/esm scripts/fetch-gallery-images.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//           CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_URL
// Uses crawl4ai (Python) for scraping — requires scripts/.venv-crawl set up.
//
// Flags: --pilot <slugs>    Process only listed slugs (comma-separated)
//        --force             Re-download even if galleryImages already populated (default)
//        --limit <n>         Max gallery images per stay (default 5)
//        --delay <ms>        Delay between stays (default 3000)
//        --dry-run           Scrape and list URLs but skip download/upload
//        --chunk <n>         Process chunk number n (1-based). Requires --chunk-size.
//        --chunk-size <n>    Stays per chunk (default 25). Use with --chunk.
//        --list-chunks       Print chunk plan and exit — no processing.

import { getPayload } from 'payload'
import config from '@payload-config'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { uploadToR2 } from './lib/r2-upload'
import { extractJsonLdImageUrls } from './lib/jsonld-images'
import { extractImages as extractAirbnbImages, extractListingId } from './lib/airbnb-pp-cli'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VENV_PYTHON = path.resolve(__dirname, '.venv-crawl/bin/python3')
const CRAWL_SCRIPT = path.resolve(__dirname, 'lib/crawl4ai-scrape.py')

const MIN_IMAGE_BYTES = 10240 // 10KB — filter thumbnails/logos
const RETRY_COUNT = 3

// URL patterns that are clearly not listing photos
const NON_PHOTO_PATTERNS = [
  /airbnb-platform-assets/i,
  /\/avatar/i,
  /\/logo/i,
  /\/icon/i,
  /\/badge/i,
  /\/button/i,
  /\/pixel/i,
  /\/spinner/i,
  /\/placeholder/i,
  /\/banner-ad/i,
]

function isListingPhoto(url: string): boolean {
  return !NON_PHOTO_PATTERNS.some(p => p.test(url))
}

// ── CLI arg parsing ──────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const pilotSlugs = getArg('pilot')?.split(',').map(s => s.trim()).filter(Boolean)
const force = true // default — always refresh
const imageLimit = parseInt(getArg('limit') ?? '5', 10)
const delayMs = parseInt(getArg('delay') ?? '3000', 10)
const dryRun = hasFlag('dry-run')
const chunkNum = getArg('chunk') ? parseInt(getArg('chunk')!, 10) : undefined
const chunkSize = parseInt(getArg('chunk-size') ?? '25', 10)
const listChunks = hasFlag('list-chunks')

// ── Types ─────────────────────────────────────────────────────────
interface CrawlResult {
  success: boolean
  photo_urls?: string[]
  error?: string
}

interface ProcessResult {
  id: number
  slug: string
  status: 'updated' | 'skipped' | 'failed' | 'no-photos'
  imageCount?: number
  reason?: string
}

// ── JSON-LD fast path (plain HTTP, no browser needed) ──────────────
async function scrapePhotosJsonLd(affiliateUrl: string): Promise<string[] | null> {
  try {
    const res = await fetchWithRetry(affiliateUrl)
    const html = await res.text()
    const urls = extractJsonLdImageUrls(html)
    return urls.length > 0 ? urls : null
  } catch {
    return null
  }
}

// ── crawl4ai scraper ──────────────────────────────────────────────
async function scrapePhotos(affiliateUrl: string): Promise<string[]> {
  const { stdout } = await execFileAsync(VENV_PYTHON, [CRAWL_SCRIPT, affiliateUrl], {
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
  })

  const parsed: CrawlResult = JSON.parse(stdout.trim())
  if (!parsed.success) {
    throw new Error(parsed.error ?? 'crawl4ai failed')
  }

  return parsed.photo_urls ?? []
}

// ── HTTP fetch with retry ─────────────────────────────────────────
async function fetchWithRetry(url: string): Promise<Response> {
  for (let i = 0; i < RETRY_COUNT; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(30000),
      })
      if (res.ok) return res
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      if (i === RETRY_COUNT - 1) throw err
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 500))
    }
  }
  throw new Error('Max retries')
}

// ── Download, validate, upload single image ───────────────────────
async function downloadAndUpload(
  imageUrl: string,
  slug: string,
  index: number,
): Promise<{ imageUrl: string } | null> {
  try {
    const res = await fetchWithRetry(imageUrl)
    const buffer = Buffer.from(await res.arrayBuffer())

    // Filter tiny images
    if (buffer.length < MIN_IMAGE_BYTES) return null

    // Validate with sharp
    const metadata = await sharp(buffer).metadata()
    if (!metadata.format || !metadata.width || !metadata.height) return null

    const contentType = `image/${metadata.format === 'jpeg' ? 'jpeg' : metadata.format}`
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const key = `stays/${slug}/gallery-${index}.${ext}`

    const uploaded = await uploadToR2(key, buffer, contentType)
    return { imageUrl: uploaded.url }
  } catch {
    return null
  }
}

// ── Process one stay ──────────────────────────────────────────────
async function processStay(
  payload: Awaited<ReturnType<typeof getPayload>>,
  stay: Record<string, unknown>,
): Promise<ProcessResult> {
  const id = stay.id as number
  const slug = stay.slug as string
  const affiliateUrl = stay.affiliateUrl as string
  const title = stay.title as string

  process.stdout.write(`\n→ [${id}] ${slug} — "${title}"\n`)

  if (!affiliateUrl) {
    process.stdout.write(`  ✗ No affiliate URL\n`)
    return { id, slug, status: 'skipped', reason: 'no affiliate URL' }
  }

  // VRBO blocks scraping at IP level
  if (affiliateUrl.includes('vrbo.com')) {
    process.stdout.write(`  ⊘ VRBO — IP-blocked, skipping\n`)
    return { id, slug, status: 'skipped', reason: 'VRBO IP-blocked' }
  }

  // Scrape listing page — try airbnb-pp-cli first, then JSON-LD, then crawl4ai
  process.stdout.write(`  Scraping: ${affiliateUrl}\n`)
  let photoUrls: string[]
  let scrapeMethod = 'crawl4ai'
  try {
    // 1. Airbnb-pp-cli (primary — 40+ captioned images + structured data)
    if (affiliateUrl.includes('airbnb.com')) {
      const airbnbImages = await extractAirbnbImages(affiliateUrl)
      if (airbnbImages && airbnbImages.length > 0) {
        photoUrls = airbnbImages.map(img => img.url)
        scrapeMethod = `airbnb-pp-cli (${photoUrls.length} images)`
        process.stdout.write(`  ${scrapeMethod}\n`)
      } else {
        // 2. JSON-LD fast path (plain HTTP, no browser needed)
        const jsonLdPhotos = await scrapePhotosJsonLd(affiliateUrl)
        if (jsonLdPhotos && jsonLdPhotos.length > 0) {
          photoUrls = jsonLdPhotos
          scrapeMethod = `JSON-LD (${photoUrls.length} images)`
          process.stdout.write(`  ${scrapeMethod}\n`)
        } else {
          // 3. crawl4ai (heavy — requires Python/browser)
          photoUrls = await scrapePhotos(affiliateUrl)
        }
      }
    } else {
      // Non-Airbnb: try JSON-LD then crawl4ai
      const jsonLdPhotos = await scrapePhotosJsonLd(affiliateUrl)
      if (jsonLdPhotos && jsonLdPhotos.length > 0) {
        photoUrls = jsonLdPhotos
        scrapeMethod = `JSON-LD (${photoUrls.length} images)`
        process.stdout.write(`  ${scrapeMethod}\n`)
      } else {
        photoUrls = await scrapePhotos(affiliateUrl)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stdout.write(`  ✗ Scrape failed: ${msg}\n`)
    return { id, slug, status: 'failed', reason: msg }
  }

  if (!photoUrls.length) {
    process.stdout.write(`  ✗ No photos found\n`)
    return { id, slug, status: 'no-photos', reason: 'no photos found' }
  }

  // Filter out non-photo URLs (icons, logos, UI assets)
  const listingPhotos = photoUrls.filter(isListingPhoto)

  process.stdout.write(`  Found ${photoUrls.length} raw, ${listingPhotos.length} listing photos, downloading up to ${imageLimit}\n`)

  if (dryRun) {
    listingPhotos.slice(0, imageLimit).forEach((url, i) => {
      process.stdout.write(`  [${i}] ${url}\n`)
    })
    return { id, slug, status: 'updated', imageCount: Math.min(listingPhotos.length, imageLimit) }
  }

  // Download, validate, upload each image
  const galleryImages: Array<{ imageUrl: string }> = []
  const toTry = listingPhotos.slice(0, imageLimit * 2) // try extra in case some fail

  for (let i = 0; i < toTry.length && galleryImages.length < imageLimit; i++) {
    const entry = await downloadAndUpload(toTry[i], slug, galleryImages.length)
    if (entry) {
      galleryImages.push(entry)
      process.stdout.write(`  ✓ [${galleryImages.length}/${imageLimit}]\n`)
    }
  }

  if (galleryImages.length === 0) {
    process.stdout.write(`  ✗ All photos failed download/validation\n`)
    return { id, slug, status: 'failed', reason: 'all photos failed' }
  }

  // Update Payload
  await payload.update({
    collection: 'stays',
    id,
    data: { galleryImages },
    overrideAccess: true,
  })

  process.stdout.write(`  ✓ Saved ${galleryImages.length} gallery images\n`)
  return { id, slug, status: 'updated', imageCount: galleryImages.length }
}

// ── DB connection with retry (handles Neon cold start) ────────────
async function connectWithRetry(maxAttempts = 3): Promise<ReturnType<typeof getPayload>> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      process.stdout.write(`Connecting to DB (attempt ${attempt}/${maxAttempts})...\n`)
      const payload = await getPayload({ config })

      // Warm-up query to confirm connection is alive
      await payload.find({ collection: 'stays', limit: 1, depth: 0 })
      process.stdout.write('DB connected.\n')
      return payload
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`Connection failed: ${msg}\n`)
      if (attempt < maxAttempts) {
        const wait = attempt * 10_000 // 10s, 20s
        process.stdout.write(`Retrying in ${wait / 1000}s...\n`)
        await new Promise(r => setTimeout(r, wait))
      } else {
        throw err
      }
    }
  }
  throw new Error('Unreachable')
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  if (dryRun) {
    process.stdout.write('═══ DRY RUN — no downloads or uploads ═══\n')
  }

  const payload = await connectWithRetry()

  process.stdout.write('Fetching stays from Payload...\n')
  const result = await payload.find({
    collection: 'stays',
    limit: 500,
    depth: 0,
  })

  let stays = result.docs as Array<Record<string, unknown>>
  process.stdout.write(`Found ${stays.length} stays\n`)

  // Filter by pilot slugs
  if (pilotSlugs && pilotSlugs.length > 0) {
    stays = stays.filter(s => pilotSlugs.includes(s.slug as string))
    process.stdout.write(`Pilot mode: processing ${stays.length} stays\n`)
  }

  // Chunk planning — list and exit
  if (listChunks) {
    const total = stays.length
    const numChunks = Math.ceil(total / chunkSize)
    process.stdout.write(`\nChunk Plan: ${total} stays ÷ ${chunkSize}/chunk = ${numChunks} chunks\n`)
    process.stdout.write(`${'─'.repeat(70)}\n`)
    for (let c = 1; c <= numChunks; c++) {
      const start = (c - 1) * chunkSize
      const end = Math.min(start + chunkSize, total)
      const first = (stays[start]?.slug as string) ?? '?'
      const last = (stays[end - 1]?.slug as string) ?? '?'
      process.stdout.write(`  Chunk ${String(c).padStart(2, ' ')}: stays ${start + 1}–${end}  (${first} … ${last})\n`)
    }
    process.stdout.write(`\nRun a chunk:\n  node --env-file=.env.local --import tsx/esm scripts/fetch-gallery-images.ts --chunk 1\n`)
    await payload.db.pool.end()
    process.exit(0)
  }

  // Apply chunk filter
  if (chunkNum !== undefined) {
    const totalChunks = Math.ceil(stays.length / chunkSize)
    if (chunkNum < 1 || chunkNum > totalChunks) {
      process.stdout.write(`Invalid chunk ${chunkNum}. Valid range: 1–${totalChunks}. Use --list-chunks to see plan.\n`)
      await payload.db.pool.end()
      process.exit(1)
    }
    const start = (chunkNum - 1) * chunkSize
    const end = Math.min(start + chunkSize, stays.length)
    const chunkStays = stays.slice(start, end)
    process.stdout.write(`Chunk ${chunkNum}/${totalChunks}: processing ${chunkStays.length} stays (index ${start + 1}–${end})\n`)
    stays = chunkStays
  }

  if (stays.length === 0) {
    process.stdout.write('No stays to process.\n')
    await payload.db.pool.end()
    process.exit(0)
  }

  const results: ProcessResult[] = []

  for (let i = 0; i < stays.length; i++) {
    process.stdout.write(`\n[${i + 1}/${stays.length}]`)
    const res = await processStay(payload, stays[i])
    results.push(res)

    // Delay between stays
    if (delayMs > 0 && i < stays.length - 1) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  // ── Report ──────────────────────────────────────────────────────
  const updated = results.filter(r => r.status === 'updated')
  const failed = results.filter(r => r.status === 'failed')
  const noPhotos = results.filter(r => r.status === 'no-photos')
  const skipped = results.filter(r => r.status === 'skipped')

  process.stdout.write(`\n${'═'.repeat(50)}\n`)
  const chunkLabel = chunkNum ? ` (chunk ${chunkNum})` : ''
  process.stdout.write(`Gallery Image Fetch Report${chunkLabel}\n`)
  process.stdout.write(`${'─'.repeat(50)}\n`)
  process.stdout.write(`  Total:     ${stays.length}\n`)
  process.stdout.write(`  Updated:   ${updated.length} (${updated.reduce((s, r) => s + (r.imageCount ?? 0), 0)} images)\n`)
  process.stdout.write(`  No photos: ${noPhotos.length}\n`)
  process.stdout.write(`  Failed:    ${failed.length}\n`)
  process.stdout.write(`  Skipped:   ${skipped.length}\n`)

  if (failed.length > 0) {
    process.stdout.write(`\nFailed:\n`)
    failed.forEach(r => process.stdout.write(`  ✗ [${r.id}] ${r.slug}: ${r.reason}\n`))
  }

  if (skipped.length > 0) {
    process.stdout.write(`\nSkipped:\n`)
    skipped.forEach(r => process.stdout.write(`  ⊘ [${r.id}] ${r.slug}: ${r.reason}\n`))
  }

  // Hint for next chunk
  if (chunkNum !== undefined) {
    const totalStays = result.docs.length
    const totalChunks = Math.ceil(totalStays / chunkSize)
    const nextChunk = chunkNum + 1
    if (nextChunk <= totalChunks) {
      process.stdout.write(`\n▶ Next: --chunk ${nextChunk} of ${totalChunks}\n`)
    } else {
      process.stdout.write(`\n✓ All ${totalChunks} chunks complete!\n`)
    }
  }

  await payload.db.pool.end()
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
