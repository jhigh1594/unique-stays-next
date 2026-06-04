// Unique Score — platform-aware listing scraper
// Uses Browserbase Fetch API (fast, cloud), Browserless as fallback, plain fetch last resort

import type { ListingData, Platform, ScrapeResult } from './types'

const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY
const BROWSERBASE_FETCH_URL = 'https://api.browserbase.com/v1/fetch'
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN
const BROWSERLESS_URL = 'https://chrome.browserless.io/content'
const TIMEOUT_MS = 25000

async function fetchWithBrowserbase(url: string): Promise<string> {
  if (!BROWSERBASE_API_KEY) throw new Error('BROWSERBASE_API_KEY not configured')

  const res = await fetch(BROWSERBASE_FETCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BB-API-Key': BROWSERBASE_API_KEY,
    },
    body: JSON.stringify({ url, allowRedirects: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Browserbase returned ${res.status}`)
  }

  const data = await res.json()
  return data.content || data.html || JSON.stringify(data)
}

async function fetchWithBrowserless(url: string): Promise<string> {
  if (!BROWSERLESS_TOKEN) throw new Error('BROWSERLESS_TOKEN not configured')

  const res = await fetch(`${BROWSERLESS_URL}?token=${BROWSERLESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Browserless returned ${res.status}`)
  }

  return res.text()
}

async function fetchWithFallback(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Fetch returned ${res.status}`)
  return res.text()
}

// ─── Airbnb Parser ──────────────────────────────────────────────

function parseAirbnb(html: string): ListingData {
  const photoUrls = extractAllMatches(
    html,
    /"(https?:\/\/[^"]*?muscache\.com\/im\/pictures\/[^"]+?)"/g,
  ).filter((u) => !u.includes('avatar') && !u.includes('profile'))

  // Dedupe
  const uniquePhotos = [...new Set(photoUrls)].slice(0, 20)

  // Try to extract structured data from __NEXT_DATA__ or script tags
  const title = extractFirst(html, /<title[^>]*>([^<]+)/) 
    || extractFirst(html, /"name"\s*:\s*"([^"]+)"/)
    || ''

  // Description from meta or page content
  const description =
    extractFirst(html, /"description"\s*:\s*"([^"]{20,})"/)
    || extractFirst(html, /<meta\s+name="description"\s+content="([^"]+)"/)
    || ''

  // Rating
  const ratingMatch = html.match(/"ratingValue"\s*:\s*([\d.]+)/)
    || html.match(/"aggregateRating"[^}]*"ratingValue"\s*:\s*([\d.]+)/)
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null

  // Review count
  const reviewMatch = html.match(/"reviewCount"\s*:\s*(\d+)/)
  const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : null

  // Amenities
  const amenities = extractAllMatches(html, /"name"\s*:\s*"([^"]+)"(?=[^}]*amenity)/gi).slice(0, 30)
  // Fallback: look for amenity list items
  const amenitiesFallback = extractAllMatches(
    html,
    /"label"\s*:\s*"([^"]+)"(?=[^}]*amenity)/gi,
  ).slice(0, 30)
  const allAmenities = [...new Set([...amenities, ...amenitiesFallback])]

  // Property type
  const propertyType =
    extractFirst(html, /"propertyType"\s*:\s*"([^"]+)"/)
    || extractFirst(html, /"roomType"\s*:\s*"([^"]+)"/)
    || null

  // Host name
  const hostName =
    extractFirst(html, /"hostName"\s*:\s*"([^"]+)"/)
    || null

  // Location
  const location =
    extractFirst(html, /"location"\s*:\s*"([^"]+)"/)
    || extractFirst(html, /"city"\s*:\s*"([^"]+)"/)
    || null

  // Review snippets
  const reviewSnippets = extractAllMatches(html, /"text"\s*:\s*"([^"]{20,})"/g).slice(0, 5)

  return {
    title: decodeEntities(title).replace(/\s*[|\-–].*$/, '').trim(),
    description: decodeEntities(description),
    photoUrls: uniquePhotos,
    amenities: allAmenities,
    rating,
    reviewCount,
    reviewSnippets: reviewSnippets.map(decodeEntities),
    propertyType,
    hostName,
    location,
    platform: 'airbnb',
  }
}

// ─── VRBO Parser ────────────────────────────────────────────────

