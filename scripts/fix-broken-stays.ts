// Fix broken hero/gallery images by scraping real listing photos
// Uses the unique-score scraper (Browserbase → Browserless → fetch chain)
// Downloads valid photos, uploads to R2, updates Payload.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/fix-broken-stays.ts
// Flags:
//   --slug <slug>   Fix a single stay by slug
//   --all           Fix all stays with missing/broken hero images
//   --dry-run       Show what would change without writing
//   --delay <ms>    Delay between stays (default 2000)
//
// Requires: DATABASE_URI, PAYLOAD_SECRET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//           CLOUDFLARE_ACCOUNT_ID, BROWSERBASE_API_KEY (preferred) or BROWSERLESS_TOKEN

import { getPayload } from 'payload'
import config from '@payload-config'
import { scrapeListing } from '../src/lib/unique-score/scraper'
import type { Platform } from '../src/lib/unique-score/types'
import { uploadToR2 } from './lib/r2-upload'
import { downloadAndUploadImage } from './lib/images'

const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const TARGET_SLUGS = [
  'the-treehouse-on-lake-hamilton-piney',
  'cave-suite-hohle-lomas-de-ruvira-cave-hotel-jorquera',
  'a-frame-cabin-near-hamlin-lake-pet-friendly-mason-county',
  'cedar-creek-hideaway-secluded-geodesic-dome-cabin-woodstove-bbq-dogs-ok-welches',
  'tree-house-luxury-stay-cottage-grove',
]

const dryRun = hasFlag('dry-run')
const fixAll = hasFlag('all')
const singleSlug = getArg('slug')
const delay = parseInt(getArg('delay') ?? '2000', 10)

const MIN_IMAGE_BYTES = 10240

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function isR2Url(url: string): boolean {
  return url.includes('.r2.dev') || url.includes('media.uniquestaysusa.com')
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (res.ok) return res
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000))
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500))
    }
  }
  throw new Error('Max retries')
}

interface Stay {
  id: number
  slug: string
  title: string
  platform: string
  affiliateUrl: string
  imageUrl: string | null
  galleryImages: Array<{ imageUrl: string }>
}

