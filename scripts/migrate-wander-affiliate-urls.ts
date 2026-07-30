// Convert every Wander stay to a property-specific affiliate URL.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/migrate-wander-affiliate-urls.ts
//      node --env-file=.env.local --import tsx/esm scripts/migrate-wander-affiliate-urls.ts --apply
//
// The default is a dry run. `--apply` is intentionally required to write to Payload.

import { getPayload } from 'payload'

import { normalizeWanderAffiliateUrl } from '../src/lib/affiliate/wander'
import config from '@payload-config'

const apply = process.argv.includes('--apply')

type WanderStay = {
  id: number | string
  slug: string
  title: string
  affiliateUrl: string
}

async function main() {
  const payload = await getPayload({ config })

  try {
    const result = await payload.find({
      collection: 'stays',
      where: { platform: { equals: 'Wander' } },
      depth: 0,
      limit: 500,
      pagination: false,
      overrideAccess: true,
    })
    const stays = result.docs as WanderStay[]
    const changes = stays.map((stay) => ({
      stay,
      nextUrl: normalizeWanderAffiliateUrl(stay.affiliateUrl),
    }))
    const invalid = changes.filter(({ nextUrl }) => !nextUrl)
    const updates = changes.filter(({ stay, nextUrl }) => nextUrl && nextUrl !== stay.affiliateUrl)

    console.log(`Found ${stays.length} Wander stays.`)
    for (const { stay, nextUrl } of updates) {
      console.log(`${stay.slug}\n  ${stay.affiliateUrl}\n  → ${nextUrl}`)
    }

    if (invalid.length > 0) {
      console.error(`\nStopped: ${invalid.length} Wander URL(s) were not canonical property links.`)
      for (const { stay } of invalid) {
        console.error(`  ${stay.slug}: ${stay.affiliateUrl}`)
      }
      process.exitCode = 1
      return
    }

    if (!apply) {
      console.log(`\nDry run complete: ${updates.length} URL(s) would change. Re-run with --apply to write.`)
      return
    }

    for (const { stay, nextUrl } of updates) {
      await payload.update({
        collection: 'stays',
        id: stay.id,
        data: { affiliateUrl: nextUrl! },
        overrideAccess: true,
      })
    }

    console.log(`\nUpdated ${updates.length} Wander affiliate URL(s).`)
  } finally {
    await payload.db.pool.end()
  }
}

main().catch((error) => {
  console.error('Wander affiliate URL migration failed:', error)
  process.exitCode = 1
})