function parseVrbo(html: string): ListingData {
  // VRBO images from JSON-LD or page scripts
  const photoUrls = extractAllMatches(
    html,
    /(https?:\/\/[^"]*?vrbo[a-z]*\.com[^"]*?(?:carousel|listing|lodging)[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)/gi,
  )
  // Fallback: any image URLs from the listing
  const fallbackPhotos = extractAllMatches(
    html,
    /"(https?:\/\/[^"]*?(?:cloudfront|vrbo|expediavacationrentals)[^"]*\.(?:jpg|jpeg|png|webp))[^"]*"/gi,
  )
  const uniquePhotos = [...new Set([...photoUrls, ...fallbackPhotos])].slice(0, 20)

  const title =
    extractFirst(html, /<title[^>]*>([^<]+)/)
    || extractFirst(html, /"name"\s*:\s*"([^"]+)"/)
    || ''

  const description =
    extractFirst(html, /"description"\s*:\s*"([^"]{20,})"/)
    || extractFirst(html, /<meta\s+name="description"\s+content="([^"]+)"/)
    || ''

  const ratingMatch = html.match(/"ratingValue"\s*:\s*([\d.]+)/)
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null

  const reviewMatch = html.match(/"reviewCount"\s*:\s*(\d+)/)
  const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : null

  const amenities = extractAllMatches(html, /"label"\s*:\s*"([^"]+)"/g)
    .filter((a) => a.length > 2 && a.length < 60)
    .slice(0, 30)

  const propertyType =
    extractFirst(html, /"propertyType"\s*:\s*"([^"]+)"/) || null

  const hostName = null // VRBO often hides host names

  const location =
    extractFirst(html, /"addressLocality"\s*:\s*"([^"]+)"/)
    || extractFirst(html, /"addressRegion"\s*:\s*"([^"]+)"/)
    || null

  const reviewSnippets = extractAllMatches(html, /"text"\s*:\s*"([^"]{20,})"/g).slice(0, 5)

  return {
    title: decodeEntities(title).replace(/\s*[|\-–].*$/, '').trim(),
    description: decodeEntities(description),
    photoUrls: uniquePhotos,
    amenities: [...new Set(amenities)],
    rating,
    reviewCount,
    reviewSnippets: reviewSnippets.map(decodeEntities),
    propertyType,
    hostName,
    location,
    platform: 'vrbo',
  }
}

// ─── Wander Parser ──────────────────────────────────────────────

function parseWander(html: string): ListingData {
  const photoUrls = extractAllMatches(
    html,
    /"(https?:\/\/[^"]*?(?:wander\.com|cloudfront|cdn)[^"]*\.(?:jpg|jpeg|png|webp))[^"]*"/gi,
  ).slice(0, 20)

  const title =
    extractFirst(html, /<title[^>]*>([^<]+)/)
    || extractFirst(html, /"name"\s*:\s*"([^"]+)"/)
    || ''

  const description =
    extractFirst(html, /"description"\s*:\s*"([^"]{20,})"/)
    || extractFirst(html, /<meta\s+name="description"\s+content="([^"]+)"/)
    || ''

  const ratingMatch = html.match(/"ratingValue"\s*:\s*([\d.]+)/)
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null

  const reviewMatch = html.match(/"reviewCount"\s*:\s*(\d+)/)
  const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : null

  const amenities = extractAllMatches(html, /"amenity"\s*:\s*"([^"]+)"/gi).slice(0, 30)

  const propertyType = extractFirst(html, /"propertyType"\s*:\s*"([^"]+)"/) || null
  const hostName = null
  const location =
    extractFirst(html, /"addressLocality"\s*:\s*"([^"]+)"/)
    || extractFirst(html, /"city"\s*:\s*"([^"]+)"/)
    || null

  const reviewSnippets = extractAllMatches(html, /"text"\s*:\s*"([^"]{20,})"/g).slice(0, 5)

  return {
    title: decodeEntities(title).replace(/\s*[|\-–].*$/, '').trim(),
    description: decodeEntities(description),
    photoUrls: [...new Set(photoUrls)],
    amenities: [...new Set(amenities)],
    rating,
    reviewCount,
    reviewSnippets: reviewSnippets.map(decodeEntities),
    propertyType,
    hostName,
    location,
    platform: 'wander',
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function extractFirst(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern)
  return match?.[1] ?? null
}

function extractAllMatches(html: string, pattern: RegExp): string[] {
  const results: string[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(pattern.source, pattern.flags)
  while ((match = re.exec(html)) !== null) {
    if (match[1]) results.push(match[1])
  }
  return results
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\u201[cd]/g, '"')
    .replace(/\\u201[89]/g, "'")
}

// ─── Main Export ────────────────────────────────────────────────

const PARSERS: Record<Platform, (html: string) => ListingData> = {
  airbnb: parseAirbnb,
  vrbo: parseVrbo,
  wander: parseWander,
}

export async function scrapeListing(url: string, platform: Platform): Promise<ScrapeResult> {
  try {
    // Try Browserbase Fetch API first (fast, cloud-based)
    let html: string
    try {
      html = await fetchWithBrowserbase(url)
    } catch {
      // Fallback to Browserless for JS-rendered content
      try {
        html = await fetchWithBrowserless(url)
      } catch {
        // Last resort: plain fetch
        html = await fetchWithFallback(url)
      }
    }

    if (!html || html.length < 500) {
      return { success: false, error: 'Unable to load listing page. The listing may not exist or may be blocked.' }
    }

    const parser = PARSERS[platform]
    const data = parser(html)

    // Basic validation
    if (!data.title && data.photoUrls.length === 0) {
      return { success: false, error: 'Could not extract listing data. The listing may not exist or the page format changed.' }
    }

    return { success: true, data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('timeout') || msg.includes('Timeout')) {
      return { success: false, error: 'Listing took too long to load. Please try again.' }
    }
    if (msg.includes('404')) {
      return { success: false, error: 'Listing not found. Please check the URL.' }
    }
    return { success: false, error: `Unable to access this listing: ${msg}` }
  }
}
