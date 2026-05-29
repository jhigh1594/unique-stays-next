// Platform discovery via Exa semantic search
// Searches Airbnb, VRBO, and Wander for unique vacation rental listings

import Exa from 'exa-js'

export interface DiscoveredListing {
  title: string
  location: string
  state: string
  description: string
  imageUrl: string
  price: number | null
  rating: number | null
  reviewCount: number | null
  sourceUrl: string
  platform: 'Airbnb' | 'VRBO' | 'Wander'
  amenities: string[]
}

export interface DiscoverResult {
  success: boolean
  listings: DiscoveredListing[]
  error?: string
}

// ── Shared Exa client ────────────────────────────────────────────

function getClient(): Exa {
  const key = process.env.EXA_API_KEY
  if (!key) throw new Error('EXA_API_KEY not set')
  return new Exa(key)
}

// ── Semantic search queries ──────────────────────────────────────

const QUERIES = [
  // Treehouses
  'treehouse vacation rental United States',
  'treehouse cabin stay forest canopy',
  'luxury treehouse rental romantic getaway',
  // A-Frame Cabins
  'a-frame cabin vacation rental',
  'a-frame cabin secluded mountain',
  'modern a-frame rental snow cabin',
  // Converted Barns
  'converted barn vacation rental',
  'restored barn stay countryside retreat',
  'historic barn rental luxury',
  // Geodesic Domes
  'geodesic dome vacation rental glamping',
  'dome cabin off-grid rental',
  'bubble dome stargazing rental',
  // Glamping
  'glamping tent luxury safari rental',
  'yurt vacation rental retreat',
  'safari tent glamping getaway',
  'glamping pod rental United States',
  // Tiny Homes
  'tiny house vacation rental',
  'tiny home on wheels rental',
  'modern tiny cabin minimalist stay',
  // Cave Dwellings
  'cave house vacation rental',
  'underground cave stay rental',
  'cave dwelling boutique hotel',
  // Castles & Estates
  'castle vacation rental United States',
  'estate mansion rental wedding venue stay',
  'chateau vacation rental luxury',
  // Houseboats
  'houseboat vacation rental lake',
  'floating home rental stay',
  'boat house rental waterfront',
  // Lighthouses
  'lighthouse stay overnight rental',
  'lighthouse keeper cottage vacation',
  // Silo / unusual conversions
  'silo converted vacation rental',
  'shipping container home rental',
  'train caboose converted rental',
  'fire tower rental overnight stay',
  // Regional (covers all 6 US regions)
  'unique cabin vacation rental Pacific Northwest',
  'unique vacation rental Southwest desert',
  'unique vacation rental New England',
  'unique cabin rental Southeast mountains',
  'unique stay Midwest lakefront',
  'unique vacation rental Texas hill country',
  'unique cabin rental Colorado Rocky Mountains',
  'unique stay Blue Ridge Mountains',
  'unique rental Oregon coast',
  'unique cabin rental Smoky Mountains',
  // General unique stays
  'unique vacation rental secluded United States',
  'off-grid cabin rental wilderness',
  'luxury cabin rental with hot tub secluded',
  'pet-friendly unique vacation rental cabin',
  'romantic cabin getaway with view',
] as const

const PLATFORM_DOMAINS: Record<string, string[]> = {
  airbnb: ['airbnb.com'],
  vrbo: ['vrbo.com'],
  wander: ['wander.com'],
}

// ── Extract listing metadata from Exa result text ────────────────

function extractPrice(text: string): number | null {
  // Match $NNN or $NNN/night patterns
  const match = text.match(/\$(\d{1,4})(?:\s*\/\s*night|\s*per\s*night|\s*\/night)?/)
  return match ? parseInt(match[1], 10) : null
}

function extractRating(text: string): number | null {
  const match = text.match(/(\d\.?\d?)\s*(?:out of\s*5|\/5|stars?)/i)
  if (!match) return null
  const val = parseFloat(match[1])
  // Payload requires rating between 1-5
  if (val < 1 || val > 5) return null
  return val
}

function extractReviewCount(text: string): number | null {
  const match = text.match(/(\d+)\s*reviews?\b/i)
  return match ? parseInt(match[1], 10) : null
}

