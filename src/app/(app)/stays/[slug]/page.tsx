import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStayBySlug, getRelatedStays, getAllStaySlugs } from '@/lib/payload-queries'
import StayDetailContent from './_stay/StayDetailContent'

export const dynamicParams = false
export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllStaySlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const stay = await getStayBySlug(slug)
  if (!stay) return {}

  const title = `${stay.title} — ${stay.location} | UniqueStaysUSA`
  const description = stay.description.length > 160
    ? stay.description.slice(0, 157) + '...'
    : stay.description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: stay.imageUrl ? [{ url: stay.imageUrl, width: 1200, height: 630 }] : [],
    },
  }
}

export default async function StayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const stay = await getStayBySlug(slug)
  if (!stay) notFound()

  const related = await getRelatedStays(stay.category, slug)

  return <StayDetailContent stay={stay} related={related} />
}
