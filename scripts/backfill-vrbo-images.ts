// scripts/backfill-vrbo-images.ts
// Backfill VRBO gallery images from extractable sources:
// 1. Image URLs embedded in description fields
// 2. Existing hero imageUrl downloaded to R2
// 3. Flag stays still needing images
//
// Run: node --env-file=.env.local --import tsx/esm scripts/backfill-vrbo-images.ts
// Flags:
//   --dry-run       Show what would update without writing
//   --limit <N>     Only process N stays
//   --delay <ms>    Delay between image downloads (default 500)
//   --force         Re-process stays that already have gallery images

import { getPayload } from 'payload'
import config from '@payload-config'
import { downloadAndUploadImage } from './lib/images'
import { uploadToR2 } from './lib/r2-upload'

const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const dryRun = hasFlag('dry-run')
const limit = getArg('limit') ? parseInt(getArg('limit')!, 10) : undefined
const delay = parseInt(getArg('delay') ?? '500', 10)
const force = hasFlag('force')

const IMG_URL_RE = /https:\/\/(?:media\.vrbo\.com|images\.trvl-media\.com)\/[^\s"'")] +\.(?:jpg|jpeg|png|webp)/gi

interface Stay {
  id: number
  slug: string
  affiliateUrl: string
  imageUrl: string | null
  galleryImages: Array<{ imageUrl: string }>
  description: string | null
  needsReview: boolean
  reviewReason: string | null
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function extractImageUrls(description: string): string[] {
  const matches = description.match(IMG_URL_RE)
  if (!matches) return []
  // Deduplicate and filter out thumbnails (_z suffix variant)
  const seen = new Set<string>()
  return matches.filter((url) => {
    // Normalize: strip query params
    const clean = url.split('?')[0]
    if (seen.has(clean)) return false
    seen.add(clean)
    return true
  })
}

async function main() {
  const payload = await getPayload({ config })

  console.log('═ VRBO Image Backfill ═')
  console.log(`  Dry run: ${dryRun}`)

  console.log('\nFetching VRBO stays...')
  const result = await payload.find({
    collection: 'stays',
    limit: 200,
    depth: 0,
    where: { platform: { equals: 'VRBO' } },
  })

  let stays = result.docs as Stay[]
  console.log(`Found ${stays.length} VRBO stays`)

  // Filter to stays needing gallery images (unless --force)
  if (!force) {
    stays = stays.filter((s) => !s.galleryImages || s.galleryImages.length === 0)
  }

  if (limit) stays = stays.slice(0, limit)

  console.log(`Processing ${stays.length} stays\n`)

  let galleryAdded = 0
  let heroAdded = 0
  let flagged = 0
  let errors = 0
  const noSourceStays: string[] = []

  for (const stay of stays) {
    try {
      // 1. Extract image URLs from description
      const descImages = stay.description ? extractImageUrls(stay.description) : []
      // 2. Include hero imageUrl as a gallery candidate
      const heroImage = stay.imageUrl && stay.imageUrl.startsWith('https') ? [stay.imageUrl] : []
      const allSources = [...new Set([...descImages, ...heroImage])]

      if (allSources.length === 0) {
        noSourceStays.push(stay.slug)
        // Flag for manual review
        if (!dryRun) {
          await payload.update({
            collection: 'stays',
            id: stay.id,
            data: {
              needsReview: true,
              reviewReason: 'No image sources found — needs manual gallery upload',
            },
            overrideAccess: true,
          })
        }
        flagged++
        process.stdout.write(`⚑ ${stay.slug} (no image sources)\n`)
        continue
      }

      // Download and upload each image to R2
      const galleryEntries: Array<{ imageUrl: string }> = []

      for (let i = 0; i < allSources.length; i++) {
        if (dryRun) {
          galleryEntries.push({ imageUrl: allSources[i] })
          continue
        }

        const entry = await downloadAndUploadImage(allSources[i], stay.slug, galleryEntries.length)
        if (entry) {
          galleryEntries.push(entry)
        }

        if (delay > 0) await sleep(delay)
      }

      if (galleryEntries.length === 0) {
        process.stdout.write(`✗ ${stay.slug} (0 images downloaded)\n`)
        errors++
        continue
      }

      if (!dryRun) {
        const updateData: Record<string, unknown> = {
          galleryImages: galleryEntries,
        }
        // Set hero imageUrl from first gallery image if missing
        if (!stay.imageUrl || stay.imageUrl === '') {
          updateData.imageUrl = galleryEntries[0].imageUrl
          heroAdded++
        }

        await payload.update({
          collection: 'stays',
          id: stay.id,
          data: updateData,
          overrideAccess: true,
        })
      }

      galleryAdded += galleryEntries.length
      const source = descImages.length > 0 ? 'description' : 'hero'
      process.stdout.write(`✓ ${stay.slug} (${galleryEntries.length} images from ${source})\n`)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors++
      process.stdout.write(`✗ ${stay.slug}: ${msg.slice(0, 80)}\n`)
    }
  }

  // Report
  console.log('\n═ Report ═')
  console.log(`  Stays processed: ${stays.length}`)
  console.log(`  Gallery images added: ${galleryAdded}`)
  console.log(`  Hero images set: ${heroAdded}`)
  console.log(`  Flagged for review: ${flagged}`)
  console.log(`  Errors: ${errors}`)

  if (noSourceStays.length > 0) {
    console.log(`\n  No image sources (${noSourceStays.length}):`)
    noSourceStays.forEach((s) => console.log(`    - ${s}`))
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
