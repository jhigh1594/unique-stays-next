// Copy remaining Vercel Blob stay images into R2 and update Payload URLs.
// Run: node --env-file=.env.local --import tsx/esm scripts/migrate-vercel-blob-to-r2.ts

import { getPayload } from 'payload'
import config from '@payload-config'
import { uploadToR2 } from './lib/r2-upload'

const BLOB_HOST_MARKER = 'vercel-storage.com'

function isBlobUrl(value: unknown): value is string {
  return typeof value === 'string' && value.includes(BLOB_HOST_MARKER)
}

function keyFromBlobUrl(url: string): string {
  const parsed = new URL(url)
  const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  if (!key.startsWith('stays/')) throw new Error(`Unexpected blob key: ${key}`)
  return key
}

async function copyToR2(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const key = keyFromBlobUrl(url)
  const uploaded = await uploadToR2(key, buffer, contentType)

  return uploaded.url
}

async function main() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'stays',
    limit: 10000,
    depth: 0,
    select: {
      slug: true,
      title: true,
      imageUrl: true,
      galleryImages: true,
    },
  })

  let copied = 0
  let updatedStays = 0
  const failures: Array<{ slug: string; url: string; error: string }> = []

  for (const stay of result.docs) {
    const data: Record<string, unknown> = {}
    const slug = stay.slug as string

    if (isBlobUrl(stay.imageUrl)) {
      try {
        data.imageUrl = await copyToR2(stay.imageUrl)
        copied++
      } catch (error) {
        failures.push({ slug, url: stay.imageUrl, error: error instanceof Error ? error.message : String(error) })
      }
    }

    const galleryImages = Array.isArray(stay.galleryImages) ? stay.galleryImages : []
    const nextGallery = await Promise.all(galleryImages.map(async (item) => {
      if (!item || typeof item !== 'object' || !isBlobUrl(item.imageUrl)) return item

      try {
        copied++
        return { ...item, imageUrl: await copyToR2(item.imageUrl) }
      } catch (error) {
        failures.push({ slug, url: item.imageUrl, error: error instanceof Error ? error.message : String(error) })
        return item
      }
    }))

    if (nextGallery.some((item, index) => item !== galleryImages[index])) {
      data.galleryImages = nextGallery
    }

    if (Object.keys(data).length > 0) {
      await payload.update({
        collection: 'stays',
        id: stay.id,
        data,
        overrideAccess: true,
      })
      updatedStays++
      console.log(`Updated ${slug}`)
    }
  }

  console.log(JSON.stringify({ copied, updatedStays, failures: failures.length }, null, 2))
  if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 20), null, 2))
  }

  await payload.db.pool.end()
  process.exit(failures.length ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
