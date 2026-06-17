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

// Version query param forwarded from the source imageUrl to the CDN URL.
// Re-publishing an image uploads new bytes to the SAME R2 key — the worker replies
// with `Cache-Control: immutable`, so the CDN edge + browsers cache the old bytes
// for a year under that identical URL. Appending a content version (`?v=<hash>`)
// changes the request URL on every real change, forcing a cache miss at the edge
// and in browsers. Without this, overwriting bytes in place is an invisible update.
const VERSION_PARAM = 'v'
const VERSION_RE = /^[A-Za-z0-9_.\-]{1,40}$/

function extractVersion(src: string): string | null {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return null
  }
  const v = url.searchParams.get(VERSION_PARAM) ?? url.searchParams.get('rev')
  return v && VERSION_RE.test(v) ? v : null
}

export type ToCdnUrlOptions = {
  /** Desired render width. 0 (default) omits `?w` and serves the original bytes. */
  width?: number
  /** Forward the source `?v`/`?rev` content-version param. Default true. */
  keepVersion?: boolean
}

/**
 * Map a stored image URL to the image CDN (img.uniquestaysusa.com).
 *
 * THE shared R2→CDN rewrite — used by the next/image loader, every OpenGraph
 * `images[].url`, and every JSON-LD `image` field. Other teams reuse this;
 * do NOT re-implement R2→CDN mapping per page.
 *
 * Returns the CDN URL when `src` is an R2-hosted image whose object key lives
 * under an allowed prefix (`stays/` `hero/` `spokes/` `media/`) — i.e. a key
 * the Cloudflare worker can serve. Returns `null` otherwise; callers should
 * then keep the original `src` (it is either an allowed external CDN, or an
 * R2 image whose bare key still needs manual migration to an allowed prefix —
 * the worker rejects bare keys with HTTP 400, so we never rewrite them).
 *
 * @example
 *   toCdnUrl('https://pub-…r2.dev/spokes/unique.jpg', { width: 1200 })
 *   // → 'https://img.uniquestaysusa.com/spokes/unique.jpg?w=1200'
 */
export function toCdnUrl(
  src: string,
  { width = 0, keepVersion = true }: ToCdnUrlOptions = {},
): string | null {
  const key = extractR2Key(src)
  if (!key) return null

  const params = new URLSearchParams()
  if (width > 0) {
    params.set('w', String(Math.min(Math.round(width), CDN_MAX_WIDTH)))
  }
  if (keepVersion) {
    const version = extractVersion(src)
    if (version) params.set(VERSION_PARAM, version)
  }

  const query = params.toString()
  return `https://${CDN_HOST}/${key}${query ? `?${query}` : ''}`
}

/**
 * toCdnUrl, falling back to the original `src` when mapping isn't possible.
 * Use for OG/JSON-LD fields that must always carry a URL. Returns `undefined`
 * for empty/null input so the field is simply omitted.
 */
export function toCdnUrlOrRaw(
  src: string | null | undefined,
  opts?: ToCdnUrlOptions,
): string | undefined {
  if (!src) return undefined
  return toCdnUrl(src, opts) ?? src
}

/** Build a CDN URL for a known R2 key (used by next/image loader and LCP preloads). */
export function buildR2CdnUrl(src: string, width: number): string | null {
  return toCdnUrl(src, { width })
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

  if (isR2Host(url.hostname)) {
    // Known R2 host, but the object key isn't under an allowed prefix — the
    // worker would reply 400. Serve the raw URL and flag it for manual
    // migration to an allowed prefix (see toCdnUrl). This is NOT an unknown
    // domain; it is a known-host / unmappable-key case.
    console.warn('[image-loader] R2 image has unmappable key, serving raw:', src)
    return src
  }

  if (isAllowedExternal(url.hostname)) {
    return src
  }

  console.warn('[image-loader] Unknown domain, passing through:', url.hostname)
  return src
}

export default imageLoader
