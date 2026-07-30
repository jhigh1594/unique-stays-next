/**
 * Wander's affiliate link accepts the destination as `u`. Keeping the
 * canonical property URL inside that parameter lets the affiliate network
 * attribute the click without collapsing every listing onto Wander's home.
 */
export const WANDER_AFFILIATE_BASE_URL = 'https://wander.sjv.io/k4b6Qv'

function parseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isWanderHost(url: URL): boolean {
  return url.protocol === 'https:' && (url.hostname === 'wander.com' || url.hostname === 'www.wander.com')
}

/** True only for a canonical Wander property page, not search or collection pages. */
export function isWanderPropertyUrl(value: string): boolean {
  const url = parseUrl(value)
  return Boolean(url && isWanderHost(url) && /^\/property\/[^/]+\/?$/.test(url.pathname))
}

/**
 * Builds the approved Wander affiliate URL for a canonical property URL.
 * Returns null for any URL that is not a valid Wander property destination.
 */
export function toWanderAffiliateUrl(propertyUrl: string): string | null {
  if (!isWanderPropertyUrl(propertyUrl)) return null

  const destination = new URL(propertyUrl)
  const affiliateUrl = new URL(WANDER_AFFILIATE_BASE_URL)
  affiliateUrl.searchParams.set('u', destination.toString())
  return affiliateUrl.toString()
}

/**
 * Normalizes either a direct Wander property URL or an already-wrapped
 * affiliate link. Null means the value is not safe to rewrite automatically.
 */
export function normalizeWanderAffiliateUrl(value: string): string | null {
  const directUrl = toWanderAffiliateUrl(value)
  if (directUrl) return directUrl

  const affiliateUrl = parseUrl(value)
  const baseUrl = new URL(WANDER_AFFILIATE_BASE_URL)
  if (
    !affiliateUrl ||
    affiliateUrl.protocol !== baseUrl.protocol ||
    affiliateUrl.hostname !== baseUrl.hostname ||
    affiliateUrl.pathname !== baseUrl.pathname
  ) {
    return null
  }

  const destination = affiliateUrl.searchParams.get('u')
  return destination ? toWanderAffiliateUrl(destination) : null
}
