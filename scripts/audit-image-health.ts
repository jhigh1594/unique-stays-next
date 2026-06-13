// Full image health audit across all stays
// Checks hero + gallery images for liveness, R2 hosting, and domain allowlist compliance
//
// Run: node --env-file=.env.local --import tsx/esm scripts/audit-image-health.ts
// Flags:
//   --fix         Auto-fix broken stays after audit (runs fix pipeline on failures)
//   --json        Output results as JSON
//   --csv         Output results as CSV
//   --limit <N>   Only audit N stays
//
// Requires: DATABASE_URI, PAYLOAD_SECRET

import { getPayload } from 'payload'
import config from '@payload-config'
import { auditStayImages, isR2Url } from '../src/lib/image-validation'
import { auditStayImageSemantics, getAirbnbReals, listingIdFromUrl } from './lib/image-semantic'

const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const shouldFix = hasFlag('fix')
const outputJson = hasFlag('json')
const outputCsv = hasFlag('csv')
const limit = getArg('limit') ? parseInt(getArg('limit')!, 10) : undefined
// Semantic check (opt-in): for Airbnb stays, compare hero/gallery to the listing's
// real photo set via airbnb-pp-cli + dHash. Catches live images of the WRONG property
// that the liveness pass cannot. Slow (one airbnb-pp-cli call per Airbnb stay).
const shouldSemantic = hasFlag('semantic')

interface Stay {
  id: number
  slug: string
  title: string
  platform: string
  affiliateUrl?: string | null
  imageUrl: string | null
  galleryImages: Array<{ imageUrl: string }>
}