async function fixStay(
  payload: Awaited<ReturnType<typeof getPayload>>,
  stay: Stay,
): Promise<{ slug: string; status: string; reason?: string; heroUrl?: string; galleryCount?: number }> {
  const { id, slug, title, platform, affiliateUrl } = stay

  console.log(`\n→ [${id}] ${slug} — "${title}"`)

  if (!affiliateUrl) {
    console.log('  ✗ No affiliate URL')
    return { slug, status: 'skipped', reason: 'no affiliate URL' }
  }

  // Map platform string to scraper Platform type
  const platformMap: Record<string, Platform> = {
    Airbnb: 'airbnb',
    VRBO: 'vrbo',
    Wander: 'wander',
  }
  const scraperPlatform = platformMap[platform]
  if (!scraperPlatform) {
    console.log(`  ✗ Unsupported platform: ${platform}`)
    return { slug, status: 'skipped', reason: `unsupported platform: ${platform}` }
  }

  console.log(`  Scraping: ${affiliateUrl}`)

  // Scrape listing page — try multiple strategies
  let photoUrls: string[] = []

  // Strategy 1: Unique-score scraper (Browserbase → Browserless → fetch)
  const result = await scrapeListing(affiliateUrl, scraperPlatform)
  if (result.success && result.data) {
    photoUrls = result.data.photoUrls ?? []
    console.log(`  Scraper found ${photoUrls.length} photos`)
  }

  // Strategy 2: For VRBO, use Exa Contents API when scraper fails
  if (photoUrls.length === 0 && platform === 'VRBO' && process.env.EXA_API_KEY) {
    console.log('  Trying Exa Contents API for VRBO...')
    try {
      const exaRes = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXA_API_KEY },
        body: JSON.stringify({ ids: [affiliateUrl], text: true, includeHtmlTags: true, maxCharacters: 8000 }),
        signal: AbortSignal.timeout(20000),
      })
      if (exaRes.ok) {
        const exaData = await exaRes.json()
        const content = exaData.results?.[0]?.text || ''
        const exaUrls = content.match(/https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp)[^\s"'<>]*/gi) || []
          .filter((u: string) => !u.includes('googleapis.com') && !u.includes('maps.'))
          .map((u: string) => u.split('?')[0]) // strip resize params for full-size
        const unique = [...new Set(exaUrls)]
        if (unique.length > 0) {
          photoUrls = unique
          console.log(`  Exa found ${photoUrls.length} photos`)
        }
      }
    } catch (e) {
      console.log(`  Exa failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Strategy 3: Extract images from description field
  if (photoUrls.length === 0) {
    const desc = (stay as Record<string, unknown>).description as string | undefined
    if (desc) {
      const descUrls = desc.match(/https?:\/\/[^\s"')\]]+?\.(?:jpg|jpeg|png|webp)[^\s"')\]]*/gi) || []
      if (descUrls.length > 0) {
        photoUrls = [...new Set(descUrls)]
        console.log(`  Description found ${photoUrls.length} photos`)
      }
    }
  }

  // Strategy 4: Copy gallery to hero if gallery exists but hero is missing
  const gallery = (stay as Record<string, unknown>).galleryImages as Array<{ imageUrl?: string }> | undefined
  if (photoUrls.length === 0 && gallery && gallery.length > 0) {
    const firstGallery = gallery[0]?.imageUrl
    if (firstGallery && !dryRun) {
      console.log('  Copying first gallery image to hero')
      await payload.update({
        collection: 'stays',
        id,
        data: { imageUrl: firstGallery },
        overrideAccess: true,
      })
      return { slug, status: 'fixed', heroUrl: firstGallery, galleryCount: gallery.length }
    }
  }

  if (photoUrls.length === 0) {
    return { slug, status: 'failed', reason: 'no photos found from any source' }
  }

  // Fix hero image if needed
  let heroUrl: string | undefined
  const currentHero = stay.imageUrl ?? ''
  const heroNeedsFix = !currentHero || !isR2Url(currentHero)

  if (heroNeedsFix && !dryRun) {
    for (let i = 0; i < Math.min(photoUrls.length, 5); i++) {
      try {
        const res = await fetchWithRetry(photoUrls[i])
        const buffer = Buffer.from(await res.arrayBuffer())

        if (buffer.length < MIN_IMAGE_BYTES) {
          console.log(`  Hero candidate ${i}: too small (${buffer.length} bytes)`)
          continue
        }

        const contentType = res.headers.get('content-type') ?? 'image/jpeg'
        if (!contentType.startsWith('image/')) {
          console.log(`  Hero candidate ${i}: not image (${contentType})`)
          continue
        }

        const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
        const key = `stays/${slug}/hero.${ext}`
        const uploaded = await uploadToR2(key, buffer, contentType)
        heroUrl = uploaded.url
        console.log(`  ✓ Hero uploaded: ${heroUrl}`)
        break
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`  Hero candidate ${i}: failed (${msg})`)
      }
    }
  } else if (heroNeedsFix && dryRun) {
    console.log(`  [DRY RUN] Would set hero from: ${photoUrls[0]?.slice(0, 80)}...`)
    heroUrl = '[dry-run]'
  }

  // Fix gallery images (up to 5)
  const galleryEntries: Array<{ imageUrl: string }> = []
  const galleryStartIdx = heroUrl ? 1 : 0 // skip the one used for hero

  for (let i = galleryStartIdx; i < Math.min(photoUrls.length, galleryStartIdx + 6); i++) {
    if (dryRun) {
      galleryEntries.push({ imageUrl: photoUrls[i] })
      continue
    }

    const entry = await downloadAndUploadImage(photoUrls[i], slug, galleryEntries.length)
    if (entry) {
      galleryEntries.push(entry)
    }

    if (delay > 0) await sleep(300)
  }

  // Update Payload
  if (!dryRun) {
    const updateData: Record<string, unknown> = {}

    if (heroUrl) {
      updateData.imageUrl = heroUrl
    }

    if (galleryEntries.length > 0) {
      // Merge with existing gallery, deduplicate
      const existing = (stay.galleryImages ?? [])
        .map((g) => g.imageUrl)
        .filter(Boolean) as string[]
      const allGallery = [...new Set([...existing, ...galleryEntries.map((g) => g.imageUrl)])]
      updateData.galleryImages = allGallery.map((url) => ({ imageUrl: url }))
    }

    if (Object.keys(updateData).length > 0) {
      await payload.update({
        collection: 'stays',
        id,
        data: updateData,
        overrideAccess: true,
      })
      console.log(`  ✓ Updated (hero: ${heroUrl ? 'yes' : 'no'}, gallery: ${galleryEntries.length})`)
    }
  }

  return {
    slug,
    status: heroUrl || currentHero ? 'fixed' : 'partial',
    heroUrl: heroUrl || currentHero,
    galleryCount: galleryEntries.length,
  }
}

async function main() {
  const payload = await getPayload({ config })

  console.log('═ Fix Broken Stays ═')
  console.log(`  Dry run: ${dryRun}`)
  console.log(`  Mode: ${fixAll ? 'all broken' : singleSlug ? `single: ${singleSlug}` : `${TARGET_SLUGS.length} targeted slugs`}\n`)

  // Determine which slugs to process
  let slugsToFix: string[]

  if (singleSlug) {
    slugsToFix = [singleSlug]
  } else if (fixAll) {
    // Find all stays with missing or non-R2 hero images
    const result = await payload.find({
      collection: 'stays',
      limit: 500,
      depth: 0,
    })

    slugsToFix = (result.docs as Stay[])
      .filter((s) => {
        const url = s.imageUrl ?? ''
        return !url || !isR2Url(url)
      })
      .map((s) => s.slug)

    console.log(`Found ${slugsToFix.length} stays with missing/non-R2 hero images\n`)
  } else {
    slugsToFix = TARGET_SLUGS
  }

  // Fetch stays by slug
  const stays: Stay[] = []
  for (const slug of slugsToFix) {
    const result = await payload.find({
      collection: 'stays',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    if (result.totalDocs === 0) {
      console.log(`⚠ Stay not found: ${slug}`)
      continue
    }
    stays.push(result.docs[0] as Stay)
  }

  console.log(`Processing ${stays.length} stays\n`)

  const results: Array<{ slug: string; status: string; reason?: string; heroUrl?: string; galleryCount?: number }> = []

  for (const stay of stays) {
    const result = await fixStay(payload, stay)
    results.push(result)

    if (delay > 0 && stay !== stays[stays.length - 1]) {
      await sleep(delay)
    }
  }

  // Report
  console.log(`\n${'═'.repeat(50)}`)
  const fixed = results.filter((r) => r.status === 'fixed')
  const partial = results.filter((r) => r.status === 'partial')
  const failed = results.filter((r) => r.status === 'failed')
  const skipped = results.filter((r) => r.status === 'skipped')

  console.log(`Summary: ${fixed.length} fixed | ${partial.length} partial | ${failed.length} failed | ${skipped.length} skipped`)

  if (failed.length > 0) {
    console.log('\nFailed:')
    failed.forEach((r) => console.log(`  ✗ ${r.slug}: ${r.reason}`))
  }

  if (skipped.length > 0) {
    console.log('\nSkipped:')
    skipped.forEach((r) => console.log(`  ⊘ ${r.slug}: ${r.reason}`))
  }

  // Verify fixed stays
  if (!dryRun && fixed.length > 0) {
    console.log('\nVerifying...')
    for (const r of fixed) {
      if (!r.heroUrl || r.heroUrl === '[dry-run]') continue
      try {
        const res = await fetch(r.heroUrl, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
        console.log(`  ${res.ok ? '✓' : '✗'} ${r.slug}: HTTP ${res.status}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`  ✗ ${r.slug}: ${msg}`)
      }
    }
  }

  try {
    await (payload.db as { disconnect?: () => Promise<void> }).disconnect?.()
  } catch {
    // some payload versions use .pool.end()
    try { await (payload.db as { pool?: { end: () => Promise<void> } }).pool?.end() } catch { /* ignore */ }
  }
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
