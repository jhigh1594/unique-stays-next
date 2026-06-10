import { CATEGORIES_CONFIG } from '@/lib/categories-config'
import type { HeroStat } from './HeroCopy'

export const HERO_FALLBACK_CATEGORIES = CATEGORIES_CONFIG.map((cat) => ({
  ...cat,
  count: 0,
}))

export const HERO_FALLBACK_STATS: HeroStat[] = [
  { value: 250, suffix: '+', label: 'Curated Stays' },
  { value: 10, suffix: '', label: 'Unique Categories' },
  { value: 12000, suffix: '+', label: 'Weekly Readers' },
]
