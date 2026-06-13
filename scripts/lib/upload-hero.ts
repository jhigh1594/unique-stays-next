// Reusable hero image upload utility.
// Downloads an image, creates a Payload media record backed by R2,
// links it to the blog post, and revalidates ISR cache.
//
// Usage (programmatic):
//   import { uploadHeroImage } from './lib/upload-hero.js'
//   await uploadHeroImage({ imageUrl, filename, alt, postSlug })
//
// Usage (CLI):
//   pnpm exec tsx --env-file=.env.local scripts/set-hero-image.ts \
//     --slug best-aframe-cabins-america \
//     --image "https://images.unsplash.com/photo-xxx?fm=jpg&q=85&w=2400" \
//     --alt "A-frame cabin in mountain forest"

import { getPayload } from 'payload'
import config from '@payload-config'

export interface UploadHeroOptions {
  /** External image URL to download (Unsplash, etc.) */
  imageUrl: string
  /** Filename for R2/Payload media (e.g. "aframe-cabins-hero.jpg") */
  filename: string
  /** Alt text for the media record */
  alt: string
  /** Blog post slug to link the hero image to */
  postSlug: string
  /** Optional: existing media record ID to reuse (skips upload if URL is already correct) */
  existingMediaId?: number
}

export async function uploadHeroImage(opts: UploadHeroOptions) {
  const { imageUrl, filename, alt, postSlug } = opts

  // 1. Download image
  console.log(`Downloading hero image for "${postSlug}"...`)
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status} ${imgRes.statusText}`)
  const buffer = Buffer.from(await imgRes.arrayBuffer())
  console.log(`  Downloaded ${(buffer.byteLength / 1024).toFixed(0)}KB`)

  // 2. Create or update Payload media record. The media collection is backed by R2.
  const payload = await getPayload({ config })

  let media
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) {
    await payload.delete({
      collection: 'media',
      id: existing.docs[0].id as number,
      overrideAccess: true,
    })
  }

  media = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: buffer,
      mimetype: 'image/jpeg',
      name: filename,
      size: buffer.byteLength,
    },
    overrideAccess: true,
  })
  console.log(`  Uploaded media id=${media.id} to R2`)

  if (typeof media.url === 'string') {
    const verifyRes = await fetch(media.url, { method: 'HEAD' })
    if (!verifyRes.ok) throw new Error(`R2 media URL returned ${verifyRes.status} — upload may have failed`)
    console.log('  Verified: R2 media URL returns 200')
  }

  // 3. Link hero image to blog post
  const posts = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: postSlug } },
    limit: 1,
    depth: 0,
  })
  if (posts.totalDocs === 0) throw new Error(`Post not found: ${postSlug}`)
  const post = posts.docs[0]

  await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: { heroImage: media.id as number },
  })
  console.log(`  Linked hero image (media id=${media.id}) to post "${postSlug}" (id=${post.id})`)

  // 4. Revalidate ISR cache.
  // Honor REVALIDATE_BASE_URL (project convention, see src/collections/BlogPosts.ts),
  // else NEXT_PUBLIC_SERVER_URL — but only if it points at a real host. When this
  // script runs locally via --env-file=.env.local, NEXT_PUBLIC_SERVER_URL is
  // http://localhost:3000, which silently no-ops prod cache; fall back to prod www.
  const candidate = process.env.REVALIDATE_BASE_URL ?? process.env.NEXT_PUBLIC_SERVER_URL
  const serverUrl = candidate && !candidate.includes('localhost') ? candidate : 'https://www.uniquestaysusa.com'
  const revalRes = await fetch(`${serverUrl}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET || '',
    },
    body: JSON.stringify({ tag: `journal:${postSlug}` }),
  })
  const revalText = await revalRes.text()
  console.log(`  ISR revalidation (journal:${postSlug}): ${revalText}`)

  // Also bust the journal index — the hero shows on listing cards.
  const indexRes = await fetch(`${serverUrl}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET || '',
    },
    body: JSON.stringify({ tag: 'journal' }),
  })
  console.log(`  ISR revalidation (journal index): ${await indexRes.text()}`)

  // 5. Verify final state
  const finalCheck = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: postSlug } },
    limit: 1,
    depth: 1,
  })
  const finalPost = finalCheck.docs[0]
  const heroImage = finalPost.heroImage as Record<string, unknown> | null
  const finalUrl = heroImage && typeof heroImage === 'object' && typeof heroImage.url === 'string' ? heroImage.url : ''

  if (!finalUrl.includes('r2.dev') && !finalUrl.includes('media.uniquestaysusa.com')) {
    throw new Error(`Hero image URL is not an R2 URL: ${finalUrl}`)
  }

  console.log(`\n✓ Hero image set successfully`)
  console.log(`  Post: /journal/${postSlug}`)
  console.log(`  Image: ${finalUrl}`)

  return { mediaId: media.id, postId: post.id, imageUrl: finalUrl }
}
