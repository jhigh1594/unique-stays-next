import { CATEGORIES_CONFIG } from './categories-config'

export const REGIONS = ['All', 'West', 'Southwest', 'South', 'Midwest', 'Northeast', 'Southeast'] as const
export type Region = typeof REGIONS[number]

const KNOWN_PLATFORMS = ['airbnb', 'vrbo', 'wander', 'direct']
const KNOWN_CATEGORY_IDS: string[] = CATEGORIES_CONFIG.map((c) => c.id)
const KNOWN_REGION_NAMES: string[] = REGIONS.slice(1).map((r) => r.toLowerCase())

export function isNaturalLanguage(q: string): boolean {
  const trimmed = q.trim()
  if (trimmed.length <= 2) return false
  const lower = trimmed.toLowerCase()
  if (KNOWN_CATEGORY_IDS.includes(lower)) return false
  if (KNOWN_REGION_NAMES.includes(lower)) return false
  if (KNOWN_PLATFORMS.includes(lower)) return false
  return true
}
