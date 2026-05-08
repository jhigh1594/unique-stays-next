// Fix broken image URLs — patches all stays in Payload with real imageUrl values from source data
// Run: pnpm fix-images

import { getPayload } from 'payload'
import config from '@payload-config'
import { STAYS } from '../../Unique-stays/client/src/lib/stays-data.js'

async function main() {
  const payload = await getPayload({ config })

  const imageMap = new Map<string, string>()
  for (const stay of STAYS) {
    if (stay.id && stay.image) imageMap.set(stay.id, stay.image)
  }
  console.log(`Source: ${imageMap.size} stay images loaded`)

  let updated = 0
  let skipped = 0
  let notFound = 0
  const failures: string[] = []

  for (const [slug, imageUrl] of imageMap) {
    try {
      const result = await payload.find({
        collection: 'stays',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })

      if (result.totalDocs === 0) {
        notFound++
        continue
      }

      const existing = result.docs[0]
      if (existing.imageUrl === imageUrl) {
        skipped++
        continue
      }

      await payload.update({
        collection: 'stays',
        id: existing.id as number,
        data: { imageUrl },
      })

      updated++
      process.stdout.write('.')
    } catch (err) {
      failures.push(`${slug}: ${err}`)
    }
  }

  console.log(`\n✓ Updated: ${updated}  Skipped (already correct): ${skipped}  Not found: ${notFound}`)
  if (failures.length > 0) {
    console.error(`Failures (${failures.length}):`)
    failures.forEach(f => console.error(' ', f))
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
