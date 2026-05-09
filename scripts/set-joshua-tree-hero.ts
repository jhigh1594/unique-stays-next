// Downloads Joshua Tree hero image from Unsplash and attaches it to the blog post
// Run: pnpm exec tsx --env-file=.env.local scripts/set-joshua-tree-hero.ts

import { getPayload } from 'payload'
import config from '@payload-config'

const IMAGE_URL = 'https://images.unsplash.com/photo-1760773767030-3f603fe9d7c0?fm=jpg&q=85&w=2400&auto=format&fit=crop'
const POST_SLUG = 'best-unique-stays-joshua-tree'

async function main() {
  const payload = await getPayload({ config })

  // Download image
  console.log('Downloading hero image...')
  const res = await fetch(IMAGE_URL)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  console.log(`Downloaded ${(buffer.byteLength / 1024).toFixed(0)}KB`)

  // Upload to Payload media
  console.log('Uploading to Payload media...')
  const media = await payload.create({
    collection: 'media',
    data: { alt: 'Joshua trees in a desert landscape at sunset, Joshua Tree National Park' },
    file: {
      data: buffer,
      mimetype: 'image/jpeg',
      name: 'joshua-tree-hero.jpg',
      size: buffer.byteLength,
    },
  })
  console.log(`Media created: id=${media.id}`)

  // Find the blog post
  const posts = await payload.find({ collection: 'blog-posts', where: { slug: { equals: POST_SLUG } }, limit: 1, depth: 0 })
  if (posts.totalDocs === 0) throw new Error(`Post not found: ${POST_SLUG}`)
  const post = posts.docs[0]

  // Link hero image
  await payload.update({ collection: 'blog-posts', id: post.id as number, data: { heroImage: media.id as number } })
  console.log(`✓ Hero image linked to "${POST_SLUG}"`)
  console.log(`Photo by Kevin Schmid on Unsplash (https://unsplash.com/photos/y982inoyNyY)`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
