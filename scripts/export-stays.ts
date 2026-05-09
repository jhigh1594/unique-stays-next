// Export all stays + categories + spokes from local DB to JSON
// Run: pnpm exec tsx --env-file=.env.local scripts/export-stays.ts
// Output: scripts/stays-export.json

import { getPayload } from 'payload'
import config from '@payload-config'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

async function main() {
  const payload = await getPayload({ config })

  const [cats, spokes, stays] = await Promise.all([
    payload.find({ collection: 'categories', limit: 100, depth: 0 }),
    payload.find({ collection: 'spokes', limit: 100, depth: 0 }),
    payload.find({ collection: 'stays', limit: 500, depth: 1 }),
  ])

  const out = {
    categories: cats.docs,
    spokes: spokes.docs,
    stays: stays.docs,
  }

  const outPath = resolve('scripts/stays-export.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`Exported ${cats.totalDocs} categories, ${spokes.totalDocs} spokes, ${stays.totalDocs} stays → ${outPath}`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
