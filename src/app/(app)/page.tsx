import HomeContent from './_home/HomeContent'
import {
  getFeaturedStays,
  getEditorsPickStays,
  getFilmstripStays,
  getAllStays,
} from '@/lib/payload-queries'
import { CATEGORIES_CONFIG } from '@/lib/categories-config'

export const revalidate = 3600

export default async function HomePage() {
  const [featuredStays, editorsPickStays, filmstripStays, allStays] =
    await Promise.all([
      getFeaturedStays(),
      getEditorsPickStays(),
      getFilmstripStays(),
      getAllStays(),
    ])

  const categories = CATEGORIES_CONFIG.map((cat) => ({
    ...cat,
    count: allStays.filter((s) => s.category === cat.id).length,
  }))

  return (
    <HomeContent
      featuredStays={featuredStays}
      editorsPickStays={editorsPickStays}
      filmstripStays={filmstripStays}
      allStays={allStays}
      categories={categories}
    />
  )
}
