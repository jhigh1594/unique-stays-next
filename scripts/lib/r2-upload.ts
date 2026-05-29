// Upload image buffers to Cloudflare R2
// Requires env: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_URL

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

function getPublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL || ''
  return `${base}/${key}`
}

export interface UploadResult {
  key: string
  url: string
}

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<UploadResult> {
  const s3 = getClient()
  await s3.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))

  return { key, url: getPublicUrl(key) }
}
