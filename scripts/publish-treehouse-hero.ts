// Upload hero image for best-treehouse-rentals-usa blog post
// Run: pnpm exec tsx --env-file=.env.local scripts/publish-treehouse-hero.ts

import { getPayload } from 'payload'
import config from '@payload-config'

const IMAGE_URL = 'https://images.unsplash.com/photo-1618767689160-da3fb810aad7?fm=jpg&q=85&w=2400&auto=format&fit=crop'
const POST_SLUG = 'best-treehouse-rentals-usa'

async function main() {
  const payload = await getPayload({ config })

  // Check for existing media
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'treehouse-hero.jpg' } },
    limit: 1,
    depth: 0,
  })

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

    media = await payload.create({
      collection: 'media',
      data: { alt: 'A glass treehouse cabin suspended among trees at golden hour, canopy view from above' },
      file: { data: buffer, mimetype: 'image/jpeg', name: 'treehouse-hero.jpg', size: buffer.byteLength },
    })
    console.log(`Media created: id=${media.id}`)
  }

  // Find the blog post
  const posts = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    limit: 1,
    depth: 0,
  })
  if (posts.totalDocs === 0) throw new Error(`Post not found: ${POST_SLUG}`)
  const post = posts.docs[0]

  await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: { heroImage: media.id as number },
  })
  console.log(`Hero image linked to "${POST_SLUG}" (post id=${post.id})`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
