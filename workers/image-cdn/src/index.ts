// Cloudflare Worker: Image CDN for R2 with pre-generated WebP variants
// Routes width requests to nearest pre-generated size variant.
// Free tier: 100k req/day.

export interface Env {
  R2: R2Bucket
}

// Allowed R2 key prefixes — block path traversal
const ALLOWED_PREFIXES = ['stays/', 'hero/', 'spokes/', 'media/']
const SAFE_KEY_RE = /^[a-zA-Z0-9_\-./]+$/

function sanitizeKey(raw: string): string | null {
  let decoded: string
  try { decoded = decodeURIComponent(raw) } catch { return null }
  if (decoded.includes('..') || !SAFE_KEY_RE.test(decoded)) return null
  if (!ALLOWED_PREFIXES.some((p) => decoded.startsWith(p))) return null
  return decoded
}

// Width buckets matching the pre-generation script
const WIDTH_BUCKETS = [400, 800, 1200, 1600]

function nearestBucket(width: number): number {
  for (const bucket of WIDTH_BUCKETS) {
    if (width <= bucket) return bucket
  }
  return 0 // original
}

function variantKey(originalKey: string, bucket: number): string {
  const lastDot = originalKey.lastIndexOf('.')
  if (lastDot === -1) return `${originalKey}-w${bucket}.webp`
  const base = originalKey.slice(0, lastDot)
  return `${base}-w${bucket}.webp`
}

const CACHE_HEADERS: HeadersInit = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'CDN-Cache-Control': 'public, max-age=31536000, immutable',
  'Vary': 'Accept',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Health check
    if (url.pathname === '/health') {
      return new Response('ok', { status: 200 })
    }

    // Extract and sanitize R2 key from path
    const rawKey = url.pathname.slice(1) // strip leading /
    if (!rawKey) {
      return new Response('Missing key', { status: 400 })
    }
    const key = sanitizeKey(rawKey)
    if (!key) {
      return new Response('Invalid key', { status: 400 })
    }

    // Parse width param
    const widthParam = url.searchParams.get('w')
    const width = widthParam ? parseInt(widthParam, 10) : 0

    // No width → original. Oversized requests clamp to max WebP bucket (not full JPEG).
    if (!width) {
      return serveFromR2(env, key, 'original')
    }

    const maxBucket = WIDTH_BUCKETS[WIDTH_BUCKETS.length - 1]
    const clampedWidth = Math.min(width, maxBucket)
    const bucket = nearestBucket(clampedWidth)
    if (bucket === 0) {
      return serveFromR2(env, key, 'original')
    }

    // Try pre-generated variant first
    const vKey = variantKey(key, bucket)
    const variant = await env.R2.get(vKey)
    if (variant) {
      return new Response(variant.body, {
        status: 200,
        headers: {
          ...CACHE_HEADERS,
          'Content-Type': 'image/webp',
          'X-Variant': vKey,
        },
      })
    }

    // Fallback to original
    return serveFromR2(env, key, 'original')
  },
} satisfies ExportedHandler<Env>

async function serveFromR2(env: Env, key: string, label: string): Promise<Response> {
  const object = await env.R2.get(key)
  if (!object) {
    return new Response('Not found', { status: 404 })
  }

  const headers = new Headers()
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('X-Source', label)
  object.writeHttpMetadata(headers)

  return new Response(object.body, { status: 200, headers })
}
