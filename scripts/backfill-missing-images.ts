// Backfill missing hero images for stays with empty imageUrl
// Run: node --env-file=.env.local --import tsx/esm scripts/backfill-missing-images.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_URL
// Uses crawl4ai (Python) for scraping. No Firecrawl needed.

import { getPayload } from 'payload'
import config from '@payload-config'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { uploadToR2 } from './lib/r2-upload'
import { withVersion } from './lib/stay-images'
import { purgeImageKeys } from './lib/cloudflare-purge'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VENV_PYTHON = path.resolve(__dirname, '.venv-crawl/bin/python3')
const CRAWL_SCRIPT = path.resolve(__dirname, 'lib/crawl4ai-scrape.py')

const DELAY_MS = 5000
const MIN_IMAGE_BYTES = 10240 // 10KB — filter thumbnails/logos

interface CrawlResult {
  success: boolean
  markdown?: string
  html?: string
  photo_urls?: string[]
  error?: string
}

async function scrapeWithCrawl4ai(url: string): Promise<string[]> {
  const { stdout } = await execFileAsync(VENV_PYTHON, [CRAWL_SCRIPT, url], {
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
  })

  const parsed: CrawlResult = JSON.parse(stdout.trim())
  if (!parsed.success) {
    throw new Error(parsed.error ?? 'crawl4ai failed')
  }

  return parsed.photo_urls ?? []
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (res.ok) return res
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 500))
    }
  }
  throw new Error('Max retries')
}

async function fixStay(payload: Awaited<ReturnType<typeof getPayload>>, id: number) {
  const stay = await payload.findByID({ collection: 'stays', id, depth: 0 })
  const slug = stay.slug as string
  const title = stay.title as string
  const affiliateUrl = stay.affiliateUrl as string

  console.log(`\n→ [${id}] ${slug} — "${title}"`)
  console.log(`  Scraping: ${affiliateUrl}`)

  if (!affiliateUrl) {
    console.log(`  ✗ No affiliate URL`)
    return { id, slug, status: 'skipped', reason: 'no affiliate URL' }
  }

  // VRBO blocks scraping at IP level — skip
  if (affiliateUrl.includes('vrbo.com')) {
    console.log(`  ⊘ VRBO listing — IP-blocked, skipping`)
    return { id, slug, status: 'skipped', reason: 'VRBO IP-blocked' }
  }

  // Scrape listing page via crawl4ai
  let photoUrls: string[]
  try {
    photoUrls = await scrapeWithCrawl4ai(affiliateUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  ✗ Scrape failed: ${msg}`)
    return { id, slug, status: 'failed', reason: msg }
  }

  if (!photoUrls.length) {
    console.log(`  ✗ No photos found on page`)
    return { id, slug, status: 'failed', reason: 'no photos found' }
  }

  console.log(`  Found ${photoUrls.length} photos`)

  // Try photos until one downloads and validates
  for (let i = 0; i < Math.min(photoUrls.length, 5); i++) {
    const photoUrl = photoUrls[i]
    try {
      const res = await fetchWithRetry(photoUrl)
      const buffer = Buffer.from(await res.arrayBuffer())

      if (buffer.length < MIN_IMAGE_BYTES) {
        console.log(`  Photo ${i}: too small (${buffer.length} bytes), skipping`)
        continue
      }

      // Validate it's a real image via sharp
      let contentType: string
      try {
        const metadata = await sharp(buffer).metadata()
        if (!metadata.format || !metadata.width || !metadata.height) {
          console.log(`  Photo ${i}: invalid image format, skipping`)
          continue
        }
        contentType = `image/${metadata.format === 'jpeg' ? 'jpeg' : metadata.format}`
      } catch {
        console.log(`  Photo ${i}: sharp validation failed, skipping`)
        continue
      }

      // Upload to R2
      const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
      const key = `stays/${slug}.${ext}`

      const uploaded = await uploadToR2(key, buffer, contentType)
      await purgeImageKeys([key]) // bust CF edge for the bare key (versioning covers ?w= variants)
      const imageUrl = withVersion(uploaded.url, buffer)

      // Update stay in Payload
      await payload.update({
        collection: 'stays',
        id,
        data: { imageUrl },
      })

      console.log(`  ✓ Updated: ${imageUrl}`)
      return { id, slug, status: 'fixed', newUrl: uploaded.url }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  Photo ${i}: failed (${msg})`)
    }
  }

  console.log(`  ✗ All photos failed`)
  return { id, slug, status: 'failed', reason: 'all photos failed' }
}

async function main() {
  const payload = await getPayload({ config })

  // Find all stays with empty imageUrl
  const result = await payload.find({
    collection: 'stays',
    where: {
      or: [
        { imageUrl: { equals: '' } },
        { imageUrl: { exists: false } },
      ],
    },
    limit: 100,
    depth: 0,
  })

  const stays = result.docs
  console.log(`Found ${stays.length} stays with missing images\n`)

  if (stays.length === 0) {
    console.log('Nothing to fix.')
    await payload.db.pool.end()
    process.exit(0)
  }

  const results: Array<{ id: number; slug: string; status: string; reason?: string; newUrl?: string }> = []

  for (let i = 0; i < stays.length; i++) {
    const stay = stays[i]
    console.log(`\n[${i + 1}/${stays.length}]`)
    const res = await fixStay(payload, stay.id as number)
    results.push(res)

    // Delay between stays to respect rate limits
    if (i < stays.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  const fixed = results.filter(r => r.status === 'fixed')
  const failed = results.filter(r => r.status === 'failed')
  const skipped = results.filter(r => r.status === 'skipped')

  console.log(`Summary: ${fixed.length} fixed | ${failed.length} failed | ${skipped.length} skipped`)

  if (failed.length > 0) {
    console.log(`\nFailed:`)
    failed.forEach(r => console.log(`  ✗ [${r.id}] ${r.slug}: ${r.reason}`))
  }

  if (skipped.length > 0) {
    console.log(`\nSkipped:`)
    skipped.forEach(r => console.log(`  ⊘ [${r.id}] ${r.slug}: ${r.reason}`))
  }

  await payload.db.pool.end()
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
