// Verify the 17 Airbnb heroes serve the CORRECT photo after the CDN/variant fixes.
//
// Why this exists (and why audit-image-health --semantic does NOT cover this):
//   The semantic audit fetches the bare `imageUrl`, for which the image-cdn worker
//   returns `x-source: original` (the .jpg). Those originals were always correct
//   after tmp-fix-heroes. The 2026-06-14 bug was in the VARIANT layer: browsers
//   request width-bucketed URLs (`?w=1600&v=…`) and the worker prefers pre-generated
//   `-w{N}.webp` variants that had been built from the OLD wrong heroes. So a live
//   page showed the wrong house while the origin-passing audit read clean.
//
// This script checks what a browser actually receives for each of the 17 heroes:
//   1. VARIANT SERVED — the worker replies `x-variant: stays/{slug}-w1600.webp`
//      (not `x-source: original`). Proves a variant path, not an origin fallback.
//   2. VERSION MATCH — sha256[:10] of the served variant bytes === the `?v=` on
//      imageUrl. Proves the variant is the one stamped at fix time and the
//      immutable cache was busted (stale variant ⇒ hash mismatch).
//   3. CONTENT MATCH — dHash(9×8) of the served variant vs the listing's full
//      airbnb-pp-cli real-photo set, Hamming ≤ 12. Proves it depicts the right
//      property (defends against stamping the wrong image).
//
// Run: node --env-file=.env.local --import tsx/esm scripts/verify-hero-variants.ts
// Flags:
//   --slugs a,b,c   Verify a subset (defaults to the 17 known-affected heroes)
//   --no-reals      Skip airbnb-pp-cli ground-truth fetch (integrity + liveness only)
//   --width N       Variant width bucket to probe (default 1600 = CDN_MAX_WIDTH)
//   --json          Machine-readable output
//
// Requires: DATABASE_URI, PAYLOAD_SECRET. airbnb-pp-cli on PATH (unless --no-reals).

import { getPayload } from 'payload'
import config from '@payload-config'
import {
  dHash,
  hamming,
  muscacheUuid,
  listingIdFromUrl,
  getAirbnbReals,
  SEMANTIC_THRESH,
} from './lib/image-semantic'
import { imageVersion } from './lib/stay-images'
import { buildR2CdnUrl, CDN_MAX_WIDTH } from '../src/lib/image-loader'

// ── The 17 heroes flagged wrong-property on 2026-06-13 (all stay IDs 154–373) ──
// listingId is resolved at runtime from each stay's affiliateUrl, so only slugs
// are hardcoded here.
const AFFECTED_HEROES = [
  'nevada-city-dome-ca',
  'copper-fox-treehouse-vt',
  'sage-canyon-cliff-house-co',
  'fox-wood-dome-ar',
  'shawnee-forest-dome-il',
  'basecamp-treeloft-mo',
  'skydome-hideaway-tx',
  'houseboat-sauna-ca',
  'indian-river-aframe-mi',
  'houseboat-mill-valley-ca',
  'hanksville-cave-home-ut',
  'castle-flagstaff-az',
  'bliss-ridge-farm-treehouse-vt',
  'willow-treehouse-ny',
  'pocono-castle-escape-room-pa',
  'romantic-mountain-dome-nc',
  'morristown-barn-silo-vt',
]

const args = process.argv.slice(2)
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)
const slugsArg = getArg('slugs')
const useReals = !hasFlag('no-reals')
const width = getArg('width') ? parseInt(getArg('width')!, 10) : CDN_MAX_WIDTH
const outputJson = hasFlag('json')

interface Fetched {
  status: number
  contentType: string | null
  variantHeader: string | null
  sourceHeader: string | null
  bytes: Buffer | null
}

