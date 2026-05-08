// Migrate external image URLs to Vercel Blob
// Run: pnpm migrate-images
// Requires: DATABASE_URI, PAYLOAD_SECRET, BLOB_READ_WRITE_TOKEN in .env.local

import { getPayload } from 'payload'
import config from '@payload-config'
import { put } from '@vercel/blob'

const CONCURRENCY = 5
const RETRY_COUNT = 3

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
  const ext = imageUrl.split('.').pop()?.split('?')[0] ?? 'jpg'
  const cleanExt = ext.length <= 4 ? ext : 'jpg'
  const blobPath = `stays/${slug}.${cleanExt}`

  const res = await fetchWithRetry(imageUrl)
  const buffer = Buffer.from(await res.arrayBuffer())

  const blob = await put(blobPath, buffer, {
    access: 'public',
    allowOverwrite: true,
    contentType: res.headers.get('content-type') ?? 'image/jpeg',
  })

  return blob.url
}

async function processBatch(
  stays: Array<{ id: number; slug: string; imageUrl: string }>,
  onProgress: (slug: string, status: 'migrated' | 'skipped' | 'failed', err?: string) => void,
) {
  await Promise.all(
    stays.map(async (stay) => {
      try {
        if (stay.imageUrl.includes('blob.vercel-storage.com')) {
          onProgress(stay.slug, 'skipped')
          return
        }

        const blobUrl = await migrateImage(stay.slug, stay.imageUrl)
        const payload = await getPayload({ config })
        await payload.update({
          collection: 'stays',
          id: stay.id,
          data: { imageUrl: blobUrl },
        })
        onProgress(stay.slug, 'migrated')
      } catch (err) {
        onProgress(stay.slug, 'failed', err instanceof Error ? err.message : String(err))
      }
    }),
  )
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is required. Add it to .env.local')
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

  const alreadyMigrated = allStays.filter(s => s.imageUrl.includes('blob.vercel-storage.com')).length
  const toMigrate = allStays.filter(s => !s.imageUrl.includes('blob.vercel-storage.com'))

  console.log(`Found ${allStays.length} stays with images (${alreadyMigrated} already in Blob, ${toMigrate.length} to migrate)`)

  let migrated = 0
  let skipped = alreadyMigrated
  const failures: Array<{ slug: string; error: string }> = []

  // Process in batches
  for (let i = 0; i < toMigrate.length; i += CONCURRENCY) {
    const batch = toMigrate.slice(i, i + CONCURRENCY)
    await processBatch(batch, (slug, status, err) => {
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

  await payload.db.pool.end()
  process.exit(failures.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
