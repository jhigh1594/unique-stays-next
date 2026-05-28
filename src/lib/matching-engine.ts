/**
 * Vacation Quiz — Matching Engine
 *
 * Scores stays against quiz answers using weighted dimensions:
 *   Category/Vibe match (25pts)
 *   Budget fit (25pts)
 *   Distance proximity (25pts)
 *   Must-have amenity (15pts)
 *   Quality bonus (10pts)
 *
 * Total possible: 100 points
 */

export interface QuizAnswers {
  occasion: 'romantic' | 'solo' | 'friends' | 'family'
  vibe: 'woods' | 'waterfront' | 'desert' | 'mountains' | 'offgrid'
  distance: 'nearby' | 'halfday' | 'anywhere'
  budget: 'under150' | '150to300' | '300to500' | '500plus'
  mustHave: 'views' | 'privacy' | 'hottub' | 'hiking' | 'pets' | 'offgrid-wifi-free'
  zipCode: string
}

export interface StayMatch {
  id: number
  slug: string
  title: string
  subtitle?: string
  location: string
  city?: string
  state: string
  stateCode?: string
  price: number
  rating?: number
  reviewCount?: number
  imageUrl?: string
  affiliateUrl: string
  categorySlug: string
  categoryName: string
  categoryEmoji?: string
  description: string
  editorNote?: string
  tags?: string[]
  matchScore: number
  matchReasons: string[]
}

// ── Category-to-vibe mapping ──
const VIBE_CATEGORY_MAP: Record<string, string[]> = {
  woods: ['treehouses', 'converted-barns', 'tiny-homes'],
  waterfront: ['houseboats', 'lighthouses'],
  desert: ['cave-dwellings', 'glamping'],
  mountains: ['a-frame-cabins', 'geodesic-domes', 'glamping'],
  offgrid: ['cave-dwellings', 'geodesic-domes', 'treehouses', 'tiny-homes'],
}

// ── Category-to-occasion mapping ──
const OCCASION_BOOST: Record<string, string[]> = {
  romantic: ['treehouses', 'houseboats', 'lighthouses', 'a-frame-cabins'],
  solo: ['tiny-homes', 'cave-dwellings', 'glamping'],
  friends: ['geodesic-domes', 'converted-barns', 'castles-estates', 'houseboats'],
  family: ['a-frame-cabins', 'glamping', 'converted-barns', 'castles-estates'],
}

// ── Budget ranges ──
const BUDGET_RANGES: Record<string, [number, number]> = {
  under150: [0, 150],
  '150to300': [150, 300],
  '300to500': [300, 500],
  '500plus': [500, Infinity],
}

// ── Distance thresholds (miles) ──
const DISTANCE_THRESHOLDS: Record<string, number> = {
  nearby: 120,     // ~2 hour drive
  halfday: 300,    // ~5 hour drive
  anywhere: 5000,  // effectively unlimited (continental US)
}

// ── Must-have tag mapping ──
const MUSTHAVE_TAGS: Record<string, string[]> = {
  views: ['view', 'views', 'mountain view', 'ocean view', 'scenic', 'panoramic'],
  privacy: ['private', 'secluded', 'isolated', 'exclusive', 'privacy'],
  hottub: ['hot tub', 'hottub', 'hot-tub', 'spa', 'jacuzzi', 'sauna'],
  hiking: ['hiking', 'hike', 'trails', 'trail', 'mountain', 'forest'],
  pets: ['pet', 'pet-friendly', 'dog', 'dogs', 'pet friendly'],
  'offgrid-wifi-free': ['off-grid', 'offgrid', 'no wifi', 'unplugged', 'disconnect', 'cell service'],
}

/**
 * Haversine distance between two lat/lng points in miles
 */
function haversine(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate match score for a single stay against quiz answers
 */
export function scoreStay(
  stay: {
    categorySlug: string
    price: number
    coordinates?: { type: string; coordinates: [number, number] } // GeoJSON [lng, lat]
    tags?: string[]
    rating?: number
    reviewCount?: number
  },
  answers: QuizAnswers,
  userCoords?: { lat: number; lng: number }
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // 1. Category/Vibe match (25 points)
  const vibeCategories = VIBE_CATEGORY_MAP[answers.vibe] || []
  if (vibeCategories.includes(stay.categorySlug)) {
    score += 20
    reasons.push(`Matches your ${answers.vibe} vibe`)
  }

  // Occasion bonus (5 additional points)
  const occasionBoost = OCCASION_BOOST[answers.occasion] || []
  if (occasionBoost.includes(stay.categorySlug)) {
    score += 5
    reasons.push('Great for your occasion')
  }

  // 2. Budget fit (25 points)
  const [minBudget, maxBudget] = BUDGET_RANGES[answers.budget]
  if (stay.price >= minBudget && stay.price <= maxBudget) {
    score += 25
    reasons.push(`$${stay.price}/night fits your budget`)
  } else if (stay.price >= minBudget * 0.8 && stay.price <= maxBudget * 1.2) {
    // Within 20% of budget range — partial match
    score += 12
    reasons.push(`$${stay.price}/night — close to your range`)
  }

  // 3. Distance match (25 points)
  const maxDistance = DISTANCE_THRESHOLDS[answers.distance]
  if (userCoords && stay.coordinates) {
    const [stayLng, stayLat] = stay.coordinates.coordinates
    const distance = haversine(userCoords.lat, userCoords.lng, stayLat, stayLng)

    if (distance <= maxDistance) {
      if (distance <= maxDistance * 0.5) {
        score += 25
      } else if (distance <= maxDistance * 0.75) {
        score += 20
      } else {
        score += 15
      }
      const miles = Math.round(distance)
      reasons.push(`${miles} miles away`)
    }
    // If outside range, 0 distance points but stay still eligible
  } else {
    // No coordinates available — give partial distance score
    score += 10
  }

  // 4. Must-have match (15 points)
  const mustHaveTags = MUSTHAVE_TAGS[answers.mustHave] || []
  const stayTags = (stay.tags || []).map((t: any) =>
    typeof t === 'string' ? t.toLowerCase() : (t?.tag || '').toLowerCase()
  )
  const hasMustHave = mustHaveTags.some((tag) =>
    stayTags.some((st: string) => st.includes(tag))
  )
  if (hasMustHave) {
    score += 15
    reasons.push(`Has ${answers.mustHave.replace('-', ' / ')}`)
  }

  // 5. Quality bonus (10 points)
  if (stay.rating) {
    score += Math.round((stay.rating / 5.0) * 10)
  } else {
    score += 5 // Unknown rating — neutral
  }

  return { score, reasons }
}

/**
 * Geocode a zip code using Nominatim
 * Results cached for 24h in-memory
 */
const geoCache = new Map<string, { lat: number; lng: number; expires: number }>()

export async function geocodeZipCode(zipCode: string): Promise<{ lat: number; lng: number } | null> {
  const cached = geoCache.get(zipCode)
  if (cached && cached.expires > Date.now()) {
    return { lat: cached.lat, lng: cached.lng }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}&countrycodes=us&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'UniqueStaysUSA/1.0 (hello@uniquestaysusa.com)' },
    })
    const data = await res.json()

    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      const result = { lat: parseFloat(lat), lng: parseFloat(lon) }
      geoCache.set(zipCode, { ...result, expires: Date.now() + 86400000 }) // 24h
      return result
    }
  } catch (e) {
    console.error('Geocoding failed for zip', zipCode, e)
  }

  return null
}
