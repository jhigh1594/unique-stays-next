// Migrate bare-keyed media originals under the `media/` prefix so the image-cdn
// worker can serve them, and (re)generate their WebP width variants.
//
// WHY: media objects were uploaded with NO prefix (bare filename, e.g.
// `skydome-hideaway-tx.jpg`). The Cloudflare worker only serves keys under
// `stays/ hero/ spokes/ media/`, so it 400s on bare keys and journal/stay
// heroes can't route through img.uniquestaysusa.com. This copies each bare
// original to `media/<filename>` (ADDITIVE — the bare original is left in
// place) and regenerates `media/<base>-w{400,800,1200,1600}.webp` variants.
//
// After this + setting the media collection s3 `prefix: 'media'` in
// payload.config.ts, Payload builds heroImage.url as `media/<filename>` and
// toCdnUrl() routes it through the CDN automatically.
//
// Run: node --env-file=.env.local --import tsx/esm scripts/migrate-media-to-prefix.ts
// Requires: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { regenVariants } from './lib/regen-variants'

const ALLOWED_PREFIXES = ['stays/', 'hero/', 'spokes/', 'media/']
const isVariant = (k: string) => /-w\d+\.webp$/.test(k)
const isOriginal = (k: string) => /\.(jpe?g|png|webp|gif|tiff?)$/i.test(k) && !isVariant(k)
const isBare = (k: string) => !ALLOWED_PREFIXES.some((p) => k.startsWith(p))

const s3 = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})
const BUCKET = process.env.R2_BUCKET_NAME || 'uniquestays-media'

function inferContentType(key: string): string {
  const ext = key.toLowerCase().split('.').pop() ?? ''
  return (
    { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] ??
    'application/octet-stream'
  )
}

async function listBareOriginals(): Promise<string[]> {
  const out: string[] = []
  let token: string | undefined
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token }))
    for (const o of r.Contents ?? []) {
      if (o.Key && isOriginal(o.Key) && isBare(o.Key)) out.push(o.Key)
    }
    token = r.NextContinuationToken
  } while (token)
  return out
}

async function exists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function main() {
  const keys = await listBareOriginals()
  console.log(`Found ${keys.length} bare media originals to migrate.\n`)
  let copied = 0
  let skipped = 0
  let variants = 0
  for (const bare of keys) {
    const dest = `media/${bare}`
    try {
      const get = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: bare }))
      const buf = Buffer.from(await get.Body!.transformToByteArray())
      const contentType = get.ContentType || inferContentType(bare)

      if (await exists(dest)) {
        console.log(`→ ${dest} already exists, skipping copy`)
        skipped++
      } else {
        await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: dest, Body: buf, ContentType: contentType }))
        console.log(`✓ copied ${bare} → ${dest}`)
        copied++
      }
      const n = await regenVariants(dest, buf)
      variants += n
      console.log(`  + ${n} variants regenerated`)
    } catch (e) {
      console.log(`✗ ${bare} — ${(e as Error).message}`)
    }
  }
  console.log(`\n${'═'.repeat(50)}\nDone: ${copied} copied, ${skipped} already present, ${variants} variants generated.`)
  console.log('Next: set media s3 prefix in payload.config.ts, restart, revalidate.')
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1) })
