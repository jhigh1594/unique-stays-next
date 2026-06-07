// Migrate external image URLs to Cloudflare R2
// Run: pnpm migrate-images
// Requires: DATABASE_URI, PAYLOAD_SECRET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID in .env.local

import { getPayload } from 'payload'
import config from '@payload-config'
import { uploadToR2 } from './lib/r2-upload'

const CONCURRENCY = 5
const RETRY_COUNT = 3
const R2_HOST_MARKERS = ['r2.dev', 'media.uniquestaysusa.com']

function isR2Url(url: string) {
  return R2_HOST_MARKERS.some(marker => url.includes(marker))
}

async function fetchWithRetry(url: string, retries = RETRY_COUNT): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (res.ok) return res
      if (res.status === 429) {
        const wait = Math.pow(2, i) * 1000
        await new Promise(r => setTimeout(r, wait))
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

async function migrateImage(slug: string, imageUrl: string): Promise<string> {
  const res = await fetchWithRetry(imageUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const key = `stays/${slug}/hero.${ext}`

  const uploaded = await uploadToR2(key, buffer, contentType)

  return uploaded.url
}

async function processBatch(
  payload: Awaited<ReturnType<typeof getPayload>>,
  stays: Array<{ id: number; slug: string; imageUrl: string }>,
  onProgress: (slug: string, status: 'migrated' | 'skipped' | 'failed', err?: string) => void,
) {
  await Promise.all(
    stays.map(async (stay) => {
      try {
        if (isR2Url(stay.imageUrl)) {
          onProgress(stay.slug, 'skipped')
          return
        }

        const r2Url = await migrateImage(stay.slug, stay.imageUrl)
        await payload.update({
          collection: 'stays',
          id: stay.id,
          data: { imageUrl: r2Url },
          overrideAccess: true,
        })
        onProgress(stay.slug, 'migrated')
      } catch (err) {
        onProgress(stay.slug, 'failed', err instanceof Error ? err.message : String(err))
      }
    }),
  )
}

async function main() {
  const missingR2Env = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_ACCOUNT_ID'].filter(
    key => !process.env[key],
  )
  if (missingR2Env.length > 0) {
    console.error(`${missingR2Env.join(', ')} required. Add R2 credentials to .env.local`)
    process.exit(1)
  }

  const payload = await getPayload({ config })

  // Fetch all stays with image URLs
  const allStays: Array<{ id: number; slug: string; imageUrl: string }> = []
  let page = 1
  const pageSize = 100

  while (true) {
    const { docs, totalDocs } = await payload.find({
      collection: 'stays',
      limit: pageSize,
      page,
      depth: 0,
      select: { slug: true, imageUrl: true },
    })

    for (const s of docs) {
      if (s.imageUrl) {
        allStays.push({ id: s.id as number, slug: s.slug as string, imageUrl: s.imageUrl as string })
      }
    }

    if (allStays.length >= totalDocs) break
    page++
  }

  const alreadyMigrated = allStays.filter(s => isR2Url(s.imageUrl)).length
  const toMigrate = allStays.filter(s => !isR2Url(s.imageUrl))

  console.log(`Found ${allStays.length} stays with images (${alreadyMigrated} already in R2, ${toMigrate.length} to migrate)`)

  let migrated = 0
  let skipped = alreadyMigrated
  const failures: Array<{ slug: string; error: string }> = []

  // Process in batches
  for (let i = 0; i < toMigrate.length; i += CONCURRENCY) {
    const batch = toMigrate.slice(i, i + CONCURRENCY)
    await processBatch(payload, batch, (slug, status, err) => {
      if (status === 'migrated') {
        migrated++
        process.stdout.write('+')
      } else if (status === 'skipped') {
        skipped++
        process.stdout.write('.')
      } else {
        failures.push({ slug, error: err ?? 'unknown' })
        process.stdout.write('✗')
      }
    })

    const done = Math.min(i + CONCURRENCY, toMigrate.length)
    if (done % 25 === 0 || done === toMigrate.length) {
      process.stdout.write(` [${done}/${toMigrate.length}]\n`)
    }

    // Small delay between batches to avoid rate limits
    if (i + CONCURRENCY < toMigrate.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  console.log(`\n─────────────────────────────────────────`)
  console.log(`Summary: +${migrated} migrated | ${skipped} skipped | ${failures.length} failures`)

  if (failures.length > 0) {
    console.error('\nFailed images:')
    failures.forEach(f => console.error(`  ✗ ${f.slug}: ${f.error}`))
  }

  try {
    await (payload.db as { disconnect?: () => Promise<void> }).disconnect?.()
  } catch {
    try { await (payload.db as { pool?: { end: () => Promise<void> } }).pool?.end() } catch { /* ignore */ }
  }
  process.exit(failures.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
