// scripts/resolve-vrbo-urls.ts
// Resolve VRBO affiliate shortlinks and validate direct listing URLs
// using agent-browser CLI connected to a real Chrome CDP session.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/resolve-vrbo-urls.ts
// Requires: Chrome running with --remote-debugging-port=9222
//           agent-browser connected: agent-browser connect http://127.0.0.1:9222
//
// Flags:
//   --delay <ms>        Delay between URL resolutions (default 5000)
//   --dry-run           Resolve URLs but don't update Payload
//   --limit <N>         Only process N stays (for testing)
//   --offset <N>        Skip first N stays
//   --update-only       Skip resolution, just update from existing mapping file
//   --mapping <path>    Path to mapping JSON (default /tmp/vrbo-url-mapping.json)

import { execFileSync } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '@payload-config'

// ── CLI arg parsing ──────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const delay = parseInt(getArg('delay') ?? '5000', 10)
const dryRun = hasFlag('dry-run')
const limit = getArg('limit') ? parseInt(getArg('limit')!, 10) : undefined
const offset = parseInt(getArg('offset') ?? '0', 10)
const updateOnly = hasFlag('update-only')
const mappingPath = getArg('mapping') ?? '/tmp/vrbo-url-mapping.json'

// ── Types ────────────────────────────────────────────────────────
interface Stay {
  id: number
  slug: string
  affiliateUrl: string
  platform: string
}

interface MappingEntry {
  payloadId: number
  slug: string
  oldUrl: string
  resolvedUrl: string
  listingId: string
  status: 'valid' | 'invalid' | 'error' | 'skipped'
  error?: string
}

// ── agent-browser helpers ────────────────────────────────────────
function ab(args: string[], timeout = 10000): string {
  return execFileSync('agent-browser', args, {
    encoding: 'utf-8',
    timeout,
  }).trim()
}

function abGoto(url: string): string {
  return ab(['goto', url], 30000)
}

function abGetUrl(): string {
  return ab(['get', 'url'])
}

