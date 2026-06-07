// Shared image URL validation and migration utilities
// Used by audit system, enrichment pipeline, and fix scripts

export interface LivenessResult {
  live: boolean
  statusCode?: number
  contentType?: string
  contentLength?: number
  isImage: boolean
  error?: string
}

const R2_DOMAINS = ['.r2.dev', 'media.uniquestaysusa.com']

/**
 * Check whether a URL returns a valid image response via HEAD request.
 * Timeout: 10 seconds. Min size: 10KB.
 */
export async function checkImageUrlLiveness(url: string): Promise<LivenessResult> {
  if (!url || !url.startsWith('https://')) {
    return { live: false, isImage: false, error: 'empty or non-https URL' }
  }

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    })

    const statusCode = res.status
    const contentType = res.headers.get('content-type') ?? ''
    const contentLength = parseInt(res.headers.get('content-length') ?? '0', 10)

    if (!res.ok) {
      return { live: false, statusCode, contentType, contentLength, isImage: false, error: `HTTP ${statusCode}` }
    }

    const isImage = contentType.startsWith('image/')
    const live = isImage && contentLength >= 10240

    return { live, statusCode, contentType, contentLength, isImage, error: live ? undefined : isImage ? 'image too small' : `not an image: ${contentType}` }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { live: false, isImage: false, error }
  }
}

/**
 * Check whether a URL is hosted on Cloudflare R2 (our CDN).
 */
export function isR2Url(url: string): boolean {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname
    return R2_DOMAINS.some((d) => hostname === d || hostname.endsWith(d))
  } catch {
    return false
  }
}

/**
 * Check whether a URL's domain is in the image loader allowlist.
 */
const ALLOWED_SUFFIXES = [
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

export function isAllowedImageDomain(url: string): boolean {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname
    if (isR2Url(url)) return true
    return ALLOWED_SUFFIXES.some((d) => hostname === d || hostname.endsWith(d))
  } catch {
    return false
  }
}

/**
 * Classify image health for a stay's hero and gallery URLs.
 */
export type ImageHealthStatus =
  | 'healthy'
  | 'missing_hero'
  | 'broken_hero'
  | 'at_risk_hero' // non-R2 external URL that may expire
  | 'missing_gallery'
  | 'broken_gallery'

export interface ImageHealthReport {
  slug: string
  title: string
  platform: string
  heroUrl: string
  heroStatus: 'ok' | 'missing' | 'broken' | 'at_risk'
  heroLiveness?: LivenessResult
  galleryCount: number
  galleryBrokenCount: number
  issues: ImageHealthStatus[]
}

/**
 * Audit a single stay's image health. Checks hero and up to 5 gallery images.
 */
export async function auditStayImages(stay: {
  slug: string
  title: string
  platform: string
  imageUrl?: string | null
  galleryImages?: Array<{ imageUrl?: string } | Record<string, unknown>>
}): Promise<ImageHealthReport> {
  const heroUrl = (stay.imageUrl as string) ?? ''
  const issues: ImageHealthStatus[] = []

  // Hero checks
  let heroStatus: ImageHealthReport['heroStatus'] = 'ok'
  let heroLiveness: LivenessResult | undefined

  if (!heroUrl) {
    heroStatus = 'missing'
    issues.push('missing_hero')
  } else {
    heroLiveness = await checkImageUrlLiveness(heroUrl)

    if (!heroLiveness.live) {
      heroStatus = 'broken'
      issues.push('broken_hero')
    } else if (!isR2Url(heroUrl)) {
      heroStatus = 'at_risk'
      issues.push('at_risk_hero')
    }
  }

  // Gallery checks
  const gallery = (stay.galleryImages ?? []) as Array<{ imageUrl?: string }>
  const galleryCount = gallery.length
  let galleryBrokenCount = 0

  if (galleryCount === 0 && heroUrl) {
    // Having no gallery isn't critical if there's a hero
  } else if (galleryCount === 0 && !heroUrl) {
    issues.push('missing_gallery')
  }

  // Check gallery image liveness (sample up to 5)
  const galleryToCheck = gallery.slice(0, 5)
  for (const entry of galleryToCheck) {
    const url = entry.imageUrl ?? ''
    if (!url) {
      galleryBrokenCount++
      continue
    }
    const result = await checkImageUrlLiveness(url)
    if (!result.live) galleryBrokenCount++
  }

  if (galleryBrokenCount > 0 && galleryCount > 0) {
    issues.push('broken_gallery')
  }

  return {
    slug: stay.slug,
    title: stay.title,
    platform: stay.platform,
    heroUrl,
    heroStatus,
    heroLiveness,
    galleryCount,
    galleryBrokenCount,
    issues,
  }
}
