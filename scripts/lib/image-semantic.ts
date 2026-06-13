// Semantic image-match check: does a stored hero/gallery image depict the SAME
// property as the listing's real Airbnb photos?
//
// Ground truth = airbnb-pp-cli photo set (cached per listing id under os.tmpdir()).
// Match rules:
//   - muscache URL  → UUID substring in real set = OK (definitive)
//   - R2 / other    → dHash(9x8) Hamming <= THRESH vs FULL real set = OK
//
// IMPORTANT: hash the full real set, never a capped sample — capping caused
// false positives (a stay's real #0 may sit beyond the cap).

import sharp from 'sharp'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)
export const SEMANTIC_THRESH = 12 // Hamming bits of 64
const CACHE_DIR = join(tmpdir(), 'us-image-reals')
mkdirSync(CACHE_DIR, { recursive: true })

export async function dHash(buf: Buffer): Promise<bigint> {
  const { data, info } = await sharp(buf).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
  let hash = 0n, bit = 0n
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width - 1; x++) {
      if (data[y * info.width + x] > data[y * info.width + x + 1]) hash |= 1n << bit
      bit++
    }
  return hash
}

export function hamming(a: bigint, b: bigint): number {
  let x = a ^ b, c = 0
  while (x) { x &= x - 1n; c++ }
  return c
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
export function muscacheUuid(url: string): string | null {
  if (!url || !url.includes('muscache.com')) return null
  return url.match(UUID_RE)?.[0].toLowerCase() ?? null
}

export function listingIdFromUrl(url: string): string | null {
  return url?.match(/airbnb\.com\/rooms\/(\d+)/)?.[1] ?? null
}

async function dl(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!r.ok) return null
    const ab = await r.arrayBuffer()
    return ab.byteLength > 5120 ? Buffer.from(ab) : null
  } catch { return null }
}

/** Fetch a listing's real photo URLs via airbnb-pp-cli, cached to tmpdir. */
export async function getAirbnbReals(listingId: string): Promise<string[]> {
  const cache = join(CACHE_DIR, `${listingId}.json`)
  if (existsSync(cache)) {
    try { return JSON.parse(readFileSync(cache, 'utf8')) } catch { /* fall through */ }
  }
  const { stdout } = await execFileAsync('airbnb-pp-cli', ['airbnb-listing', 'get', listingId, '--agent'], { timeout: 60_000, maxBuffer: 12 * 1024 * 1024 })
  const parsed = JSON.parse(stdout.trim())
  const r = parsed.results ?? parsed
  const reals: string[] = (r?.raw_sections?.photo_tour_scrollable_modal?.section?.mediaItems ?? [])
    .filter((m: Record<string, unknown>) => m.__typename === 'Image' && m.baseUrl)
    .map((m: Record<string, unknown>) => m.baseUrl as string)
  writeFileSync(cache, JSON.stringify(reals))
  return reals
}

export interface SemanticVerdict {
  heroSemantic: 'ok' | 'mismatch' | 'missing' | 'unreachable' | 'no_reals'
  heroDist?: number
  galleryBadIndices: number[]
  realCount: number
}

/**
 * Compare a stay's hero + gallery against its real Airbnb photo set.
 * Hashes the FULL real set (no cap) to avoid false positives.
 */
export async function auditStayImageSemantics(stay: {
  imageUrl?: string | null
  galleryImages?: Array<{ imageUrl?: string }>
}, reals: string[]): Promise<SemanticVerdict> {
  if (reals.length === 0) return { heroSemantic: 'no_reals', galleryBadIndices: [], realCount: 0 }
  const realUuids = new Set(reals.map(muscacheUuid).filter(Boolean) as string[])

  // hash ALL reals (parallel batches of 12)
  const realHashes: bigint[] = []
  for (let i = 0; i < reals.length; i += 12) {
    const batch = reals.slice(i, i + 12)
    const got = await Promise.all(batch.map(async u => { const b = await dl(u); return b ? dHash(b) : null }))
    for (const h of got) if (h !== null) realHashes.push(h)
  }
  const bestDist = (h: bigint) => { let b = 99; for (const rh of realHashes) { const d = hamming(h, rh); if (d < b) b = d } return b }

  // hero
  const hero = stay.imageUrl ?? ''
  let heroSemantic: SemanticVerdict['heroSemantic'] = 'ok'
  let heroDist: number | undefined
  if (!hero) heroSemantic = 'missing'
  else {
    const hu = muscacheUuid(hero)
    if (hu) heroSemantic = realUuids.has(hu) ? 'ok' : 'mismatch'
    else {
      const hb = await dl(hero)
      if (!hb) heroSemantic = 'unreachable'
      else { heroDist = bestDist(await dHash(hb)); heroSemantic = heroDist <= SEMANTIC_THRESH ? 'ok' : 'mismatch' }
    }
  }

  // gallery
  const gallery = stay.galleryImages ?? []
  const galleryBadIndices: number[] = []
  for (let i = 0; i < gallery.length; i++) {
    const gb = await dl(gallery[i].imageUrl ?? '')
    if (!gb) { galleryBadIndices.push(i); continue }
    if (bestDist(await dHash(gb)) > SEMANTIC_THRESH) galleryBadIndices.push(i)
  }

  return { heroSemantic, heroDist, galleryBadIndices, realCount: reals.length }
}
