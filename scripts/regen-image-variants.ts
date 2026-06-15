// FORCE-regenerate WebP width variants for specific stays' originals (hero + gallery).
//
// Why: the image-cdn worker serves pre-generated -w{400,800,1200,1600}.webp variants
// for ?w= requests (preferred over the original). generate-image-variants.ts SKIPS
// existing variants, so it cannot repair variants built from an outdated original.
// This script OVERWRITES them. It is the repair tool used for the 17 corrected
// Airbnb heroes (2026-06-14); the reusable engine lives in scripts/lib/regen-variants.ts.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/regen-image-variants.ts [--slugs a,b]
// Requires: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
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
const getArg = (n: string) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && i < args.length - 1 ? args[i + 1] : undefined
}
const slugs = getArg('slugs')?.split(',').map((s) => s.trim()).filter(Boolean) ?? DEFAULT_SLUGS

const s3 = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
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

async function main() {
  let total = 0
  for (const slug of slugs) {
    const keys = new Set<string>([...(await listPrefix(`stays/${slug}.`)), ...(await listPrefix(`stays/${slug}/`))])
    const hero = [...keys].filter((k) => k.startsWith(`stays/${slug}.`))
    const gallery = [...keys].filter((k) => k.startsWith(`stays/${slug}/gallery-`))
    const targets = [...hero, ...gallery]
    if (!targets.length) { console.log(`✗ ${slug}: no originals found`); continue }
    for (const k of targets) {
      try { const n = await regenVariants(k); total += n; console.log(`✓ ${slug}: ${k} → ${n} variants`) }
      catch (e) { console.log(`✗ ${slug}: ${k} — ${(e as Error).message}`) }
    }
  }
  console.log(`\n${'═'.repeat(40)}\nRegenerated ${total} variants across ${slugs.length} slugs`)
}
main().catch((e) => { console.error('Fatal:', e); process.exit(1) })
