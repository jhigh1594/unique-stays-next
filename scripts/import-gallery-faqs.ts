// Import gallery images and FAQs from stays-export.json into the new DB
// Run: pnpm exec tsx --env-file=.env.local scripts/import-gallery-faqs.ts

import { getPayload } from 'payload'
import config from '@payload-config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import crypto from 'crypto'

async function main() {
  const payload = await getPayload({ config })

  const raw = JSON.parse(readFileSync(resolve('scripts/stays-export.json'), 'utf8'))
  const stays = raw.stays as Array<Record<string, unknown>>

  // Build slug → new DB id map
  console.log('Building slug map...')
  const slugMap: Record<string, number> = {}
  let page = 1
  let hasMore = true
  while (hasMore) {
    const result = await payload.find({ collection: 'stays', limit: 100, page, depth: 0 })
    for (const s of result.docs) {
      slugMap[s.slug as string] = s.id as number
    }
    hasMore = result.page < result.totalPages
    page++
  }
  console.log(`Mapped ${Object.keys(slugMap).length} stays`)

  // ── Gallery Images ──────────────────────────────────────────
  let galleryCreated = 0
  let gallerySkipped = 0
  let galleryFailed = 0

  console.log('\nImporting gallery images...')
  for (const s of stays) {
    const slug = s.slug as string
    const parentId = slugMap[slug]
    if (!parentId) { gallerySkipped++; continue }

    const galleryImages = s.galleryImages as Array<Record<string, unknown>> | undefined
    if (!galleryImages || galleryImages.length === 0) continue

    for (let i = 0; i < galleryImages.length; i++) {
      const gi = galleryImages[i]
      try {
        await payload.create({
          collection: 'stays',
          id: parentId,
          data: {
            galleryImages: [],
          },
          overrideAccess: true,
        })
        // Use direct DB insert since Payload doesn't have a clean way to append to arrays
      } catch {
        // Fallback: we'll use the DB pool directly
      }
    }
  }

  // Use the DB pool directly for bulk inserts
  const pool = payload.db.pool

  console.log('Inserting gallery images via SQL...')
  for (const s of stays) {
    const slug = s.slug as string
    const parentId = slugMap[slug]
    if (!parentId) continue

    const galleryImages = s.galleryImages as Array<Record<string, unknown>> | undefined
    if (!galleryImages || galleryImages.length === 0) continue

    for (let i = 0; i < galleryImages.length; i++) {
      const gi = galleryImages[i]
      const id = gi.id as string || crypto.randomUUID()
      const imageUrl = (gi.imageUrl as string) || null

      try {
        await pool.query(
          `INSERT INTO stays_gallery_images (id, _order, _parent_id, image_url, image_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [id, i, parentId, imageUrl, null]
        )
        galleryCreated++
      } catch (err) {
        galleryFailed++
        const msg = err instanceof Error ? err.message : String(err)
        if (galleryFailed <= 5) console.error(`  ✗ gallery ${slug}[${i}]: ${msg}`)
      }
    }
    if ((galleryCreated + galleryFailed) % 100 === 0) {
      process.stdout.write(`  [${galleryCreated + galleryFailed}/~898]\n`)
    }
  }

  console.log(`\n✓ Gallery: ${galleryCreated} created | ${gallerySkipped} skipped | ${galleryFailed} failed`)

  // ── FAQs ─────────────────────────────────────────────────────
  let faqsCreated = 0
  let faqsSkipped = 0
  let faqsFailed = 0

  console.log('\nImporting FAQs...')
  for (const s of stays) {
    const slug = s.slug as string
    const parentId = slugMap[slug]
    if (!parentId) { faqsSkipped++; continue }

    const faqs = s.faqs as Array<Record<string, unknown>> | undefined
    if (!faqs || faqs.length === 0) continue

    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i]
      const id = faq.id as string || crypto.randomUUID()
      const question = (faq.question as string) || ''
      const answer = (faq.answer as string) || ''

      if (!question && !answer) continue

      try {
        await pool.query(
          `INSERT INTO stays_faqs (id, _order, _parent_id, question, answer)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [id, i, parentId, question, answer]
        )
        faqsCreated++
      } catch (err) {
        faqsFailed++
        const msg = err instanceof Error ? err.message : String(err)
        if (faqsFailed <= 5) console.error(`  ✗ faq ${slug}[${i}]: ${msg}`)
      }
    }
  }

  console.log(`\n✓ FAQs: ${faqsCreated} created | ${faqsSkipped} skipped | ${faqsFailed} failed`)
  console.log('\n─────────────────────────────────────────')
  console.log('Done.')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
