// Authoritative verification + report.
// Reads /tmp/audit_results.json + cached reals. Re-checks every MISMATCH hero
// against the FULL real set (no cap) to eliminate false positives.
// Writes /tmp/audit_final.json + /tmp/audit_report.md

import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.uniquestaysusa.com'
const THRESH = 12
const REALS_DIR = '/tmp/audit_reals'

const dHash = async (b: Buffer) => {
  const { data, info } = await sharp(b).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
  let h = 0n, bit = 0n
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width - 1; x++) { if (data[y * info.width + x] > data[y * info.width + x + 1]) h |= 1n << bit; bit++ }
  return h
}
const ham = (a: bigint, b: bigint) => { let x = a ^ b, c = 0; while (x) { x &= x - 1n; c++ } return c }
const dl = async (u: string): Promise<Buffer | null> => {
  try { const r = await fetch(u, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0' } }); if (!r.ok) return null; const a = await r.arrayBuffer(); return a.byteLength > 5120 ? Buffer.from(a) : null } catch { return null }
}
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const muuid = (u: string) => u.includes('muscache.com') ? (u.match(UUID_RE)?.[0].toLowerCase() ?? null) : null

const prev = JSON.parse(readFileSync('/tmp/audit_results.json', 'utf8')) as any[]
const stays: any[] = await fetch(`${SERVER}/api/stays?where%5Bplatform%5D%5Bequals%5D=Airbnb&depth=0&limit=500`).then(r => r.json()).then((j: any) => j.docs)
const bySlug = new Map(stays.map(s => [s.slug, s]))

function realsOf(listingId: string): string[] {
  const f = `${REALS_DIR}/${listingId}.json`
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : []
}

const final: any[] = []
for (const p of prev) {
  const s = bySlug.get(p.slug)
  if (!s) { final.push({ ...p, finalVerdict: 'NO_STAY' }); continue }
  const lid = (s.affiliateUrl as string).match(/rooms\/(\d+)/)?.[1]
  if (p.heroVerdict === 'MISMATCH' && lid) {
    const reals = realsOf(lid)
    const hero = s.imageUrl as string
    const hu = muuid(hero)
    let verdict = p.heroVerdict, bestDist = -1, bestIdx = -1, method = p.heroMethod
    if (hu) {
      const realUuids = new Set(reals.map(muuid).filter(Boolean) as string[])
      verdict = realUuids.has(hu) ? 'OK' : 'MISMATCH'; method = 'uuid(all)'
    } else {
      const hb = await dl(hero)
      if (hb) {
        const hh = await dHash(hb)
        for (let i = 0; i < reals.length; i += 12) {
          const batch = reals.slice(i, i + 12)
          const got = await Promise.all(batch.map(async u => { const b = await dl(u); return b ? await dHash(b) : null }))
          got.forEach((h, j) => { if (h) { const d = ham(hh, h); if (bestDist < 0 || d < bestDist) { bestDist = d; bestIdx = i + j } } })
        }
        verdict = bestDist >= 0 && bestDist <= THRESH ? 'OK' : 'MISMATCH'; method = 'dhash(all)'
      } else { verdict = 'UNREACHABLE' }
    }
    final.push({ ...p, listingId: lid, heroType: hu ? 'muscache' : 'r2', heroUrl: hero, finalVerdict: verdict, bestDist, bestIdx, method })
  } else {
    final.push({ ...p, finalVerdict: p.heroVerdict ?? 'SKIP' })
  }
}
writeFileSync('/tmp/audit_final.json', JSON.stringify(final, null, 2))

// ── Report ──
const mm = final.filter(r => r.finalVerdict === 'MISMATCH')
const ok = final.filter(r => r.finalVerdict === 'OK')
const skip = final.filter(r => r.skip || r.finalVerdict === 'SKIP' || r.finalVerdict === 'NO_STAY')
const galBad = final.filter(r => r.galleryVerdict && r.galleryVerdict !== 'OK' && !r.skip)
const r2 = mm.filter(r => r.heroType === 'r2'), mc = mm.filter(r => r.heroType === 'muscache')

let md = `# Airbnb Image Health Audit — ${new Date().toISOString().slice(0,10)}\n\n`
md += `Method: airbnb-pp-cli = ground-truth photo set per listing. Hero/gallery compared by muscache UUID match (definitive) or dHash vs **full** real set (Hamming ≤ ${THRESH}/64).\n\n`
md += `## Summary\n\n| Metric | Count |\n|---|---|\n| Total Airbnb stays | ${prev.length} |\n| Audited | ${ok.length + mm.length + galBad.length} |\n| Hero OK | ${ok.length} |\n| **Hero MISMATCH (wrong property)** | **${mm.length}** |\n| ↳ R2 hero wrong | ${r2.length} |\n| ↳ muscache hero wrong | ${mc.length} |\n| Gallery OK | ${final.filter(r => r.galleryVerdict === 'OK').length} |\n| Gallery partial-mismatch | ${galBad.length} |\n| Skipped (pp-cli fail / delisted) | ${skip.length} |\n\n`
md += `## Root Cause\n\nTwo image pipelines write to stays, with different accuracy:\n\n`
md += `- **Gallery** (\`galleryImages\`, key \`stays/{slug}/gallery-N.jpg\`) — \`fetch-gallery-images.ts\` → \`airbnb-pp-cli\`. **Accurate.** ~99% clean.\n`
md += `- **Hero** (\`imageUrl\`, key \`stays/{slug}.jpg\`) — \`fix-hero-images.ts\` (Firecrawl) + \`backfill-missing-images.ts\` (crawl4ai). Scraped via Firecrawl/crawl4ai which on Airbnb returns wrong-property images (scrape noise, redirects, "similar homes" carousels, or img-tag fallback pulling unrelated photos). ${mm.length} heroes depict a different property than their listing.\n\n`
md += `The existing \`audit-image-health.ts\` checks **liveness + R2 hosting only** — it cannot catch a live, valid R2 image that shows the wrong house. That is why this went undetected.\n\n`
md += `## Hero Mismatches (${mm.length})\n\n| Stay | Listing | Hero host | Best dist | \`\` |\n|---|---|---|---|---|\n`
for (const r of [...r2, ...mc].sort((a, b) => (b.bestDist ?? 99) - (a.bestDist ?? 99))) {
  const dist = r.heroType === 'muscache' ? 'uuid✗' : `${r.bestDist}`
  md += `| [${r.slug}](https://www.uniquestaysusa.com/stays/${r.slug}) | [${r.listingId}](https://www.airbnb.com/rooms/${r.listingId}) | ${r.heroType} | ${dist} | [hero](${r.heroUrl}) |\n`
}
if (galBad.length) {
  md += `\n## Gallery Issues (${galBad.length})\n\n| Stay | Bad indices (of N) |\n|---|---|\n`
  for (const r of galBad) md += `| [${r.slug}](https://www.uniquestaysusa.com/stays/${r.slug}) | ${JSON.stringify(r.galleryBad)} of ${r.galleryTotal} |\n`
}
if (skip.length) {
  md += `\n## Skipped — needs manual check (${skip.length})\n\nairbnb-pp-cli could not fetch (bot challenge / delisted / error).\n\n`
  for (const r of skip) md += `- [${r.slug}](https://www.uniquestaysusa.com/stays/${r.slug}) — ${r.skip ?? r.finalVerdict}\n`
}
md += `\n## Fix\n\nRe-scrape the ${mm.length} mismatched heroes from the trusted source (\`airbnb-pp-cli\` real photo #0), upload to \`stays/{slug}.jpg\`, set \`imageUrl\` — same path the gallery pipeline already uses. Avoid Firecrawl/crawl4ai for Airbnb hero images. Re-run this audit to confirm.\n`
writeFileSync('/tmp/audit_report.md', md)

console.log(`✓ Verified. MISMATCH confirmed: ${mm.length} (r2=${r2.length}, muscache=${mc.length})`)
console.log(`  Any 25-cap false positives flipped to OK would show here. OK=${ok.length}`)
console.log(`Report → /tmp/audit_report.md`)
