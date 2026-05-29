import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })

async function main() {
  await client.connect()

  const r1 = await client.query('SELECT count(*) as total FROM stays WHERE needs_review = true')
  console.log('Needs review:', r1.rows[0].total)

  const r2 = await client.query(`
    SELECT id, slug, location, state, review_reason
    FROM stays
    WHERE needs_review = true
    ORDER BY id
  `)
  console.log('\nAll stays needing review:')
  r2.rows.forEach(r =>
    console.log(`${r.id} | ${r.slug} | location="${r.location}" | state="${r.state}" | reason="${r.review_reason}"`)
  )

  await client.end()
}

main().catch(console.error)
