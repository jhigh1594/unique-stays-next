import HomeContent from './_home/HomeContent'
import Hero from './_home/Hero'
import { HERO_FIRST_IMAGE } from './_home/hero-slides'
import { buildR2CdnUrl } from '@/lib/image-loader'
import {
  getFeaturedStays,
  getEditorsPickStays,
  getFilmstripStays,
  getHomepageInventory,
} from '@/lib/payload-queries'
import { CATEGORIES_CONFIG } from '@/lib/categories-config'

export const revalidate = 86400

export default async function HomePage() {
  const [featuredStays, editorsPickStays, filmstripStays, inventory] =
    await Promise.all([
      getFeaturedStays(),
      getEditorsPickStays(),
      getFilmstripStays(),
      getHomepageInventory(),
    ])

  const categories = CATEGORIES_CONFIG.map((cat) => ({
    ...cat,
    count: inventory.categoryCounts[cat.id] ?? 0,
  }))

  const heroStats = [
    { value: inventory.totalCount, suffix: '+', label: 'Curated Stays' },
    { value: 10, suffix: '', label: 'Unique Categories' },
    { value: 12000, suffix: '+', label: 'Weekly Readers' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <link
        rel="preload"
        as="image"
        href={buildR2CdnUrl(HERO_FIRST_IMAGE, 1920) ?? HERO_FIRST_IMAGE}
        fetchPriority="high"
      />
      <Hero categories={categories} stats={heroStats} />
      <HomeContent
        featuredStays={featuredStays}
        editorsPickStays={editorsPickStays}
        filmstripStays={filmstripStays}
        spokeStats={inventory.spokeStats}
        categories={categories}
        totalCount={inventory.totalCount}
      />
    </div>
  )
}