async function fetchWithHeaders(url: string, retries = 2): Promise<Fetched> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; hero-verify)' },
      })
      const headers = r.headers
      if (r.ok) {
        const ab = await r.arrayBuffer()
        return {
          status: r.status,
          contentType: headers.get('content-type'),
          variantHeader: headers.get('x-variant'),
          sourceHeader: headers.get('x-source'),
          bytes: ab.byteLength > 5120 ? Buffer.from(ab) : null,
        }
      }
      if (r.status === 429 || r.status >= 500) {
        await new Promise((res) => setTimeout(res, 500 * (attempt + 1)))
        continue
      }
      return { status: r.status, contentType: headers.get('content-type'), variantHeader: headers.get('x-variant'), sourceHeader: headers.get('x-source'), bytes: null }
    } catch {
      if (attempt === retries) {
        return { status: 0, contentType: null, variantHeader: null, sourceHeader: null, bytes: null }
      }
      await new Promise((res) => setTimeout(res, 500 * (attempt + 1)))
    }
  }
  return { status: 0, contentType: null, variantHeader: null, sourceHeader: null, bytes: null }
}

function extractVersion(url: string): string | null {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') ?? u.searchParams.get('rev')
  } catch {
    return null
  }
}

interface Stay {
  id: number
  slug: string
  title: string
  platform: string
  affiliateUrl?: string | null
  imageUrl: string | null
}

interface Row {
  slug: string
  listingId: string | null
  servedVariantUrl: string | null
  variantServed: boolean
  versionMatch: boolean | null
  servedHash: string | null
  expectedVersion: string | null
  contentDist: number | null
  contentOk: boolean | null
  realCount: number | null
  issues: string[]
}

