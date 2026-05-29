// Fix all 123 needs_review stays: delete non-US/dead, fix regions, fix locations, clear flags
// Run: export $(grep -v '^#' .env.local | xargs) && node scripts/fix-123-reviews.mjs

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pg = require('/Users/jon.high/unique-stays-next/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js')

const STATE_TO_REGION = {
  'Alabama': 'South', 'Alaska': 'West', 'Arizona': 'Southwest', 'Arkansas': 'South',
  'California': 'West', 'Colorado': 'West', 'Connecticut': 'Northeast', 'Delaware': 'South',
  'Florida': 'South', 'Georgia': 'South', 'Hawaii': 'West', 'Idaho': 'West',
  'Illinois': 'Midwest', 'Indiana': 'Midwest', 'Iowa': 'Midwest', 'Kansas': 'Midwest',
  'Kentucky': 'South', 'Louisiana': 'South', 'Maine': 'Northeast', 'Maryland': 'South',
  'Massachusetts': 'Northeast', 'Michigan': 'Midwest', 'Minnesota': 'Midwest',
  'Mississippi': 'South', 'Missouri': 'Midwest', 'Montana': 'West', 'Nebraska': 'Midwest',
  'Nevada': 'West', 'New Hampshire': 'Northeast', 'New Jersey': 'Northeast',
  'New Mexico': 'Southwest', 'New York': 'Northeast', 'North Carolina': 'South',
  'North Dakota': 'Midwest', 'Ohio': 'Midwest', 'Oklahoma': 'South', 'Oregon': 'West',
  'Pennsylvania': 'Northeast', 'Rhode Island': 'Northeast', 'South Carolina': 'South',
  'South Dakota': 'Midwest', 'Tennessee': 'South', 'Texas': 'South', 'Utah': 'West',
  'Vermont': 'Northeast', 'Virginia': 'South', 'Washington': 'West',
  'West Virginia': 'South', 'Wisconsin': 'Midwest', 'Wyoming': 'West',
  'District of Columbia': 'South',
}

// Location fixes for remaining bad parses
const LOCATION_FIXES = {
  375: { location: 'Mars Hill', state: 'North Carolina' },
  376: { location: 'Athens', state: 'Ohio' },
  380: { location: 'Stowe', state: 'Vermont' },
  381: { location: 'Copperhill', state: 'Tennessee' },
  382: { location: 'Cottage Grove', state: 'Minnesota' },
  383: { location: 'Black Hawk', state: 'Colorado' },
}

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URI)
  const client = new pg.Client({
    host: dbUrl.hostname, port: parseInt(dbUrl.port || '5432'),
    database: dbUrl.pathname.slice(1), user: dbUrl.username, password: dbUrl.password,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  // 1. Delete non-US and dead listings
  const DELETE_IDS = [274, 303, 318, 377, 379, 50, 196, 200]
  console.log('=== Step 1: Delete non-US + dead listings ===')
  for (const id of DELETE_IDS) {
    const r = await client.query('SELECT slug, review_reason FROM stays WHERE id = $1', [id])
    if (r.rows.length) {
      console.log(`  DELETE ${id} | ${r.rows[0].slug} | ${r.rows[0].review_reason}`)
      // Delete related records first
      await client.query('DELETE FROM stays_rels WHERE parent_id = $1', [id])
      await client.query('DELETE FROM stays_tags WHERE _parent_id = $1', [id])
      await client.query('DELETE FROM stays_gallery_images WHERE _parent_id = $1', [id])
      await client.query('DELETE FROM stays_faqs WHERE _parent_id = $1', [id])
      await client.query('DELETE FROM stays WHERE id = $1', [id])
    }
  }

  // 2. Fix bad locations
  console.log('\n=== Step 2: Fix bad location formats ===')
  for (const [id, fix] of Object.entries(LOCATION_FIXES)) {
    const r = await client.query('SELECT location, state FROM stays WHERE id = $1', [id])
    if (r.rows.length) {
      console.log(`  FIX ${id}: "${r.rows[0].location}, ${r.rows[0].state}" -> "${fix.location}, ${fix.state}"`)
      await client.query('UPDATE stays SET location = $1, state = $2 WHERE id = $3', [fix.location, fix.state, id])
    }
  }

  // 3. Fix regions based on state
  console.log('\n=== Step 3: Fix regions ===')
  const allStays = await client.query('SELECT id, state, region FROM stays WHERE needs_review = true')
  let regionFixes = 0
  for (const row of allStays.rows) {
    const correct = STATE_TO_REGION[row.state]
    if (correct && row.region !== correct) {
      console.log(`  FIX ${row.id}: ${row.region} -> ${correct} (${row.state})`)
      await client.query('UPDATE stays SET region = $1 WHERE id = $2', [correct, row.id])
      regionFixes++
    }
  }
  console.log(`  Fixed ${regionFixes} regions`)

  // 4. Clear needs_review for all remaining stays
  console.log('\n=== Step 4: Clear needs_review flags ===')
  const remaining = await client.query('SELECT count(*) as c FROM stays WHERE needs_review = true')
  const count = remaining.rows[0].c
  console.log(`  Clearing needs_review on ${count} stays`)
  await client.query("UPDATE stays SET needs_review = false, review_reason = NULL WHERE needs_review = true")

  // 5. Final summary
  console.log('\n=== Final summary ===')
  const total = await client.query('SELECT count(*) as c FROM stays')
  console.log(`  Total stays: ${total.rows[0].c}`)
  const review = await client.query("SELECT count(*) as c FROM stays WHERE needs_review = true")
  console.log(`  Needs review: ${review.rows[0].c}`)
  const noImg = await client.query('SELECT count(*) as c FROM stays WHERE image_id IS NULL AND image_url IS NULL')
  console.log(`  No image: ${noImg.rows[0].c}`)

  await client.end()
}

main().catch(console.error)
