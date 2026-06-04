// scripts/backfill-bathrooms.ts
// Backfill bathrooms field by scraping listing pages with crawl4ai.
// Uses Payload SDK for DB reads/writes, crawl4ai (Python) for scraping.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/backfill-bathrooms.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, crawl4ai installed (.venv-c4ai)
//
// Flags:
//   --chunk <N>          Process only chunk N (1-indexed)
//   --chunk-size <N>     Stays per chunk (default 25)
//   --delay <ms>         Delay between scrapes (default 5000)
//   --dry-run            Show what would update without writing
//   --force              Re-scrape all stays (not just defaults)

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { getPayload } from 'payload'
import config from '@payload-config'

const execFileAsync = promisify(execFile)

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const chunk = getArg('chunk') ? parseInt(getArg('chunk')!, 10) : undefined
const chunkSize = parseInt(getArg('chunk-size') ?? '25', 10)
const delay = parseInt(getArg('delay') ?? '5000', 10)
const dryRun = hasFlag('dry-run')
const force = hasFlag('force')

// ── Types ─────────────────────────────────────────────────────
interface Stay {
  id: number
  slug: string
  platform: string
  affiliateUrl: string
  bathrooms: number | null
}

// ── crawl4ai scraper (Python subprocess) ──────────────────────
const C4AI_PY = `${import.meta.dirname}/../.venv-c4ai/bin/python3`
const C4AI_SCRIPT = `${import.meta.dirname}/backfill-bathrooms-c4ai.py`

async function scrapeBathrooms(url: string): Promise<number | null> {
  try {
    const { stdout, stderr } = await execFileAsync(C4AI_PY, [
      C4AI_SCRIPT, '--scrape', url,
    ], {
      timeout: 60000,
      maxBuffer: 1024 * 1024,
    })

    if (stderr) {
      const errLines = stderr.toString().trim().split('\n').filter((l) => !l.includes('DeprecationWarning'))
      if (errLines.length > 0) {
        process.stdout.write(`  [c4ai stderr] ${errLines.join(' | ')}\n`)
      }
    }

    const output = stdout.toString().trim()
    if (!output) return null

    // Script outputs just the number or "null"
    const trimmed = output.replace(/\n/g, '')
    if (trimmed === 'null' || trimmed === '') return null
    const parsed = parseFloat(trimmed)
    return isNaN(parsed) || parsed < 0.5 ? null : parsed
  } catch (err) {
    return null
  }
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const payload = await getPayload({ config })

  console.log('Fetching stays from Payload...')
  const result = await payload.find({
    collection: 'stays',
    limit: 500,
    depth: 0,
  })

  let stays = result.docs as Stay[]

  // Filter: only stays that need bathrooms (default=1 or missing)
  if (!force) {
    stays = stays.filter((s) => s.bathrooms == null || s.bathrooms === 1)
  }

  // Skip Direct platform (no scrape target)
  const directCount = stays.filter((s) => s.platform === 'Direct').length
  stays = stays.filter((s) => s.platform !== 'Direct')

  // Apply chunk filter
  if (chunk !== undefined) {
    const start = (chunk - 1) * chunkSize
    stays = stays.slice(start, start + chunkSize)
  }

  console.log(`Processing ${stays.length} stays${directCount ? ` (skipped ${directCount} Direct)` : ''}${dryRun ? ' (dry run)' : ''}`)
  if (chunk !== undefined) {
    console.log(`  Chunk ${chunk}, chunk-size ${chunkSize}`)
  }

  let processed = 0
  let succeeded = 0
  let failed = 0
  let skipped = 0
  const failures: Array<{ slug: string; error: string }> = []

  for (const stay of stays) {
    const slug = stay.slug
    processed++

    const bathrooms = await scrapeBathrooms(stay.affiliateUrl)

    if (bathrooms === null) {
      skipped++
      process.stdout.write(`⊘ ${slug} (no bathroom count found)\n`)
      continue
    }

    const rounded = bathrooms === Math.floor(bathrooms) ? Math.round(bathrooms) : bathrooms
    process.stdout.write(`✓ ${slug}: bathrooms=${rounded}\n`)
    succeeded++

    if (!dryRun) {
      try {
        await payload.update({
          collection: 'stays',
          id: stay.id,
          data: { bathrooms: rounded },
          overrideAccess: true,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failed++
        succeeded--
        failures.push({ slug, error: msg })
        process.stdout.write(`✗ ${slug}: write failed (${msg})\n`)
      }
    }

    // Rate limiting
    if (delay > 0 && processed < stays.length) {
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  // ── Report ──────────────────────────────────────────────────
  console.log('\n═══ Backfill Report ═══')
  console.log(`  Total:     ${stays.length}`)
  console.log(`  Succeeded: ${succeeded}`)
  console.log(`  Failed:    ${failed}`)
  console.log(`  Skipped:   ${skipped}`)

  if (failures.length > 0) {
    console.log(`\n✗ Failures (${failures.length}):`)
    failures.forEach(({ slug, error }) => console.log(`  - ${slug}: ${error}`))
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
