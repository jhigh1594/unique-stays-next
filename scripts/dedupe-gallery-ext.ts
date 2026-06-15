// Delete stray non-.jpg image originals that collide on the ext-agnostic variant key.
//
// Background: the image-cdn worker serves -w{N}.webp variants keyed by the original's
// base name WITHOUT extension (variantKey strips the ext). So stays/x/gallery-1.jpg,
// .jpeg, and .png all map to the SAME gallery-1-w1600.webp. When multiple ext originals
// exist, whichever regen-variants processed LAST wins. Alphabetical order is
// .jpeg < .jpg < .png, so a stray .png silently overwrites the correct .jpg variant —
// e.g. sage-canyon gallery-1.png (a trophy photo) replaced the correct cliff-house
// gallery-1.jpg variant.
//
// This script keeps the canonical .jpg (what the DB references) and deletes every other
// ext original for the same slot — but ONLY when a .jpg exists for that slot (safe).
// It then regenerates variants from the surviving .jpg so the worker serves correct bytes.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/dedupe-gallery-ext.ts [--slugs a,b] [--dry-run]
// Requires: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { regenVariants } from './lib/regen-variants'

const DEFAULT_SLUGS = [
  'nevada-city-dome-ca', 'copper-fox-treehouse-vt', 'sage-canyon-cliff-house-co',
  'fox-wood-dome-ar', 'shawnee-forest-dome-il', 'basecamp-treeloft-mo',
  'skydome-hideaway-tx', 'houseboat-sauna-ca', 'indian-river-aframe-mi',
  'houseboat-mill-valley-ca', 'hanksville-cave-home-ut', 'castle-flagstaff-az',
  'bliss-ridge-farm-treehouse-vt', 'willow-treehouse-ny', 'pocono-castle-escape-room-pa',
  'romantic-mountain-dome-nc', 'morristown-barn-silo-vt',
]

const args = process.argv.slice(2)
const getArg = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 && i < args.length - 1 ? args[i + 1] : undefined }
const allMode = args.includes('--all')
const slugs = allMode ? null : (getArg('slugs')?.split(',').map((s) => s.trim()).filter(Boolean) ?? DEFAULT_SLUGS)
const dryRun = args.includes('--dry-run')

const s3 = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '', secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '' },
})
const BUCKET = process.env.R2_BUCKET_NAME || 'uniquestays-media'
const isVariant = (k: string) => /-w\d+\.webp$/.test(k)
const isOriginal = (k: string) => /\.(jpe?g|png)$/i.test(k) && !isVariant(k)

async function listPrefix(prefix: string): Promise<string[]> {
  const out: string[] = []
  let token: string | undefined
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }))
    for (const o of r.Contents ?? []) if (o.Key && isOriginal(o.Key)) out.push(o.Key)
    token = r.NextContinuationToken
  } while (token)
  return out
}

// group originals by slot (base name without ext), keep .jpg, collect strays
function partition(keys: string[]): { keep: string[]; stray: string[] } {
  const bySlot = new Map<string, string[]>()
  for (const k of keys) {
    const base = k.replace(/\.(jpe?g|png)$/i, '')
    ;(bySlot.get(base) ?? bySlot.set(base, []).get(base)!).push(k)
  }
  const keep: string[] = []
  const stray: string[] = []
  for (const [, group] of bySlot) {
    const jpg = group.find((k) => /\.jpg$/i.test(k))
    if (group.length === 1) { keep.push(group[0]); continue }   // only one ext — keep it
    if (!jpg) { keep.push(group[0]); continue }                  // no .jpg — don't delete (avoid orphaning)
    keep.push(jpg)
    stray.push(...group.filter((k) => k !== jpg))
  }
  return { keep, stray }
}

async function main() {
  let delCount = 0
  let regenCount = 0

  if (allMode) {
    console.log('Scanning all originals under stays/ ...')
    const keys = await listPrefix('stays/')
    const { keep, stray } = partition(keys)
    console.log(`Found ${keys.length} originals across ${new Set(keys.map((k) => k.split('/')[1])).size} stays; ${stray.length} strays to delete`)
    if (stray.length) {
      for (const s of stray) console.log(`  ✗ ${s} (${s.split('/').pop()})`)
    }
    if (!dryRun && stray.length) {
      for (let i = 0; i < stray.length; i += 1000) {
        const batch = stray.slice(i, i + 1000)
        await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: batch.map((Key) => ({ Key })) } }))
      }
      delCount = stray.length
    }
    // regen variants for slots that HAD a stray (others already correct); simplest = regen the keep set that shared a slot with a stray
    const strayBases = new Set(stray.map((k) => k.replace(/\.(jpe?g|png)$/i, '')))
    const toRegen = keep.filter((k) => strayBases.has(k.replace(/\.(jpe?g|png)$/i, '')))
    if (!dryRun) for (const k of toRegen) {
      try { const n = await regenVariants(k); regenCount += n; console.log(`  ✓ regen ${k.split('/').pop()} → ${n}`) }
      catch (e) { console.log(`  ✗ regen ${k} — ${(e as Error).message}`) }
    }
    console.log(`\n${'═'.repeat(40)}\n${dryRun ? '[DRY RUN] ' : ''}Deleted ${delCount} strays, regenerated ${regenCount} variants`)
    return
  }

  for (const slug of slugs!) {
    const keys = new Set<string>([...(await listPrefix(`stays/${slug}.`)), ...(await listPrefix(`stays/${slug}/`))])
    const hero = [...keys].filter((k) => k.startsWith(`stays/${slug}.`))
    const gallery = [...keys].filter((k) => k.startsWith(`stays/${slug}/gallery-`))
    const { keep, stray } = partition([...hero, ...gallery])
    if (stray.length) {
      console.log(`${slug}: deleting ${stray.length} stray → ${stray.map((s) => s.split('/').pop()).join(', ')}`)
      if (!dryRun) {
        await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: stray.map((Key) => ({ Key })) } }))
        delCount += stray.length
      }
    }
    // regen variants from the surviving canonical originals
    if (!dryRun) for (const k of keep) {
      try { const n = await regenVariants(k); regenCount += n; console.log(`  ✓ regen ${k.split('/').pop()} → ${n}`) }
      catch (e) { console.log(`  ✗ regen ${k} — ${(e as Error).message}`) }
    }
  }
  console.log(`\n${'═'.repeat(40)}\n${dryRun ? '[DRY RUN] ' : ''}Deleted ${delCount} strays, regenerated ${regenCount} variants`)
}
main().catch((e) => { console.error('Fatal:', e); process.exit(1) })
