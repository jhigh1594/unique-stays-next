// Uploads A-frame hero to Vercel Blob directly and patches the media record URL
// Run: pnpm exec tsx --env-file=.env.local scripts/fix-aframe-hero-blob.ts

import { getPayload } from 'payload'
import config from '@payload-config'
import { put } from '@vercel/blob'

const IMAGE_URL = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?fm=jpg&q=85&w=2400&auto=format&fit=crop'
const MEDIA_ID = 5
const POST_SLUG = 'best-aframe-cabins-america'

async function main() {
  // Download image
  console.log('Downloading image...')
  const res = await fetch(IMAGE_URL)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  console.log(`Downloaded ${(buffer.byteLength / 1024).toFixed(0)}KB`)

  // Upload to Vercel Blob
  console.log('Uploading to Vercel Blob...')
  const blob = await put('stays/aframe-cabins-hero.jpg', buffer, {
    access: 'public',
    contentType: 'image/jpeg',
  })
  console.log(`Blob URL: ${blob.url}`)

  // Patch the media record URL
  const payload = await getPayload({ config })
  const media = await payload.update({
    collection: 'media',
    id: MEDIA_ID,
    data: { url: blob.url } as any,
  })
  console.log(`Media id=${media.id} URL patched`)

  // Revalidate ISR cache
  const revalRes = await fetch('https://www.uniquestaysusa.com/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET!,
    },
    body: JSON.stringify({ tag: `journal:${POST_SLUG}` }),
  })
  console.log('Revalidation:', await revalRes.text())

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
