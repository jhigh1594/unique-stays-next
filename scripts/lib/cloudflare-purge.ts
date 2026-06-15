// Best-effort Cloudflare edge-cache purge for image-cdn worker URLs.
//
// Image versioning (scripts/lib/stay-images.ts) is the primary cache-bust: a new
// `?v=` makes the edge + browser re-fetch. This purge is secondary — it clears
// the *bare-URL* cache (no query) so any consumer still holding an old, query-less
// URL (external links, stale HTML in a feed) also refreshes.
//
// No-op until CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID are provisioned. The R2
// S3 credentials (R2_ACCESS_KEY_ID) are NOT sufficient — cache purge needs a
// Zone API token with the "Cache Purge" permission.

const IMG_HOST = process.env.NEXT_PUBLIC_IMAGE_CDN_HOST || 'img.uniquestaysusa.com'

export interface PurgeStatus {
  purged: boolean
  reason?: 'no-credentials' | 'empty' | 'error'
  detail?: string
}

/**
 * Purge bare-URL cache entries for R2 keys (e.g. `stays/sage-canyon-cliff-house-co.jpg`).
 * Silently no-ops without credentials. Cloudflare caps `files` at 30 per request.
 */
export async function purgeImageKeys(keys: string[]): Promise<PurgeStatus> {
  const token = process.env.CLOUDFLARE_API_TOKEN
  const zone = process.env.CLOUDFLARE_ZONE_ID
  if (!token || !zone) return { purged: false, reason: 'no-credentials' }
  if (keys.length === 0) return { purged: false, reason: 'empty' }

  const files = keys.map((k) => `https://${IMG_HOST}/${k}`)
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
        signal: AbortSignal.timeout(15000),
      },
    )
    if (!res.ok) {
      const detail = await res.text()
      console.warn(`[cloudflare-purge] ${res.status}: ${detail}`)
      return { purged: false, reason: 'error', detail }
    }
    return { purged: true }
  } catch (err) {
    const detail = (err as Error).message
    console.warn('[cloudflare-purge] failed:', detail)
    return { purged: false, reason: 'error', detail }
  }
}
