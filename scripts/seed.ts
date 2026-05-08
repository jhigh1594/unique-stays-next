// Seed script — migrates stays-data.ts into Payload CMS
// Run from unique-stays-next/: pnpm seed
// Requires: DATABASE_URI and PAYLOAD_SECRET in .env.local (loaded via --env-file)
// Prerequisite: pnpm migrate must have been run against Neon first

import { getPayload } from 'payload'
import config from '@payload-config'
import { STAYS, SPOKES, CATEGORIES } from '../../Unique-stays/client/src/lib/stays-data.js'

// Category display string → URL slug
const categorySlugMap: Record<string, string> = {
  'Treehouses': 'treehouses',
  'Geodesic Domes': 'geodesic-domes',
  'Houseboats': 'houseboats',
  'Lighthouses': 'lighthouses',
  'Converted Barns': 'converted-barns',
  'Cave Dwellings': 'cave-dwellings',
  'A-Frame Cabins': 'a-frame-cabins',
  'Tiny Homes': 'tiny-homes',
  'Glamping': 'glamping',
  'Castles & Estates': 'castles-estates',
}

async function main() {
  const payload = await getPayload({ config })

  // ── Categories ────────────────────────────────────────────────
  console.log(`Seeding ${CATEGORIES.length} categories...`)
  const categoryIds: Record<string, number> = {}

  for (const cat of CATEGORIES) {
    const slug = categorySlugMap[cat.id]
    if (!slug) throw new Error(`No slug mapping for category: "${cat.id}" — add it to categorySlugMap`)

    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.totalDocs > 0) {
      categoryIds[cat.id] = existing.docs[0].id as number
      process.stdout.write('.')
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: { name: cat.label, slug, emoji: cat.emoji },
      })
      categoryIds[cat.id] = created.id as number
      process.stdout.write('+')
    }
  }
  console.log(`\n✓ ${Object.keys(categoryIds).length} categories`)

  // ── Spokes ────────────────────────────────────────────────────
  console.log(`Seeding ${SPOKES.length} spokes...`)
  const spokeIds: Record<string, number> = {}

  for (const spoke of SPOKES) {
    const existing = await payload.find({
      collection: 'spokes',
      where: { slug: { equals: spoke.slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.totalDocs > 0) {
      spokeIds[spoke.slug] = existing.docs[0].id as number
      process.stdout.write('.')
    } else {
      const created = await payload.create({
        collection: 'spokes',
        data: {
          name: spoke.title,
          slug: spoke.slug,
          tagline: spoke.tagline,
          description: spoke.description,
          icon: spoke.heroEmoji,
        },
      })
      spokeIds[spoke.slug] = created.id as number
      process.stdout.write('+')
    }
  }
  console.log(`\n✓ ${Object.keys(spokeIds).length} spokes`)

  // ── Stays ─────────────────────────────────────────────────────
  console.log(`Seeding ${STAYS.length} stays...`)
  let createdCount = 0
  let skippedCount = 0
  const failures: string[] = []

  for (let i = 0; i < STAYS.length; i++) {
    const stay = STAYS[i]

    try {
      const existing = await payload.find({
        collection: 'stays',
        where: { slug: { equals: stay.id } },
        limit: 1,
        depth: 0,
      })

      if (existing.totalDocs > 0) {
        skippedCount++
        continue
      }

      const categoryId = categoryIds[stay.category]
      if (!categoryId) throw new Error(`No category ID for: "${stay.category}"`)

      const resolvedSpokeIds = stay.spokes.map(slug => {
        const id = spokeIds[slug]
        if (!id) throw new Error(`No spoke ID for slug: "${slug}"`)
        return id
      })

      await payload.create({
        collection: 'stays',
        data: {
          slug: stay.id,
          title: stay.title,
          subtitle: stay.subtitle ?? '',
          location: stay.location,
          state: stay.state,
          region: stay.region,
          category: categoryId,
          spokes: resolvedSpokeIds,
          platform: stay.platform,
          affiliateUrl: stay.affiliateUrl,
          imageUrl: stay.image,
          price: stay.price,
          rating: stay.rating,
          reviewCount: stay.reviewCount,
          sleeps: stay.sleeps,
          bedrooms: stay.bedrooms,
          description: stay.description,
          tags: stay.tags.map(tag => ({ tag })),
          featured: stay.featured ?? false,
          editorsPick: stay.editorsPick ?? false,
          isNew: stay.isNew ?? false,
          workFriendly: {
            wifiSpeed: stay.wifiSpeed ?? '',
            hasDesk: stay.hasDesk ?? false,
          },
          petDetails: {
            petFriendly: stay.petFriendly ?? false,
            petPolicy: stay.petPolicy ?? '',
          },
          rvDetails: {
            rvHookup: stay.rvHookup ?? false,
            rvInfo: stay.rvDetails ?? '',  // Note: source field is rvDetails (string), Payload field is rvInfo
          },
          evDetails: {
            evCharger: stay.evCharger ?? false,
            evInfo: stay.evDetails ?? '',  // Note: source field is evDetails (string), Payload field is evInfo
          },
        },
      })

      createdCount++
      if ((i + 1) % 25 === 0 || i === STAYS.length - 1) {
        process.stdout.write(`  [${i + 1}/${STAYS.length}]\n`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Payload reports uniqueness violations as "The following field is invalid: slug"
      if (msg.includes('slug') && (msg.includes('invalid') || msg.includes('unique') || msg.includes('duplicate'))) {
        skippedCount++
      } else {
        failures.push(`${stay.id}: ${msg}`)
        process.stdout.write('✗')
      }
    }
  }

  console.log(`\n─────────────────────────────────────────`)
  console.log(`Summary: ✓ ${createdCount} created | ${skippedCount} skipped | ${failures.length} failures`)

  if (failures.length > 0) {
    console.error('\nFailed stays:')
    failures.forEach(f => console.error(`  ✗ ${f}`))
    process.exit(1)
  }

  console.log('\nVerification SQL (run against Neon):')
  console.log(`  SELECT 'stays' AS tbl, COUNT(*) FROM stays`)
  console.log(`  UNION ALL SELECT 'categories', COUNT(*) FROM categories`)
  console.log(`  UNION ALL SELECT 'spokes', COUNT(*) FROM spokes;`)
  console.log(`\n  -- Orphan check (should be 0):`)
  console.log(`  SELECT COUNT(*) FROM stays s`)
  console.log(`  WHERE NOT EXISTS (SELECT 1 FROM stays_rels sr WHERE sr.parent_id = s.id AND sr.path = 'spokes');`)

  await payload.db.pool.end()
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
