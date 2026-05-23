// Image download, validation, and R2 upload module
// Downloads listing photos, validates content type via sharp, uploads to R2

import { uploadToR2 } from './r2.js'
import sharp from 'sharp'

const RETRY_COUNT = 3
const MIN_IMAGE_BYTES = 10240 // 10KB — filter thumbnails/logos

export interface GalleryEntry {
  imageUrl: string
}

async function fetchWithRetry(url: string, retries = RETRY_COUNT): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (res.ok) return res
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000))
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500))
    }
  }
  throw new Error('Max retries')
}

async function validateImage(buffer: Buffer): Promise<string> {
  // sharp processing rejects non-images (SVG/HTML/polyglot files)
  const metadata = await sharp(buffer).metadata()
  if (!metadata.format || !metadata.width || !metadata.height) {
    throw new Error(`Invalid image: no recognizable format`)
  }
  const contentType = `image/${metadata.format === 'jpeg' ? 'jpeg' : metadata.format}`
  return contentType
}

export async function downloadAndUploadImage(
  imageUrl: string,
  slug: string,
  index: number,
): Promise<GalleryEntry | null> {
  try {
    const res = await fetchWithRetry(imageUrl)
    const buffer = Buffer.from(await res.arrayBuffer())

    // Filter tiny images (thumbnails, logos)
    if (buffer.length < MIN_IMAGE_BYTES) {
      return null
    }

    // Validate content type — rejects SVG with JS, HTML pages, etc.
    const contentType = await validateImage(buffer)

    const ext = contentType.split('/')[1] ?? 'jpg'
    const key = `stays/${slug}/gallery-${index}.${ext}`

    const result = await uploadToR2(key, buffer, contentType)

    return { imageUrl: result.url }
  } catch {
    return null
  }
}

export async function processGalleryImages(
  photoUrls: string[],
  slug: string,
  limit: number,
  onProgress?: (url: string, success: boolean) => void,
): Promise<GalleryEntry[]> {
  const entries: GalleryEntry[] = []

  for (let i = 0; i < Math.min(photoUrls.length, limit); i++) {
    const entry = await downloadAndUploadImage(photoUrls[i], slug, entries.length)
    if (entry) {
      entries.push(entry)
    }
    onProgress?.(photoUrls[i], entry !== null)
  }

  return entries
}
