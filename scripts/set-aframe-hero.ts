// Downloads A-frame cabin hero image and attaches it to the blog post
// Run: pnpm exec tsx --env-file=.env.local scripts/set-aframe-hero.ts

import { getPayload } from 'payload'
import config from '@payload-config'

const IMAGE_URL = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?fm=jpg&q=85&w=2400&auto=format&fit=crop'
const POST_SLUG = 'best-aframe-cabins-america'

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.find({ collection: 'media', where: { filename: { equals: 'aframe-cabins-hero.jpg' } }, limit: 1, depth: 0 })
  let media
  if (existing.totalDocs > 0) {
    media = existing.docs[0]
    console.log(`Media already exists: id=${media.id}`)
  } else {
    console.log('Downloading hero image...')
    const res = await fetch(IMAGE_URL)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    console.log(`Downloaded ${(buffer.byteLength / 1024).toFixed(0)}KB`)
    console.log('Uploading to Payload media...')
    media = await payload.create({
      collection: 'media',
      data: { alt: 'A-frame cabin nestled in mountain forest with triangular roof line' },
      file: { data: buffer, mimetype: 'image/jpeg', name: 'aframe-cabins-hero.jpg', size: buffer.byteLength },
    })
    console.log(`Media created: id=${media.id}`)
  }

  const posts = await payload.find({ collection: 'blog-posts', where: { slug: { equals: POST_SLUG } }, limit: 1, depth: 0 })
  if (posts.totalDocs === 0) throw new Error(`Post not found: ${POST_SLUG}`)
  const post = posts.docs[0]

  await payload.update({ collection: 'blog-posts', id: post.id as number, data: { heroImage: media.id as number } })
  console.log(`✓ Hero image linked to "${POST_SLUG}" (post id=${post.id})`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