function extractLocation(text: string): { location: string; state: string } {
  // Try "City, ST" or "City, State" patterns
  const match = text.match(/([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})/)
  if (match) {
    return { location: `${match[1].trim()}, ${match[2]}`, state: match[2] }
  }

  // Try "City, State" with full state name
  const stateMatch = text.match(/([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+?)(?:\s*[.\|]|\s*$)/)
  if (stateMatch) {
    const state = stateMatch[2].trim()
    return { location: `${stateMatch[1].trim()}, ${state}`, state }
  }

  return { location: '', state: '' }
}

function extractAmenities(highlights: string[] | undefined, text: string): string[] {
  const amenities: string[] = []
  const amenityKeywords = [
    'hot tub', 'pool', 'wifi', 'kitchen', 'parking', 'fireplace', 'ac',
    'washer', 'dryer', 'pets allowed', 'pet friendly', 'ev charger',
    'deck', 'patio', 'balcony', 'grill', 'bbq', 'fire pit',
    'stargazing', 'mountain view', 'lake access', 'beach access',
    'hiking', 'skiing', 'fishing', 'kayak', 'canoe',
    'wood-burning stove', 'sauna', 'jacuzzi',
  ]

  const content = (highlights?.join(' ') ?? '' + ' ' + text).toLowerCase()
  for (const kw of amenityKeywords) {
    if (content.includes(kw) && amenities.length < 15) {
      amenities.push(kw.replace(/\b\w/g, (c) => c.toUpperCase()))
    }
  }

  return amenities
}

// ── Map Exa result to DiscoveredListing ──────────────────────────

interface ExaSearchResult {
  url: string
  title: string | null
  text: string
  highlights: string[] | undefined
  image: string | undefined
}

const GENERIC_PLATFORM_PATTERNS = [
  /vacation rentals?,?\s*cabins?,?\s*beach/i,
  /^airbnb\s*[:–—]/i,
  /^vrbo\s*[:–—]/i,
  /^wander\s*[:–—]/i,
  /^holiday rentals/i,
  /book unique/i,
  /^home$/i,
]

function isGenericPlatformPage(title: string): boolean {
  if (title.length < 5) return true
  return GENERIC_PLATFORM_PATTERNS.some((p) => p.test(title))
}

function cleanUrl(url: string, platform: 'Airbnb' | 'VRBO' | 'Wander'): string {
  // Decode HTML entities
  let cleaned = url.replace(/&amp;/g, '&')

  // Strip to canonical URL per platform; return "" if not a real listing page
  if (platform === 'Airbnb') {
    // Must be a listing: airbnb.com/rooms/{digits}, not search (/s/...) or homepage
    const match = cleaned.match(/airbnb\.com\/rooms\/(\d+)/)
    if (match) return `https://www.airbnb.com/rooms/${match[1]}`
    return ''
  } else if (platform === 'VRBO') {
    // Must be a listing: vrbo.com/{digits} or vrbo.com/{numeric-slug}
    const match = cleaned.match(/vrbo\.com\/(\d+[a-z]?(?:[a-z0-9-]*))/)
    if (match) return `https://www.vrbo.com/${match[1]}`
    return ''
  } else if (platform === 'Wander') {
    // Must be a property page, not homepage or search
    const match = cleaned.match(/wander\.com\/(property\/[a-z0-9-]+)/)
      ?? cleaned.match(/wander\.com\/([a-z0-9-]+)/)
    if (match) return `https://www.wander.com/${match[1]}`
    return ''
  }

  return ''
}

function extractTitle(result: ExaSearchResult, platform: 'Airbnb' | 'VRBO' | 'Wander'): string {
  // Platform page titles are generic (e.g. "Airbnb: Vacation Rentals...")
  // Try to extract the actual listing name from highlights/text
  const content = [result.highlights?.join(' ') ?? '', result.text ?? ''].join(' ')

  if (platform === 'Airbnb') {
    // Airbnb listings often have the name as the first heading or in meta
    const match = content.match(/^(.{10,100}?)\s*(?:·|–|—|\|)\s*(?:\$|Airbnb|Superhost|reviews)/i)
      ?? content.match(/^(.{10,100?})\s+\$/)
      ?? content.match(/(?:title|name)[\"':]\s*\"(.{10,100})\"/i)
    if (match) return match[1].trim()
  }

  if (platform === 'VRBO') {
    const match = content.match(/^(.{10,100}?)\s*(?:·|–|—|\|)\s*(?:\$|VRBO|reviews)/i)
    if (match) return match[1].trim()
  }

  if (platform === 'Wander') {
    // Wander pages have "PropertyName – X Bedroom Vacation Rental in City, State | Wander"
    const match = content.match(/^(.{10,100?})\s*[–—]\s*\d+\s*Bedroom/i)
      ?? content.match(/^(.{10,100?})\s*\|\s*Wander/i)
    if (match) return match[1].trim()
  }

  // Fallback: use page title if it's not the generic one
  const title = result.title ?? ''
  if (!title.includes('Vacation Rentals, Cabins, Beach Houses') && title.length > 5) {
    return title
  }

  // Last resort: slugify the URL path
  try {
    const path = new URL(result.url).pathname.split('/').filter(Boolean).pop() ?? ''
    return path.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return 'Untitled Listing'
  }
}

function mapToListing(result: ExaSearchResult, platform: 'Airbnb' | 'VRBO' | 'Wander'): DiscoveredListing {
  const fullText = [result.highlights?.join(' ') ?? '', result.text].join(' ')
  const { location, state } = extractLocation(fullText)

  return {
    title: extractTitle(result, platform),
    location,
    state,
    description: result.highlights?.join('\n') ?? result.text?.slice(0, 500) ?? '',
    imageUrl: result.image ?? '',
    price: extractPrice(fullText),
    rating: extractRating(fullText),
    reviewCount: extractReviewCount(fullText),
    sourceUrl: cleanUrl(result.url, platform),
    platform,
    amenities: extractAmenities(result.highlights, result.text ?? ''),
  }
}

// ── Platform-specific discovery functions ─────────────────────────

export async function discoverAirbnb(limit?: number): Promise<DiscoverResult> {
  const client = getClient()
  const allListings: DiscoveredListing[] = []
  const perQuery = limit ? Math.ceil(limit / QUERIES.length) + 2 : 10

  for (const query of QUERIES) {
    if (limit && allListings.length >= limit) break

    try {
      const response = await client.searchAndContents(query, {
        numResults: perQuery,
        includeDomains: PLATFORM_DOMAINS.airbnb,
        type: 'neural',
        contents: {
          text: { maxCharacters: 3000 },
          highlights: { numSentences: 5, highlightsPerUrl: 3 },
        },
      })

      const listings = (response.results as unknown as ExaSearchResult[])
        .filter((r) => r.url && r.title)
        .filter((r) => !isGenericPlatformPage(r.title ?? ''))
        .map((r) => mapToListing(r, 'Airbnb'))
        .filter((r) => r.sourceUrl !== '')

      allListings.push(...listings)
      process.stdout.write(`  Airbnb "${query}": ${listings.length} listings\n`)

      // Rate limit
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      process.stdout.write(`  Airbnb search failed ("${query}"): ${message}\n`)
    }
  }

  return { success: allListings.length > 0, listings: allListings }
}

export async function discoverVRBO(limit?: number): Promise<DiscoverResult> {
  const client = getClient()
  const allListings: DiscoveredListing[] = []
  const perQuery = limit ? Math.ceil(limit / QUERIES.length) + 2 : 10

  for (const query of QUERIES.slice(0, 20)) {
    if (limit && allListings.length >= limit) break

    try {
      const response = await client.searchAndContents(query, {
        numResults: perQuery,
        includeDomains: PLATFORM_DOMAINS.vrbo,
        type: 'neural',
        contents: {
          text: { maxCharacters: 3000 },
          highlights: { numSentences: 5, highlightsPerUrl: 3 },
        },
      })

      const listings = (response.results as unknown as ExaSearchResult[])
        .filter((r) => r.url && r.title)
        .filter((r) => !isGenericPlatformPage(r.title ?? ''))
        .map((r) => mapToListing(r, 'VRBO'))
        .filter((r) => r.sourceUrl !== '')

      allListings.push(...listings)
      process.stdout.write(`  VRBO "${query}": ${listings.length} listings\n`)

      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      process.stdout.write(`  VRBO search failed ("${query}"): ${message}\n`)
    }
  }

  return { success: allListings.length > 0, listings: allListings }
}

export async function discoverWander(limit?: number): Promise<DiscoverResult> {
  const client = getClient()
  const allListings: DiscoveredListing[] = []

  const wanderQueries = [
    'unique luxury vacation rental cabin',
    'secluded vacation home retreat',
    'modern cabin vacation rental',
  ]

  for (const query of wanderQueries) {
    if (limit && allListings.length >= limit) break

    try {
      const response = await client.searchAndContents(query, {
        numResults: limit ? Math.ceil(limit / wanderQueries.length) + 2 : 15,
        includeDomains: PLATFORM_DOMAINS.wander,
        type: 'neural',
        contents: {
          text: { maxCharacters: 3000 },
          highlights: { numSentences: 5, highlightsPerUrl: 3 },
        },
      })

      const listings = (response.results as unknown as ExaSearchResult[])
        .filter((r) => r.url && r.title)
        .filter((r) => !isGenericPlatformPage(r.title ?? ''))
        .map((r) => mapToListing(r, 'Wander'))
        .filter((r) => r.sourceUrl !== '')

      allListings.push(...listings)
      process.stdout.write(`  Wander "${query}": ${listings.length} listings\n`)

      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      process.stdout.write(`  Wander search failed ("${query}"): ${message}\n`)
    }
  }

  return { success: allListings.length > 0, listings: allListings }
}

// ── Discover all platforms ───────────────────────────────────────

export async function discoverAll(
  sources?: ('airbnb' | 'vrbo' | 'wander')[],
  limitPerSource?: number,
): Promise<DiscoveredListing[]> {
  const activeSources = sources ?? ['airbnb', 'vrbo', 'wander'] as const
  const allListings: DiscoveredListing[] = []

  for (const source of activeSources) {
    process.stdout.write(`\nSearching ${source}...\n`)

    let result: DiscoverResult
    switch (source) {
      case 'airbnb':
        result = await discoverAirbnb(limitPerSource)
        break
      case 'vrbo':
        result = await discoverVRBO(limitPerSource)
        break
      case 'wander':
        result = await discoverWander(limitPerSource)
        break
    }

    if (result.success) {
      allListings.push(...result.listings)
    } else if (result.error) {
      process.stdout.write(`  ${source} failed: ${result.error}\n`)
    }
  }

  return allListings
}
