// Custom next/image loader — routes R2 images through
// Cloudflare Worker CDN (img.uniquestaysusa.com) instead of Vercel _next/image.
// Local paths and allowed external domains pass through; everything else gets a fallback.

import type { ImageLoader } from 'next/image'

const CDN_HOST = process.env.NEXT_PUBLIC_IMAGE_CDN_HOST || 'img.uniquestaysusa.com'
const FALLBACK = '/api/placeholder-image.svg'

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

function isR2Url(hostname: string): boolean {
  if (hostname === 'media.uniquestaysusa.com') return true
  if (hostname.endsWith('.r2.dev')) return true
  return false
}

function isAllowedExternal(hostname: string): boolean {
  return ALLOWED_EXTERNAL_SUFFIXES.some(
    (d) => hostname === d || hostname.endsWith(d),
  )
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

  // Only allow http/https protocols
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    console.warn('[image-loader] Blocked non-HTTP protocol:', url.protocol)
    return FALLBACK
  }

  // R2-hosted images: pass through directly.
  // CDN worker (img.uniquestaysusa.com) returns 400 — pass R2 public URLs
  // through unchanged so images actually load. Re-enable CDN routing when
  // the worker is fixed.
  if (isR2Url(url.hostname)) {
    return src
  }

  // Allowed external CDNs: pass through as-is
  if (isAllowedExternal(url.hostname)) {
    return src
  }

  // Pass through instead of blocking — showing a potentially broken image is better
  // than hiding it with a placeholder. The audit system flags non-R2 URLs for migration.
  console.warn('[image-loader] Unknown domain, passing through:', url.hostname)
  return src
}

export default imageLoader
