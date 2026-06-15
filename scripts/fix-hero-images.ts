// Fix wrong hero images by scraping real listing photos
// Run: node --env-file=.env.local --import tsx/esm scripts/fix-hero-images.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, FIRECRAWL_API_KEY, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID

import { getPayload } from 'payload'
import config from '@payload-config'
import { scrapeListing } from './lib/scraper'
import { uploadToR2 } from './lib/r2-upload'
import { withVersion } from './lib/stay-images'
import { purgeImageKeys } from './lib/cloudflare-purge'

const MISMATCH_IDS = [
  33, 35, 41, 49, 50, 52, 53, 54, 58, 59, 60, 61, 62,
  66, 68, 70, 71, 75, 77, 78, 79, 196, 200, 203, 205,
]

const DELAY_MS = 3000
const MIN_IMAGE_BYTES = 10240

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

  // Scrape listing page
  const result = await scrapeListing(affiliateUrl)
  if (!result.success || !result.data?.photoUrls?.length) {
    const error = result.error ?? 'no photos found'
    console.log(`  ✗ Scrape failed: ${error}`)
    return { id, slug, status: 'failed', reason: error }
  }

  const photoUrls = result.data.photoUrls
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

      // Determine content type from response headers
      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      if (!contentType.startsWith('image/')) {
        console.log(`  Photo ${i}: not an image (${contentType}), skipping`)
        continue
      }

      // Upload to Cloudflare R2
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

  console.log(`Fixing hero images for ${MISMATCH_IDS.length} stays...\n`)

  const results: Array<{ id: number; slug: string; status: string; reason?: string; newUrl?: string }> = []

  for (const id of MISMATCH_IDS) {
    const result = await fixStay(payload, id)
    results.push(result)

    // Delay between stays to respect rate limits
    if (id !== MISMATCH_IDS[MISMATCH_IDS.length - 1]) {
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
  console.error('Fix failed:', err)
  process.exit(1)
})
