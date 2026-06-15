// Force-regenerate the 4 pre-generated WebP width variants for an R2 image.
//
// The image-cdn worker SERVES these -w{400,800,1200,1600}.webp variants for ?w=
// requests (preferred over the original). If an original is re-uploaded without
// regenerating its variants, the worker keeps serving the stale variant — the
// exact bug that hid the 17 corrected Airbnb heroes. Call this after every
// uploadToR2 of a hero/gallery original.
//
// Pass the uploaded `buffer` to skip an R2 re-download.

import sharp from 'sharp'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

const WIDTHS = [400, 800, 1200, 1600]
const WEBP_QUALITY = 80

let client: S3Client | null = null

function getClient(): S3Client {
  if (!client) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not set')
    client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    })
  }
  return client
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME || 'uniquestays-media'
}

function variantKey(originalKey: string, width: number): string {
  const lastDot = originalKey.lastIndexOf('.')
  const base = lastDot === -1 ? originalKey : originalKey.slice(0, lastDot)
  return `${base}-w${width}.webp`
}

/** Overwrite the 4 width variants for `originalKey`. Returns count written. */
export async function regenVariants(originalKey: string, buffer?: Buffer): Promise<number> {
  let buf = buffer
  if (!buf) {
    const get = await getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: originalKey }))
    buf = Buffer.from(await get.Body!.transformToByteArray())
  }
  let n = 0
  for (const width of WIDTHS) {
    const webp = await sharp(buf)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
    await getClient().send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: variantKey(originalKey, width),
      Body: webp,
      ContentType: 'image/webp',
    }))
    n++
  }
  return n
}
