// Extract listing image URLs from JSON-LD structured data embedded in HTML.
// Airbnb pages include <script type="application/ld+json"> blocks with
// VacationRental or Product schemas containing a clean, ordered `image` array.
// This is more reliable than scraping <img> tags (which include avatars,
// logos, platform assets, and other noise).

const JSONLD_REGEX = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
const MAX_IMAGES = 30

/**
 * Extract image URLs from JSON-LD structured data in HTML.
 * Handles: string, string[], ImageObject[], and mixed arrays.
 * Returns up to 30 deduplicated URLs.
 */
export function extractJsonLdImageUrls(html: string): string[] {
  const urls: string[] = []
  const seen = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = JSONLD_REGEX.exec(html)) !== null) {
    let parsed: unknown
    try {
      parsed = JSON.parse(match[1])
    } catch {
      continue
    }

    if (!parsed || typeof parsed !== 'object' || !('@type' in parsed)) continue

    const type = (parsed as Record<string, unknown>)['@type']
    if (type !== 'VacationRental' && type !== 'Product') continue

    const image = (parsed as Record<string, unknown>).image
    if (!image) continue

    const images = Array.isArray(image) ? image : [image]

    for (const entry of images) {
      let url: string | undefined
      if (typeof entry === 'string') {
        url = entry
      } else if (entry && typeof entry === 'object') {
        url = (entry as Record<string, unknown>).url as string | undefined
      }

      if (url && !seen.has(url)) {
        seen.add(url)
        urls.push(url)
        if (urls.length >= MAX_IMAGES) return urls
      }
    }
  }

  return urls
}
