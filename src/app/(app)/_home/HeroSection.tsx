import Hero from './Hero'
import { CATEGORIES_CONFIG } from '@/lib/categories-config'
import { getHomepageInventory } from '@/lib/payload-queries'

export default async function HeroSection() {
  const inventory = await getHomepageInventory()

  const categories = CATEGORIES_CONFIG.map((cat) => ({
    ...cat,
    count: inventory.categoryCounts[cat.id] ?? 0,
  }))

  const heroStats = [
    { value: inventory.totalCount, suffix: '+', label: 'Curated Stays' },
    { value: 10, suffix: '', label: 'Unique Categories' },
    { value: 12000, suffix: '+', label: 'Weekly Readers' },
  ]

  return <Hero categories={categories} stats={heroStats} />
}
