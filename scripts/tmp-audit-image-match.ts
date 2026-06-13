// Semantic image-match audit for Airbnb stays.
// Ground truth = airbnb-pp-cli real photo set (muscache baseUrls).
// Hero/gallery verdicts:
//   - muscache hero URL: UUID substring match against real set (instant, definitive)
//   - R2 hero / gallery imgs: dHash (9x8) vs full real set; Hamming <= THRESH = match
//
// Run: npx tsx scripts/tmp-audit-image-match.ts [--pilot slug,slug] [--limit N]
// Caches airbnb-pp-cli output to /tmp/audit_reals/<listingId>.json (resume-safe).
// Writes /tmp/audit_results.json + prints summary.

import sharp from 'sharp'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'

const execFileAsync = promisify(execFile)
const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.uniquestaysusa.com'
const THRESH = 12 // Hamming bits (of 64)
const REALS_DIR = '/tmp/audit_reals'
mkdirSync(REALS_DIR, { recursive: true })

const args = process.argv.slice(2)
function getArg(n: string) { const i = args.indexOf(`--${n}`); return i >= 0 && i < args.length - 1 ? args[i + 1] : undefined }
const pilot = getArg('pilot')?.split(',').map(s => s.trim()).filter(Boolean)
const limit = getArg('limit') ? parseInt(getArg('limit')!, 10) : undefined

// ── dHash ────────────────────────────────────────────────────────
async function dHash(buf: Buffer): Promise<bigint> {
  const { data, info } = await sharp(buf).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
  let hash = 0n, bit = 0n
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width - 1; x++) {
      if (data[y * info.width + x] > data[y * info.width + x + 1]) hash |= (1n << bit)
      bit++
    }
  return hash
}
function hamming(a: bigint, b: bigint): number { let x = a ^ b, c = 0; while (x) { x &= x - 1n; c++ } return c }

async function dl(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!r.ok) return null
    const ab = await r.arrayBuffer()
    return ab.byteLength > 5120 ? Buffer.from(ab) : null
  } catch { return null }
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
function muscacheUuid(url: string): string | null {
  if (!url.includes('muscache.com')) return null
  return url.match(UUID_RE)?.[0].toLowerCase() ?? null
}
function listingIdFromUrl(url: string): string | null { return url.match(/airbnb\.com\/rooms\/(\d+)/)?.[1] ?? null }

// ── airbnb-pp-cli real photos (cached) ───────────────────────────
async function getReals(listingId: string): Promise<string[]> {
  const cache = `${REALS_DIR}/${listingId}.json`
  if (existsSync(cache)) {
    try { return JSON.parse(readFileSync(cache, 'utf8')) } catch { /* fall through */ }
  }
  const { stdout } = await execFileAsync('airbnb-pp-cli', ['airbnb-listing', 'get', listingId, '--agent'], { timeout: 60_000, maxBuffer: 12 * 1024 * 1024 })
  let parsed: any
  try { parsed = JSON.parse(stdout.trim()) } catch { return [] }
  const r = parsed.results ?? parsed
  const reals: string[] = (r?.raw_sections?.photo_tour_scrollable_modal?.section?.mediaItems ?? [])
    .filter((m: any) => m.__typename === 'Image' && m.baseUrl)
    .map((m: any) => m.baseUrl)
  writeFileSync(cache, JSON.stringify(reals))
  return reals
}

interface Stay {
  id: number; slug: string; title: string; platform: string
  affiliateUrl: string; imageUrl: string | null
  galleryImages: Array<{ imageUrl: string }>
}

