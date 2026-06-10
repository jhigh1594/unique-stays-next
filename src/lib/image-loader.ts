// Custom next/image loader — routes R2 images through the Cloudflare Worker CDN
// (img.uniquestaysusa.com) which serves pre-generated WebP variants by width bucket.

import type { ImageLoader } from 'next/image'

const CDN_HOST = process.env.NEXT_PUBLIC_IMAGE_CDN_HOST || 'img.uniquestaysusa.com'
const FALLBACK = '/api/placeholder-image.svg'

/** Largest pre-generated WebP bucket on the image CDN worker. */
export const CDN_MAX_WIDTH = 1600

const ALLOWED_R2_PREFIXES = ['stays/', 'hero/', 'spokes/', 'media/']
const SAFE_KEY_RE = /^[a-zA-Z0-9_\-./]+$/

// Domains that may serve images without going through the CDN worker.
const ALLOWED_EXTERNAL_SUFFIXES = [
  '.muscache.com',
  '.vrboassets.com',
  '.trvl-media.com',
  '.icdbcdn.com',
  '.orez.io',
  '.wander.com',
  '.vacasa.com',
  '.cloudfront.net',
  '.streamlinevrs.com',
  '.hospitable.com',
  '.squarespace-cdn.com',
  '.wsimg.com',
  '.wixstatic.com',
  '.wp.com',
  '.homesteadmodern.com',
  '.brokenbow.com',
  '.enjoyuniquestays.com',
  'images.unsplash.com',
]

function isR2Host(hostname: string): boolean {
  if (hostname === 'media.uniquestaysusa.com') return true
  if (hostname.endsWith('.r2.dev')) return true
  return false
}

function isAllowedExternal(hostname: string): boolean {
  return ALLOWED_EXTERNAL_SUFFIXES.some(
    (d) => hostname === d || hostname.endsWith(d),
  )
}

/** Extract an R2 object key from a public R2 or media hostname URL. */
export function extractR2Key(src: string): string | null {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return null
  }

  if (!isR2Host(url.hostname)) return null

  const key = url.pathname.replace(/^\/+/, '')
  if (!key || key.includes('..') || !SAFE_KEY_RE.test(key)) return null
  if (!ALLOWED_R2_PREFIXES.some((prefix) => key.startsWith(prefix))) return null

  return key
}

/** Build a CDN URL for a known R2 key (used by next/image loader and LCP preloads). */
export function buildR2CdnUrl(src: string, width: number): string | null {
  const key = extractR2Key(src)
  if (!key) return null

  const params = new URLSearchParams()
  if (width > 0) {
    params.set('w', String(Math.min(Math.round(width), CDN_MAX_WIDTH)))
  }

  const query = params.toString()
  return `https://${CDN_HOST}/${key}${query ? `?${query}` : ''}`
}

const imageLoader: ImageLoader = ({ src, width, quality }) => {
  // Local paths and data URIs — pass through unchanged
  if (src.startsWith('/') || src.startsWith('data:')) return src

  let url: URL
  try {
    url = new URL(src)
  } catch {
    console.warn('[image-loader] Invalid URL, using fallback:', src)
    return FALLBACK
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    console.warn('[image-loader] Blocked non-HTTP protocol:', url.protocol)
    return FALLBACK
  }

  const cdnUrl = buildR2CdnUrl(src, width)
  if (cdnUrl) return cdnUrl

  if (isAllowedExternal(url.hostname)) {
    return src
  }

  console.warn('[image-loader] Unknown domain, passing through:', url.hostname)
  return src
}

export default imageLoader