function abGetTitle(): string {
  return ab(['get', 'title'])
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ── URL classification ───────────────────────────────────────────
type UrlType = 'affiliate-short' | 'affiliate-landing' | 'direct'

function classifyUrl(url: string): UrlType {
  if (url.includes('vrbo.com/affiliate/') || url.includes('vrbo.com/affiliates/')) {
    // Distinguish: /affiliate/XXXX is a shortlink, /affiliates/uniquestaysusa/... is a landing page
    if (url.match(/vrbo\.com\/affiliate\/[A-Za-z0-9]+$/)) {
      return 'affiliate-short'
    }
    return 'affiliate-landing'
  }
  return 'direct'
}

// ── Resolve affiliate shortlink ──────────────────────────────────
function resolveAffiliateShort(url: string): { resolvedUrl: string; listingId: string } | null {
  try {
    abGoto(url)
    const resolved = abGetUrl()

    // Parse listing ID from resolved URL
    // Format: https://www.vrbo.com/4147470?clickref=... or https://www.vrbo.com/4147470
    const match = resolved.match(/vrbo\.com\/(\d+)/)
    if (match) {
      return {
        resolvedUrl: `https://www.vrbo.com/${match[1]}`,
        listingId: match[1],
      }
    }

    // URL resolved but no listing ID found — might be a search page or error
    return { resolvedUrl: resolved, listingId: '' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`agent-browser goto failed: ${msg}`)
  }
}

// ── Normalize direct URL ─────────────────────────────────────────
function normalizeDirectUrl(url: string): string {
  let normalized = url

  // Strip locale prefixes
  normalized = normalized.replace(/\/en-gb\//, '/')

  // Extract just the base URL with listing ID
  const match = normalized.match(/vrbo\.com\/(\d+[ha]?)/)
  if (match) {
    const rawId = match[1]
    // Strip h/ha suffix
    const cleanId = rawId.replace(/[ha]+$/, '')
    normalized = `https://www.vrbo.com/${cleanId}`
  }

  return normalized
}

// ── Validate URL loads correctly ─────────────────────────────────
function validateListing(url: string): { valid: boolean; title: string } {
  try {
    abGoto(url)
    const title = abGetTitle()

    // VRBO bot detection page has title "Bot or Not?"
    if (title.toLowerCase().includes('bot or not')) {
      return { valid: false, title }
    }

    // Valid listing pages have the property name in the title
    return { valid: true, title }
  } catch (err) {
    return { valid: false, title: `Error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('═ VRBO URL Resolver ═')
  console.log(`  Delay: ${delay}ms`)
  console.log(`  Dry run: ${dryRun}`)
  if (limit) console.log(`  Limit: ${limit}`)
  if (offset) console.log(`  Offset: ${offset}`)
  console.log()

  // ── Update-only mode: skip resolution, just update Payload ──
  if (updateOnly) {
    if (!existsSync(mappingPath)) {
      console.error(`Mapping file not found: ${mappingPath}`)
      process.exit(1)
    }
    const mapping: MappingEntry[] = JSON.parse(readFileSync(mappingPath, 'utf-8'))
    const validEntries = mapping.filter((e) => e.status === 'valid' && e.resolvedUrl !== e.oldUrl)
    console.log(`Updating ${validEntries.length} stays from mapping...`)

    const payload = await getPayload({ config })
    let updated = 0
    for (const entry of validEntries) {
      if (dryRun) {
        console.log(`[dry-run] ${entry.slug}: ${entry.oldUrl} → ${entry.resolvedUrl}`)
        continue
      }
      try {
        await payload.update({
          collection: 'stays',
          id: entry.payloadId,
          data: { affiliateUrl: entry.resolvedUrl },
          overrideAccess: true,
        })
        updated++
        process.stdout.write(`✓ ${entry.slug}\n`)
      } catch (err) {
        process.stdout.write(`✗ ${entry.slug}: ${err instanceof Error ? err.message : String(err)}\n`)
      }
    }
    console.log(`\nUpdated ${updated}/${validEntries.length} stays`)
    process.exit(0)
  }

  // ── Resolve mode ──
  const payload = await getPayload({ config })

  console.log('Fetching VRBO stays from Payload...')
  const result = await payload.find({
    collection: 'stays',
    limit: 200,
    depth: 0,
    where: { platform: { equals: 'VRBO' } },
  })

  let stays = result.docs as Stay[]
  console.log(`Found ${stays.length} VRBO stays`)

  // Apply offset and limit
  stays = stays.slice(offset)
  if (limit) stays = stays.slice(0, limit)

  console.log(`Processing ${stays.length} stays\n`)

  const mapping: MappingEntry[] = []
  let resolved = 0
  let invalid = 0
  let errors = 0
  let skipped = 0

  for (let i = 0; i < stays.length; i++) {
    const stay = stays[i]
    const urlType = classifyUrl(stay.affiliateUrl)

    try {
      let entry: MappingEntry

      switch (urlType) {
        case 'affiliate-short': {
          process.stdout.write(`[${i + 1}/${stays.length}] Resolving shortlink: ${stay.slug}...`)
          const result = resolveAffiliateShort(stay.affiliateUrl)

          if (result && result.listingId) {
            entry = {
              payloadId: stay.id,
              slug: stay.slug,
              oldUrl: stay.affiliateUrl,
              resolvedUrl: result.resolvedUrl,
              listingId: result.listingId,
              status: 'valid',
            }
            resolved++
            process.stdout.write(` → ${result.listingId} ✓\n`)
          } else if (result) {
            entry = {
              payloadId: stay.id,
              slug: stay.slug,
              oldUrl: stay.affiliateUrl,
              resolvedUrl: result.resolvedUrl,
              listingId: '',
              status: 'invalid',
              error: 'No listing ID in resolved URL',
            }
            invalid++
            process.stdout.write(` → no listing ID ✗\n`)
          } else {
            throw new Error('Resolution returned null')
          }
          break
        }

        case 'affiliate-landing': {
          process.stdout.write(`[${i + 1}/${stays.length}] Validating landing: ${stay.slug}...`)
          const validation = validateListing(stay.affiliateUrl)

          entry = {
            payloadId: stay.id,
            slug: stay.slug,
            oldUrl: stay.affiliateUrl,
            resolvedUrl: validation.valid ? stay.affiliateUrl : '',
            listingId: validation.valid ? '' : '',
            status: validation.valid ? 'valid' : 'invalid',
            error: validation.valid ? undefined : `Page title: "${validation.title}"`,
          }

          if (validation.valid) {
            resolved++
            process.stdout.write(` ✓ (${validation.title.slice(0, 40)})\n`)
          } else {
            invalid++
            process.stdout.write(` ✗ (${validation.title})\n`)
          }
          break
        }

        case 'direct': {
          const normalized = normalizeDirectUrl(stay.affiliateUrl)
          process.stdout.write(`[${i + 1}/${stays.length}] Validating direct: ${stay.slug}...`)
          const validation = validateListing(normalized)

          // Extract listing ID from normalized URL
          const idMatch = normalized.match(/vrbo\.com\/(\d+)/)
          const listingId = idMatch ? idMatch[1] : ''

          entry = {
            payloadId: stay.id,
            slug: stay.slug,
            oldUrl: stay.affiliateUrl,
            resolvedUrl: normalized,
            listingId,
            status: validation.valid ? 'valid' : 'invalid',
            error: validation.valid ? undefined : `Page title: "${validation.title}"`,
          }

          if (validation.valid) {
            resolved++
            process.stdout.write(` ✓ (${validation.title.slice(0, 40)})\n`)
          } else {
            invalid++
            process.stdout.write(` ✗ (${validation.title})\n`)
          }
          break
        }
      }

      mapping.push(entry)

      // Update Payload immediately if URL changed (unless dry run)
      if (!dryRun && entry.status === 'valid' && entry.resolvedUrl !== entry.oldUrl) {
        await payload.update({
          collection: 'stays',
          id: stay.id,
          data: { affiliateUrl: entry.resolvedUrl },
          overrideAccess: true,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors++
      process.stdout.write(` ✗ ERROR: ${msg.slice(0, 80)}\n`)

      mapping.push({
        payloadId: stay.id,
        slug: stay.slug,
        oldUrl: stay.affiliateUrl,
        resolvedUrl: '',
        listingId: '',
        status: 'error',
        error: msg,
      })
    }

    // Rate limiting
    if (delay > 0 && i < stays.length - 1) {
      await sleep(delay)
    }
  }

  // ── Save mapping ──
  writeFileSync(mappingPath, JSON.stringify(mapping, null, 2))
  console.log(`\n═ Report ═`)
  console.log(`  Total:    ${stays.length}`)
  console.log(`  Valid:    ${resolved}`)
  console.log(`  Invalid:  ${invalid}`)
  console.log(`  Errors:   ${errors}`)
  console.log(`  Skipped:  ${skipped}`)
  console.log(`  Mapping:  ${mappingPath}`)

  if (invalid > 0 || errors > 0) {
    console.log(`\n  Failed URLs:`)
    mapping
      .filter((e) => e.status !== 'valid')
      .forEach((e) => console.log(`    ${e.slug}: ${e.error ?? e.status}`))
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