async function main() {
  const payload = await getPayload({ config })
  const slugs = slugsArg ? slugsArg.split(',').map((s) => s.trim()).filter(Boolean) : AFFECTED_HEROES

  if (!outputJson) {
    console.log('═ Hero Variant Verification ═')
    console.log(`Targets: ${slugs.length} | width: ${width} | reals: ${useReals ? 'yes' : 'no (--no-reals)'}\n`)
  }

  const rows: Row[] = []

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    const issues: string[] = []
    const row: Row = {
      slug,
      listingId: null,
      servedVariantUrl: null,
      variantServed: false,
      versionMatch: null,
      servedHash: null,
      expectedVersion: null,
      contentDist: null,
      contentOk: null,
      realCount: null,
      issues,
    }

    const res = await payload.find({
      collection: 'stays',
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    })
    const stay = res.docs[0] as Stay | undefined
    if (!stay) {
      issues.push('stay_not_found')
      rows.push(row)
      if (!outputJson) process.stdout.write(`✗ ${i + 1}/${slugs.length} ${slug} [stay_not_found]\n`)
      continue
    }

    row.listingId = listingIdFromUrl(stay.affiliateUrl ?? '')
    const imageUrl = stay.imageUrl ?? ''
    if (!imageUrl) {
      issues.push('missing_hero')
      rows.push(row)
      if (!outputJson) process.stdout.write(`✗ ${i + 1}/${slugs.length} ${slug} [missing_hero]\n`)
      continue
    }

    const version = extractVersion(imageUrl)
    row.expectedVersion = version
    if (!version) issues.push('missing_version') // publish/version-bump didn't land

    // Build the served variant URL exactly as the deployed loader would (w + forwarded v).
    const servedUrl = buildR2CdnUrl(imageUrl, width)
    row.servedVariantUrl = servedUrl
    if (!servedUrl) {
      // Not an R2-hosted hero (muscache etc.) — this set is all R2, so flag it.
      issues.push('not_r2_hero')
    }

    // Fetch ground truth once per stay (cached on disk by getAirbnbReals).
    let realHashes: bigint[] = []
    let realCount = 0
    if (useReals) {
      if (!row.listingId) {
        issues.push('no_listing_id')
      } else {
        try {
          const reals = await getAirbnbReals(row.listingId)
          realCount = reals.length
          if (reals.length === 0) {
            issues.push('no_reals')
          } else {
            const uuidOk = muscacheUuid(imageUrl) // muscache heroes are definitive, but this set is R2
            if (uuidOk) {
              issues.push('unexpected_muscache_hero') // shouldn't happen for the 17
            }
            for (let j = 0; j < reals.length; j += 12) {
              const batch = reals.slice(j, j + 12)
              const got = await Promise.all(
                batch.map(async (u) => {
                  try {
                    const r = await fetch(u, { signal: AbortSignal.timeout(30_000), headers: { 'User-Agent': 'Mozilla/5.0' } })
                    if (!r.ok) return null
                    const ab = await r.arrayBuffer()
                    return ab.byteLength > 5120 ? dHash(Buffer.from(ab)) : null
                  } catch {
                    return null
                  }
                }),
              )
              for (const h of got) if (h !== null) realHashes.push(h)
            }
          }
        } catch (err) {
          issues.push(`reals_error:${err instanceof Error ? err.message : String(err)}`.slice(0, 80))
        }
      }
    }
    row.realCount = realCount

    // Fetch the served variant.
    if (servedUrl) {
      const f = await fetchWithHeaders(servedUrl)
      if (f.status !== 200 || !f.bytes) {
        issues.push(f.status === 0 ? 'fetch_failed' : `http_${f.status}`)
      } else {
        // Signal 1: variant path served (not origin fallback)
        row.variantServed = !!f.variantHeader
        if (!row.variantServed) issues.push('origin_served_not_variant') // x-source: original

        // Signal 2: served bytes hash === expected ?v=
        const hash = imageVersion(f.bytes)
        row.servedHash = hash
        if (version) {
          row.versionMatch = hash === version
          if (!row.versionMatch) issues.push('version_mismatch') // stale or wrong variant at edge
        }

        // Signal 3: content depicts the right property
        if (useReals && realHashes.length > 0) {
          const servedHashBits = await dHash(f.bytes)
          let best = 99
          for (const rh of realHashes) {
            const d = hamming(servedHashBits, rh)
            if (d < best) best = d
          }
          row.contentDist = best
          row.contentOk = best <= SEMANTIC_THRESH
          if (!row.contentOk) issues.push(`content_mismatch:dist_${best}`)
        }
      }
    }

    rows.push(row)
    if (!outputJson) {
      const ok = issues.length === 0
      const tag = ok
        ? '✓'
        : issues[0] === 'content_mismatch:dist_' + row.contentDist
          ? `✗ dist ${row.contentDist}`
          : '✗'
      const extra: string[] = []
      if (row.variantServed) extra.push('variant')
      if (row.versionMatch) extra.push(`v=${row.servedHash?.slice(0, 6)}`)
      if (row.contentDist !== null) extra.push(`dist=${row.contentDist}`)
      const detail = extra.length ? ` [${extra.join(', ')}]` : ''
      process.stdout.write(`${ok ? '✓' : tag} ${i + 1}/${slugs.length} ${slug}${detail}${ok ? '' : ` ⚠ ${issues.join(';')}`}\n`)
    }
  }

  // ── Summary ──
  const total = rows.length
  const passed = rows.filter((r) => r.issues.length === 0).length
  const failed = total - passed
  const variantOk = rows.filter((r) => r.variantServed).length
  const versionOk = rows.filter((r) => r.versionMatch === true).length
  const contentOkCount = rows.filter((r) => r.contentOk === true).length

  if (outputJson) {
    console.log(JSON.stringify({ total, passed, failed, variantOk, versionOk, contentOkCount, rows }, null, 2))
  } else {
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`  Total:            ${total}`)
    console.log(`  PASS:             ${passed}`)
    console.log(`  FAIL:             ${failed}`)
    console.log(`  variant served:   ${variantOk}/${total}`)
    console.log(`  version matched:  ${versionOk}/${total}`)
    if (useReals) console.log(`  content matched:  ${contentOkCount}/${total} (dHash ≤ ${SEMANTIC_THRESH})`)

    if (failed > 0) {
      console.log('\n─ Failures ─')
      for (const r of rows.filter((x) => x.issues.length > 0)) {
        const bits: string[] = []
        if (r.expectedVersion) bits.push(`v=${r.expectedVersion.slice(0, 6)}`)
        if (r.servedHash) bits.push(`served=${r.servedHash.slice(0, 6)}`)
        if (r.versionMatch === false) bits.push('VERSION-MISMATCH')
        if (!r.variantServed) bits.push('no-variant-header')
        if (r.contentDist !== null && !r.contentOk) bits.push(`dist=${r.contentDist}`)
        console.log(`  • ${r.slug} — ${r.issues.join('; ')}${bits.length ? ` | ${bits.join(' ')}` : ''}`)
      }
    }
  }

  try {
    await (payload.db as { disconnect?: () => Promise<void> }).disconnect?.()
  } catch {
    try {
      await (payload.db as { pool?: { end: () => Promise<void> } }).pool?.end()
    } catch {
      /* ignore */
    }
  }
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
