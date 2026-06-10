import HomeContent from './HomeContent'
import { CATEGORIES_CONFIG } from '@/lib/categories-config'
import {
  getFeaturedStays,
  getEditorsPickStays,
  getFilmstripStays,
  getHomepageInventory,
} from '@/lib/payload-queries'

export default async function HomeBody() {
  const inventory = await getHomepageInventory()

  const categories = CATEGORIES_CONFIG.map((cat) => ({
    ...cat,
    count: inventory.categoryCounts[cat.id] ?? 0,
  }))

  const [featuredStays, editorsPickStays, filmstripStays] = await Promise.all([
    getFeaturedStays(),
    getEditorsPickStays(),
    getFilmstripStays(),
  ])

  return (
    <HomeContent
      featuredStays={featuredStays}
      editorsPickStays={editorsPickStays}
      filmstripStays={filmstripStays}
      spokeStats={inventory.spokeStats}
      categories={categories}
      totalCount={inventory.totalCount}
    />
  )
}
