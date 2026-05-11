// Reusable hero image upload utility.
// Downloads an image, uploads to Vercel Blob, creates/patches the Payload media
// record, links it to the blog post, and revalidates ISR cache.
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
import { put } from '@vercel/blob'

export interface UploadHeroOptions {
  /** External image URL to download (Unsplash, etc.) */
  imageUrl: string
  /** Filename for Vercel Blob (e.g. "aframe-cabins-hero.jpg") */
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

  // 2. Upload to Vercel Blob directly
  console.log('  Uploading to Vercel Blob...')
  const blob = await put(`stays/${filename}`, buffer, {
    access: 'public',
    contentType: 'image/jpeg',
  })
  console.log(`  Blob URL: ${blob.url}`)

  // 3. Verify the Blob URL is accessible
  const verifyRes = await fetch(blob.url, { method: 'HEAD' })
  if (!verifyRes.ok) throw new Error(`Blob URL returned ${verifyRes.status} — upload may have failed`)
  console.log('  Verified: Blob URL returns 200')

  // 4. Create or update Payload media record
  const payload = await getPayload({ config })

  let media
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) {
    // Patch existing record URL
    media = existing.docs[0]
    await payload.update({
      collection: 'media',
      id: media.id as number,
      data: { url: blob.url, alt } as any,
    })
    console.log(`  Updated media id=${media.id} URL → Blob`)
  } else {
    // Create new media record with Blob URL
    media = await payload.create({
      collection: 'media',
      data: { alt, url: blob.url } as any,
      file: {
        data: buffer,
        mimetype: 'image/jpeg',
        name: filename,
        size: buffer.byteLength,
      },
    })
    // Immediately patch URL in case Payload's upload overwrote it
    await payload.update({
      collection: 'media',
      id: media.id as number,
      data: { url: blob.url } as any,
    })
    console.log(`  Created media id=${media.id}, patched URL → Blob`)
  }

  // 5. Link hero image to blog post
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

  // 6. Revalidate ISR cache
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.uniquestaysusa.com'
  const revalRes = await fetch(`${serverUrl}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET || '',
    },
    body: JSON.stringify({ tag: `journal:${postSlug}` }),
  })
  const revalText = await revalRes.text()
  console.log(`  ISR revalidation: ${revalText}`)

  // 7. Verify final state
  const finalCheck = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: postSlug } },
    limit: 1,
    depth: 1,
  })
  const finalPost = finalCheck.docs[0]
  const heroImage = finalPost.heroImage as Record<string, unknown> | null
  const finalUrl = heroImage && typeof heroImage === 'object' && typeof heroImage.url === 'string' ? heroImage.url : ''

  if (!finalUrl.includes('blob.vercel-storage.com')) {
    throw new Error(`Hero image URL is not a Blob URL: ${finalUrl}`)
  }

  console.log(`\n✓ Hero image set successfully`)
  console.log(`  Post: /journal/${postSlug}`)
  console.log(`  Image: ${finalUrl}`)

  return { mediaId: media.id, postId: post.id, blobUrl: blob.url }
}