async function auditStay(stay: Stay) {
  const listingId = listingIdFromUrl(stay.affiliateUrl)
  const out: any = { id: stay.id, slug: stay.slug, title: stay.title, listingId, affiliateUrl: stay.affiliateUrl }
  if (!listingId) { out.skip = 'no listing id'; return out }

  let reals: string[] = []
  try { reals = await getReals(listingId) } catch (e: any) { out.skip = `pp-cli error: ${e.message}`; return out }
  if (reals.length === 0) { out.skip = 'no real photos'; return out }
  out.realCount = reals.length

  const realUuids = new Set(reals.map(muscacheUuid).filter(Boolean) as string[])
  // hash reals (cap at 25; gallery imgs + correct hero map to early reals)
  const toHash = reals.slice(0, 25)
  const realHashes: { idx: number; h: bigint }[] = []
  for (let i = 0; i < toHash.length; i += 10) {
    const batch = toHash.slice(i, i + 10)
    const got = await Promise.all(batch.map(async (u, j) => { const b = await dl(u); return b ? { idx: i + j, h: await dHash(b) } : null }))
    for (const g of got) if (g) realHashes.push(g)
  }

  function bestDist(h: bigint) { let b = 99, bi = -1; for (const rh of realHashes) { const d = hamming(h, rh.h); if (d < b) { b = d; bi = rh.idx } } return { dist: b, idx: bi } }

  // ── HERO ──
  const hero = stay.imageUrl
  if (!hero) { out.heroVerdict = 'MISSING' }
  else {
    const hu = muscacheUuid(hero)
    if (hu) {
      out.heroVerdict = realUuids.has(hu) ? 'OK' : 'MISMATCH'
      out.heroMethod = 'uuid'
    } else {
      const hb = await dl(hero)
      if (!hb) { out.heroVerdict = 'UNREACHABLE'; out.heroMethod = 'r2' }
      else { const { dist, idx } = bestDist(await dHash(hb)); out.heroVerdict = dist <= THRESH ? 'OK' : 'MISMATCH'; out.heroDist = dist; out.heroMatchIdx = idx; out.heroMethod = 'dhash' }
    }
  }

  // ── GALLERY ──
  const g = stay.galleryImages || []
  out.galleryTotal = g.length
  if (g.length === 0) { out.galleryVerdict = 'EMPTY' }
  else {
    const bad: number[] = []
    let worstOk = 0
    for (let i = 0; i < g.length; i++) {
      const gb = await dl(g[i].imageUrl)
      if (!gb) { bad.push(i); continue }
      const { dist } = bestDist(await dHash(gb))
      if (dist > THRESH) bad.push(i); else worstOk = Math.max(worstOk, dist)
    }
    out.galleryBad = bad
    out.galleryBadCount = bad.length
    out.galleryVerdict = bad.length === 0 ? 'OK' : (bad.length === g.length ? 'ALL_MISMATCH' : 'PARTIAL_MISMATCH')
    out.galleryWorstOkDist = worstOk
  }
  return out
}

async function main() {
  const url = `${SERVER}/api/stays?where%5Bplatform%5D%5Bequals%5D=Airbnb&depth=1&limit=500`
  const docs: Stay[] = await fetch(url).then(r => r.json()).then((j: any) => j.docs)
  let stays = docs
  if (pilot) stays = stays.filter(s => pilot.includes(s.slug))
  if (limit) stays = stays.slice(0, limit)
  console.log(`Auditing ${stays.length} Airbnb stays (THRESH=${THRESH})…\n`)

  const results: any[] = []
  for (let i = 0; i < stays.length; i++) {
    const s = stays[i]
    try {
      const r = await auditStay(s)
      results.push(r)
      const hv = r.heroVerdict ?? 'SKIP', gv = r.galleryVerdict ?? 'SKIP'
      const flag = (hv === 'MISMATCH' || hv === 'MISSING' || gv !== 'OK') ? '⚠' : '✓'
      console.log(`${flag} [${i + 1}/${stays.length}] ${s.slug}  hero=${hv} gallery=${gv}${r.galleryBadCount ? `(${r.galleryBadCount}/${r.galleryTotal})` : ''}${r.skip ? ' [' + r.skip + ']' : ''}`)
    } catch (e: any) {
      results.push({ id: s.id, slug: s.slug, error: e.message })
      console.log(`✗ [${i + 1}/${stays.length}] ${s.slug}  ERROR: ${e.message}`)
    }
    writeFileSync('/tmp/audit_results.json', JSON.stringify(results, null, 2))
    // rate-limit airbnb-pp-cli between stays
    if (i < stays.length - 1) await new Promise(r => setTimeout(r, 2200))
  }

  // ── Summary ──
  const audited = results.filter(r => !r.skip && !r.error)
  const heroBad = audited.filter(r => r.heroVerdict === 'MISMATCH' || r.heroVerdict === 'MISSING' || r.heroVerdict === 'UNREACHABLE')
  const heroOk = audited.filter(r => r.heroVerdict === 'OK')
  const galBad = audited.filter(r => r.galleryVerdict !== 'OK')
  console.log(`\n${'═'.repeat(60)}\n  Audited:        ${audited.length} / ${stays.length}\n  Hero OK:        ${heroOk.length}\n  Hero bad:       ${heroBad.length}  (mismatch=${audited.filter(r=>r.heroVerdict==='MISMATCH').length}, missing=${audited.filter(r=>r.heroVerdict==='MISSING').length}, unreachable=${audited.filter(r=>r.heroVerdict==='UNREACHABLE').length})\n  Gallery bad:    ${galBad.length}  (partial=${audited.filter(r=>r.galleryVerdict==='PARTIAL_MISMATCH').length}, all=${audited.filter(r=>r.galleryVerdict==='ALL_MISMATCH').length}, empty=${audited.filter(r=>r.galleryVerdict==='EMPTY').length})`)
  console.log(`\nResults → /tmp/audit_results.json`)
}
main().catch(e => { console.error('Fatal:', e); process.exit(1) })
