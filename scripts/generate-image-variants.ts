// Pre-generate WebP image variants for R2 bucket
// Reads all images under stays/ prefix, generates 4 width variants (400/800/1200/1600),
// uploads as WebP with -w{N}.webp suffix alongside originals.
//
// Run: pnpm generate-image-variants
// Requires: R2 env vars in .env.local (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME)

import sharp from 'sharp'
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

const WIDTHS = [400, 800, 1200, 1600]
const WEBP_QUALITY = 80
const CONCURRENCY = 3

function getClient(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not set')

  return new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME || 'uniquestays-media'
}

function isVariant(key: string): boolean {
  return /-w\d+\.webp$/.test(key)
}

function isImage(key: string): boolean {
  return /\.(jpe?g|png|webp|gif|tiff?)$/i.test(key)
}

function variantKey(original: string, width: number): string {
  const lastDot = original.lastIndexOf('.')
  const base = lastDot === -1 ? original : original.slice(0, lastDot)
  return `${base}-w${width}.webp`
}

async function listKeys(s3: S3Client, prefix: string): Promise<string[]> {
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: getBucket(),
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })
    const resp = await s3.send(cmd)
    for (const obj of resp.Contents ?? []) {
      if (obj.Key && isImage(obj.Key) && !isVariant(obj.Key)) {
        keys.push(obj.Key)
      }
    }
    continuationToken = resp.NextContinuationToken
  } while (continuationToken)

  return keys
}

async function checkVariantExists(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Range: 'bytes=0-0', // just check existence, don't download
    }))
    return true
  } catch {
    return false
  }
}

async function generateVariants(
  s3: S3Client,
  originalKey: string,
): Promise<{ generated: number; skipped: number }> {
  let generated = 0
  let skipped = 0

  // Download original
  const getResp = await s3.send(new GetObjectCommand({
    Bucket: getBucket(),
    Key: originalKey,
  }))
  const buffer = Buffer.from(await getResp.Body!.transformToByteArray())

  for (const width of WIDTHS) {
    const vKey = variantKey(originalKey, width)

    // Skip if variant already exists
    if (await checkVariantExists(s3, vKey)) {
      skipped++
      continue
    }

    // Generate WebP variant
    const webp = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // Upload variant
    await s3.send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: vKey,
      Body: webp,
      ContentType: 'image/webp',
    }))

    generated++
  }

  return { generated, skipped }
}

async function processBatch(
  s3: S3Client,
  keys: string[],
  offset: number,
): Promise<{ generated: number; skipped: number; errors: number }> {
  let generated = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const num = offset + i + 1
    process.stdout.write(`[${num}] ${key} ... `)

    try {
      const result = await generateVariants(s3, key)
      generated += result.generated
      skipped += result.skipped
      console.log(`✓ ${result.generated} new, ${result.skipped} cached`)
    } catch (err) {
      errors++
      console.log(`✗ ${(err as Error).message}`)
    }
  }

  return { generated, skipped, errors }
}

async function main() {
  const prefixes = process.argv.slice(2)
  const scanPrefixes = prefixes.length > 0 ? prefixes : ['stays/', 'hero/', 'spokes/']

  console.log('🖼️  R2 Image Variant Generator')
  console.log(`   Widths: ${WIDTHS.join(', ')}px`)
  console.log(`   Format: WebP @ Q${WEBP_QUALITY}`)
  console.log(`   Prefixes: ${scanPrefixes.join(', ')}`)
  console.log()

  const s3 = getClient()
  let totalGenerated = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const prefix of scanPrefixes) {
    console.log(`Scanning ${prefix} ...`)
    const keys = await listKeys(s3, prefix)
    console.log(`Found ${keys.length} original images\n`)

    // Process in batches of CONCURRENCY
    for (let i = 0; i < keys.length; i += CONCURRENCY) {
      const batch = keys.slice(i, i + CONCURRENCY)
      const result = await processBatch(s3, batch, i)
      totalGenerated += result.generated
      totalSkipped += result.skipped
      totalErrors += result.errors
    }
    console.log()
  }

  console.log('─'.repeat(40))
  console.log(`Done! ${totalGenerated} variants generated, ${totalSkipped} cached, ${totalErrors} errors`)
}

main().catch(console.error)
