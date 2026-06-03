export type Platform = 'airbnb' | 'vrbo' | 'wander'

export const STAY_TYPES = [
  'treehouse', 'dome', 'yurt', 'a-frame', 'cabin',
  'lighthouse', 'houseboat', 'tiny-home', 'glamping-tent', 'other',
] as const
export type StayType = (typeof STAY_TYPES)[number]

export const VIBES = [
  'romantic', 'adventurous', 'rustic', 'luxury', 'family-friendly', 'off-grid',
] as const
export type Vibe = (typeof VIBES)[number]

export const GUEST_TYPES = [
  'couples', 'families', 'solo', 'groups', 'digital-nomads',
] as const
export type GuestType = (typeof GUEST_TYPES)[number]

export interface ListingInput {
  stayType: StayType
  propertyName: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  sleeps: number
  standoutFeatures: [string, string, string]
  vibe: Vibe
  targetGuest?: GuestType
  currentDescription?: string
}

export interface GenerationResult {
  title: string
  description: string
  editorialNotes: EditorialNote[]
  stayTypeAffinity: string
}

export interface EditorialNote {
  category: 'hook' | 'story' | 'conversion'
  note: string
  example?: string
}

export interface GenerationResponse {
  id: string
  result: GenerationResult
  platform?: Platform
  listingTitle?: string | null
  cached: boolean
}

// URL validation patterns (reuse from unique-score)
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
    return { valid: false, error: 'Please enter a valid URL.' }
  }

  const platform = detectPlatform(url)
  if (!platform) {
    return {
      valid: false,
      error: 'We currently support Airbnb, VRBO, or Wander listings. Use the manual form for other platforms.',
    }
  }

  return { valid: true, platform }
}

export function validateManualInput(input: Partial<ListingInput>): { valid: boolean; error?: string } {
  if (!input.stayType || !(STAY_TYPES as readonly string[]).includes(input.stayType)) {
    return { valid: false, error: 'Please select a valid stay type.' }
  }
  if (!input.propertyName || input.propertyName.trim().length === 0) {
    return { valid: false, error: 'Please enter a property name or location.' }
  }
  if (!input.city || input.city.trim().length === 0) {
    return { valid: false, error: 'Please enter a city.' }
  }
  if (!input.state || input.state.trim().length === 0) {
    return { valid: false, error: 'Please enter a state.' }
  }
  if (!input.bedrooms || input.bedrooms < 0) {
    return { valid: false, error: 'Please enter a valid number of bedrooms.' }
  }
  if (!input.bathrooms || input.bathrooms < 0) {
    return { valid: false, error: 'Please enter a valid number of bathrooms.' }
  }
  if (!input.sleeps || input.sleeps < 1) {
    return { valid: false, error: 'Please enter how many guests the property sleeps.' }
  }
  if (!input.standoutFeatures || input.standoutFeatures.length < 3) {
    return { valid: false, error: 'Please provide 3 standout features.' }
  }
  if (!input.vibe || !(VIBES as readonly string[]).includes(input.vibe)) {
    return { valid: false, error: 'Please select a valid vibe.' }
  }
  return { valid: true }
}
