// Fix wrong-property hero images: re-source from airbnb-pp-cli real photo #0.
// Reads cached real-photo sets from /tmp/audit_reals/<listingId>.json (no new scraping).
// Uploads to R2 stays/{slug}.{ext}, updates Payload imageUrl.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/tmp-fix-heroes.ts [--pilot slug,slug] [--dry-run]
// Requires: DATABASE_URI, PAYLOAD_SECRET, R2_*, CLOUDFLARE_ACCOUNT_ID

import { getPayload } from 'payload'
import config from '@payload-config'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { uploadToR2 } from './lib/r2-upload'
import { withVersion } from './lib/stay-images'
import { purgeImageKeys } from './lib/cloudflare-purge'
import { regenVariants } from './lib/regen-variants'

const REALS_DIR = '/tmp/audit_reals'
const SLUGS = [
  'nevada-city-dome-ca', 'copper-fox-treehouse-vt', 'sage-canyon-cliff-house-co',
  'fox-wood-dome-ar', 'shawnee-forest-dome-il', 'basecamp-treeloft-mo',
  'skydome-hideaway-tx', 'houseboat-sauna-ca', 'indian-river-aframe-mi',
  'houseboat-mill-valley-ca', 'hanksville-cave-home-ut', 'castle-flagstaff-az',
  'bliss-ridge-farm-treehouse-vt', 'willow-treehouse-ny', 'pocono-castle-escape-room-pa',
  'romantic-mountain-dome-nc', 'morristown-barn-silo-vt',
]

const args = process.argv.slice(2)
const getArg = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 && i < args.length - 1 ? args[i + 1] : undefined }
const pilot = getArg('pilot')?.split(',').map(s => s.trim()).filter(Boolean)
const dryRun = args.includes('--dry-run')
const slugs = pilot ?? SLUGS

async function dl(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!r.ok) return null
    const b = Buffer.from(await r.arrayBuffer())
    return b.byteLength > 5120 ? b : null
  } catch { return null }
}

async function main() {
  const payload = await getPayload({ config })
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Fixing ${slugs.length} heroes…\n`)
  const done: string[] = [], failed: string[] = []

  for (const slug of slugs) {
    const res = await payload.find({ collection: 'stays', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const stay = res.docs[0] as any
    if (!stay) { console.log(`✗ ${slug}: not found`); failed.push(slug); continue }
    const lid = (stay.affiliateUrl as string)?.match(/rooms\/(\d+)/)?.[1]
    if (!lid) { console.log(`✗ ${slug}: no listing id`); failed.push(slug); continue }
    let reals: string[]
    try { reals = JSON.parse(readFileSync(`${REALS_DIR}/${lid}.json`, 'utf8')) } catch { console.log(`✗ ${slug}: no cached reals for ${lid}`); failed.push(slug); continue }

    // pick first real photo that downloads + validates
    let picked: { url: string; buf: Buffer; ext: string } | null = null
    for (let i = 0; i < Math.min(reals.length, 6); i++) {
      const buf = await dl(reals[i])
      if (!buf) continue
      try {
        const m = await sharp(buf).metadata()
        if (!m.format || !m.width || !m.height) continue
        const ext = (m.format === 'jpeg' ? 'jpg' : m.format)
        picked = { url: reals[i], buf, ext }
        break
      } catch { /* next */ }
    }
    if (!picked) { console.log(`✗ ${slug}: no downloadable real photo`); failed.push(slug); continue }

    const key = `stays/${slug}.${picked.ext}`
    const contentType = picked.ext === 'jpg' ? 'image/jpeg' : `image/${picked.ext}`

    if (dryRun) {
      console.log(`⊘ ${slug}: would upload ${key} (real#${reals.indexOf(picked.url)})`)
      continue
    }
    const up = await uploadToR2(key, picked.buf, contentType)
    await regenVariants(key, picked.buf) // refresh -w{N}.webp variants the worker serves
    await purgeImageKeys([key]) // bust CF edge for the bare key (versioning covers ?w= variants)
    const imageUrl = withVersion(up.url, picked.buf)
    await payload.update({ collection: 'stays', id: stay.id, data: { imageUrl }, overrideAccess: true })
    console.log(`✓ ${slug}: ${imageUrl}  (real#${reals.indexOf(picked.url)})`)
    done.push(slug)
  }

  console.log(`\n${'═'.repeat(50)}\nFixed: ${done.length} | Failed: ${failed.length}`)
  if (failed.length) console.log(`Failed: ${failed.join(', ')}`)
  await payload.db.pool.end()
}
main().catch(e => { console.error('Fatal:', e); process.exit(1) })
