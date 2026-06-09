import HomeContent from './HomeContent'
import {
  getFeaturedStays,
  getEditorsPickStays,
  getFilmstripStays,
  type HomepageSpokeStat,
} from '@/lib/payload-queries'
import type { CategoryConfig } from '@/lib/categories-config'

interface HomeBodyProps {
  categories: CategoryConfig[]
  spokeStats: Record<string, HomepageSpokeStat>
  totalCount: number
}

export default async function HomeBody({
  categories,
  spokeStats,
  totalCount,
}: HomeBodyProps) {
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
      spokeStats={spokeStats}
      categories={categories}
      totalCount={totalCount}
    />
  )
}