async function main() {
  const payload = await getPayload({ config })

  console.log('═ Image Health Audit ═\n')

  // Fetch all stays
  const result = await payload.find({
    collection: 'stays',
    limit: limit ?? 500,
    depth: 0,
  })

  const stays = result.docs as Stay[]
  console.log(`Auditing ${stays.length} stays...\n`)

  interface Report extends Awaited<ReturnType<typeof auditStayImages>> {
    id: number
    heroSemantic?: string
    heroSemanticDist?: number
    gallerySemanticBad?: number[]
  }
  const reports: Report[] = []

  for (let i = 0; i < stays.length; i++) {
    const stay = stays[i]
    const report: Report = { ...(await auditStayImages(stay)), id: stay.id }

    // Semantic check (Airbnb only, opt-in) — detects live images of the wrong property
    if (shouldSemantic && stay.platform === 'Airbnb') {
      const listingId = listingIdFromUrl(stay.affiliateUrl ?? '')
      if (listingId) {
        try {
          const reals = await getAirbnbReals(listingId)
          const sem = await auditStayImageSemantics(stay, reals)
          if (sem.heroSemantic === 'mismatch') report.issues.push('hero_semantic_mismatch')
          if (sem.galleryBadIndices.length > 0) report.issues.push('gallery_semantic_mismatch')
          report.heroSemantic = sem.heroSemantic
          report.heroSemanticDist = sem.heroDist
          report.gallerySemanticBad = sem.galleryBadIndices
        } catch (err) {
          report.heroSemantic = `error: ${err instanceof Error ? err.message : String(err)}`
        }
      }
    }

    reports.push(report)

    // Progress indicator
    const statusIcon = report.issues.length === 0 ? '✓' : '⚠'
    const issueStr = report.issues.length > 0 ? ` [${report.issues.join(', ')}]` : ''
    process.stdout.write(`${statusIcon} ${i + 1}/${stays.length} ${stay.slug}${issueStr}\n`)
  }

  // Summary
  const healthy = reports.filter((r) => r.issues.length === 0)
  const missingHero = reports.filter((r) => r.issues.includes('missing_hero'))
  const brokenHero = reports.filter((r) => r.issues.includes('broken_hero'))
  const atRiskHero = reports.filter((r) => r.issues.includes('at_risk_hero'))
  const brokenGallery = reports.filter((r) => r.issues.includes('broken_gallery'))
  const heroSemantic = reports.filter((r) => r.issues.includes('hero_semantic_mismatch'))
  const gallerySemantic = reports.filter((r) => r.issues.includes('gallery_semantic_mismatch'))

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Total stays:      ${reports.length}`)
  console.log(`  Healthy:          ${healthy.length}`)
  console.log(`  Missing hero:     ${missingHero.length}`)
  console.log(`  Broken hero:      ${brokenHero.length}`)
  console.log(`  At-risk hero:     ${atRiskHero.length} (non-R2 external URL)`)
  console.log(`  Broken gallery:   ${brokenGallery.length}`)
  if (shouldSemantic) {
    console.log(`  Hero wrong-prop:  ${heroSemantic.length} (live img, wrong property — --semantic)`)
    console.log(`  Gallery wrong:    ${gallerySemantic.length} (live img, wrong property — --semantic)`)
  }

  const totalProblems = reports.length - healthy.length
  console.log(`  Total problems:   ${totalProblems}`)

  // Output details
  if (outputJson) {
    console.log('\n' + JSON.stringify(reports, null, 2))
  }

  if (outputCsv) {
    console.log('\nslug,title,platform,hero_url,hero_status,hero_live,hero_is_r2,gallery_count,gallery_broken,issues')
    for (const r of reports) {
      const fields = [
        r.slug,
        `"${r.title.replace(/"/g, '""').replace(/^([+=\-@\t\r])/gm, "'$1")}"`,
        r.platform,
        `"${r.heroUrl}"`,
        r.heroStatus,
        r.heroLiveness?.live ?? 'n/a',
        isR2Url(r.heroUrl),
        r.galleryCount,
        r.galleryBrokenCount,
        r.issues.join(';'),
      ]
      console.log(fields.join(','))
    }
  }

  // Detailed problem list
  if (!outputJson && !outputCsv && totalProblems > 0) {
    console.log('\n─ Problem Details ─')

    if (missingHero.length > 0) {
      console.log('\n  Missing hero images:')
      for (const r of missingHero) {
        console.log(`    • [${r.id}] ${r.slug} (${r.platform})`)
      }
    }

    if (brokenHero.length > 0) {
      console.log('\n  Broken hero images:')
      for (const r of brokenHero) {
        console.log(`    • [${r.id}] ${r.slug} (${r.platform}) — ${r.heroLiveness?.error ?? 'unknown'}`)
      }
    }

    if (atRiskHero.length > 0) {
      console.log('\n  At-risk hero images (non-R2, may expire):')
      for (const r of atRiskHero) {
        try {
          const hostname = new URL(r.heroUrl).hostname
          console.log(`    • [${r.id}] ${r.slug} (${r.platform}) — ${hostname}`)
        } catch {
          console.log(`    • [${r.id}] ${r.slug} (${r.platform})`)
        }
      }
    }

    if (brokenGallery.length > 0) {
      console.log('\n  Broken gallery images:')
      for (const r of brokenGallery) {
        console.log(`    • [${r.id}] ${r.slug} (${r.platform}) — ${r.galleryBrokenCount}/${r.galleryCount} broken`)
      }
    }

    if (heroSemantic.length > 0) {
      console.log('\n  Hero depicts WRONG property (live but incorrect):')
      for (const r of heroSemantic) {
        console.log(`    • [${r.id}] ${r.slug} (${r.platform}) — hero dist ${r.heroSemanticDist ?? '?'} vs real set`)
      }
    }

    if (gallerySemantic.length > 0) {
      console.log('\n  Gallery depicts WRONG property (live but incorrect):')
      for (const r of gallerySemantic) {
        console.log(`    • [${r.id}] ${r.slug} (${r.platform}) — bad idx ${JSON.stringify(r.gallerySemanticBad)}`)
      }
    }
  }

  // Flag broken stays for review in Payload
  if (!hasFlag('dry-run')) {
    const toFlag = [...missingHero, ...brokenHero, ...heroSemantic, ...gallerySemantic]
    if (toFlag.length > 0) {
      console.log(`\nFlagging ${toFlag.length} stays for review...`)
      for (const r of toFlag) {
        try {
          await payload.update({
            collection: 'stays',
            id: r.id,
            data: {
              needsReview: true,
              reviewReason: `image-health-audit: ${r.issues.join(', ')}`,
            },
            overrideAccess: true,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          process.stdout.write(`  ✗ Failed to flag ${r.slug}: ${msg}\n`)
        }
      }
    }
  }

  // Auto-fix if requested
  if (shouldFix && totalProblems > 0) {
    const fixableSlugs = [...missingHero, ...brokenHero].map((r) => r.slug)
    console.log(`\n─ Auto-fixing ${fixableSlugs.length} stays...`)
    console.log(`Run: node --env-file=.env.local --import tsx/esm scripts/fix-broken-stays.ts ${fixableSlugs.map((s) => `--slug ${s}`).join(' ')}`)
    // Note: actual fixing is done via the fix script to keep concerns separated
  }

  try {
    await (payload.db as { disconnect?: () => Promise<void> }).disconnect?.()
  } catch {
    try { await (payload.db as { pool?: { end: () => Promise<void> } }).pool?.end() } catch { /* ignore */ }
  }
  process.exit(totalProblems > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
