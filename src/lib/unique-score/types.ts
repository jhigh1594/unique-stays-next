// Unique Score — shared types

export type Platform = 'airbnb' | 'vrbo' | 'wander'

export interface ListingData {
  title: string
  description: string
  photoUrls: string[]
  amenities: string[]
  rating: number | null
  reviewCount: number | null
  reviewSnippets: string[]
  propertyType: string | null
  hostName: string | null
  location: string | null
  platform: Platform
}

export interface DimensionScore {
  name: string
  key: string
  weight: number
  score: number // 0-100
  observations: string[] // 2-3 specific observations
  suggestion: string // 1 concrete improvement
}

export interface AnalysisResult {
  dimensions: DimensionScore[]
  overallScore: number // 0-100, weighted sum
  summary: string // 1-2 sentence overall assessment
}

export interface ScoreReport {
  id: number
  urlHash: string
  listingUrl: string
  platform: Platform
  overallScore: number
  dimensions: DimensionScore[]
  listingData?: ListingData
  paid: boolean
  createdAt: string
}

export interface ScrapeResult {
  success: boolean
  data?: ListingData
  error?: string
}

// Dimension definitions (constant)
export const DIMENSIONS = [
  { key: 'visualStory', name: 'Visual Story', weight: 0.25 },
  { key: 'standoutFactor', name: 'Standout Factor', weight: 0.20 },
  { key: 'writtenStory', name: 'Written Story', weight: 0.20 },
  { key: 'guestConfidence', name: 'Guest Confidence', weight: 0.20 },
  { key: 'experienceDepth', name: 'Experience Depth', weight: 0.15 },
] as const

// Free tier dimensions
export const FREE_DIMENSIONS = ['visualStory', 'standoutFactor'] as const

// URL validation patterns
export const URL_PATTERNS: Record<Platform, RegExp> = {
  airbnb: /airbnb\.(com|co\.uk|ca|com\.au)\/(?:rooms|w)\/(\d+)/i,
  vrbo: /vrbo\.com\/(\d+)/i,
  wander: /wander\.com\/stays\/([\w-]+)/i,
}

export function detectPlatform(url: string): Platform | null {
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) return platform as Platform
  }
  return null
}

export function validateListingUrl(url: string): { valid: boolean; platform?: Platform; error?: string } {
  try {
    new URL(url)
  } catch {
    return { valid: false, error: 'Please enter a valid URL' }
  }

  const platform = detectPlatform(url)
  if (!platform) {
    return {
      valid: false,
      error: 'We currently support Airbnb, VRBO, and Wander listings.',
    }
  }

  return { valid: true, platform }
}
