// Cloudflare R2 upload module — S3-compatible replacement for @vercel/blob
// Uses @aws-sdk/client-s3 to upload images to R2 with zero egress costs

import {
  S3Client,
  PutObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'uniquestays-media'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev`

let _client: S3Client | null = null

function getClient(): S3Client {
  if (_client) return _client
  const config: S3ClientConfig = {
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  }
  _client = new S3Client(config)
  return _client
}

export interface R2UploadResult {
  url: string
  key: string
}

/**
 * Upload a buffer to Cloudflare R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<R2UploadResult> {
  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  const url = `${R2_PUBLIC_URL}/${key}`
  return { url, key }
}

/**
 * Get the base public URL for constructing image URLs.
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Check if R2 is configured (all required env vars present).
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)
}
