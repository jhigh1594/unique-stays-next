import HomeContent from './_home/HomeContent'
import { HERO_FIRST_IMAGE } from './_home/Hero'
import {
  getFeaturedStays,
  getEditorsPickStays,
  getFilmstripStays,
  getAllStays,
} from '@/lib/payload-queries'
import { CATEGORIES_CONFIG } from '@/lib/categories-config'

export const revalidate = 86400

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
    <>
      <link rel="preload" as="image" href={HERO_FIRST_IMAGE} />
      <HomeContent
      featuredStays={featuredStays}
      editorsPickStays={editorsPickStays}
      filmstripStays={filmstripStays}
      allStays={allStays}
      categories={categories}
      totalCount={allStays.length}
    />
    </>
  )
}
