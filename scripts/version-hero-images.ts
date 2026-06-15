// Attach a content-version param (?v=<hash>) to stored hero imageUrls so the
// image-cdn worker's immutable cache busts when bytes change.
//
// Background: re-publishing uploads new bytes to the SAME R2 key. The worker replies
// `Cache-Control: immutable`, so the CDN edge + browsers serve the old bytes for a
// year. The next/image loader forwards ?v= to the worker URL (src/lib/image-loader.ts),
// so a changed version = cache miss everywhere.
//
// Idempotent: hashes the CURRENT stored bytes, so re-running with unchanged bytes
// produces the same ?v= (no DB write, no re-churn).
//
// Run: node --env-file=.env.local --import tsx/esm scripts/version-hero-images.ts [--slugs a,b] [--site https://...] [--dry-run]
// Requires: DATABASE_URI, PAYLOAD_SECRET, REVALIDATE_SECRET
//
// NOTE: payload.update fires Stays.afterChange → revalidateTag, but locally that hook
// points at NEXT_PUBLIC_SERVER_URL (localhost). We revalidate the --site (prod) URL
// explicitly afterward so the public pages regenerate.

import { getPayload } from 'payload'
import config from '@payload-config'
import { imageVersion } from './lib/stay-images'

const HEROES_FIXED_0613 = [
  'nevada-city-dome-ca', 'copper-fox-treehouse-vt', 'sage-canyon-cliff-house-co',
  'fox-wood-dome-ar', 'shawnee-forest-dome-il', 'basecamp-treeloft-mo',
  'skydome-hideaway-tx', 'houseboat-sauna-ca', 'indian-river-aframe-mi',
  'houseboat-mill-valley-ca', 'hanksville-cave-home-ut', 'castle-flagstaff-az',
  'bliss-ridge-farm-treehouse-vt', 'willow-treehouse-ny', 'pocono-castle-escape-room-pa',
  'romantic-mountain-dome-nc', 'morristown-barn-silo-vt',
]

const args = process.argv.slice(2)
const getArg = (n: string) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && i < args.length - 1 ? args[i + 1] : undefined
}
const slugs = getArg('slugs')?.split(',').map((s) => s.trim()).filter(Boolean) ?? HEROES_FIXED_0613
const site = getArg('site') ?? 'https://www.uniquestaysusa.com'
const dryRun = args.includes('--dry-run')

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!r.ok) return null
    const b = Buffer.from(await r.arrayBuffer())
    return b.byteLength > 5120 ? b : null
  } catch {
    return null
  }
}

function baseWithoutQuery(url: string): string {
  const u = new URL(url)
  u.search = ''
  return u.toString()
}

async function revalidateProd(tag: string) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    console.warn('⚠ REVALIDATE_SECRET not set — page will refresh via ISR within 24h')
    return false
  }
  try {
    const r = await fetch(`${site}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ tag }),
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) {
      console.warn(`⚠ revalidate ${tag}: ${r.status} ${await r.text()}`)
      return false
    }
    return true
  } catch (err) {
    console.warn(`⚠ revalidate ${tag} failed: ${(err as Error).message}`)
    return false
  }
}

async function main() {
  const payload = await getPayload({ config })
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Versioning ${slugs.length} hero imageUrl(s) → ${site}\n`)
  const updated: string[] = [], skipped: string[] = [], failed: string[] = []

  for (const slug of slugs) {
    const res = await payload.find({ collection: 'stays', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const stay = res.docs[0] as any
    if (!stay) { console.log(`✗ ${slug}: not found`); failed.push(slug); continue }
    const current = stay.imageUrl as string | undefined
    if (!current) { console.log(`✗ ${slug}: no imageUrl`); failed.push(slug); continue }

    const base = baseWithoutQuery(current)
    const buf = await fetchBytes(base)
    if (!buf) { console.log(`✗ ${slug}: could not fetch ${base}`); failed.push(slug); continue }

    const v = imageVersion(buf)
    const next = `${base}?v=${v}`
    if (current === next) { console.log(`⊘ ${slug}: already versioned (${v})`); skipped.push(slug); continue }

    if (dryRun) { console.log(`⊘ ${slug}: would set ${next}`); continue }
    await payload.update({ collection: 'stays', id: stay.id, data: { imageUrl: next }, overrideAccess: true })
    console.log(`✓ ${slug}: ${next}`)
    updated.push(slug)
  }

  if (!dryRun && updated.length) {
    console.log('\nRevalidating prod pages…')
    await revalidateProd('stays')
    for (const s of updated) await revalidateProd(`stays:${s}`)
  }

  console.log(`\n${'═'.repeat(50)}\nUpdated: ${updated.length} | Skipped: ${skipped.length} | Failed: ${failed.length}`)
  if (failed.length) console.log(`Failed: ${failed.join(', ')}`)
  await payload.db.pool.end()
}
main().catch((e) => { console.error('Fatal:', e); process.exit(1) })
