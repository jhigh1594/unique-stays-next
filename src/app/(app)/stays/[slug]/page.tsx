import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStayBySlug, getRelatedStays, getAllStaySlugs } from '@/lib/payload-queries'
import StayDetailContent from './_stay/StayDetailContent'
import { SPOKES_CONFIG } from '@/lib/spokes-config'

export const dynamicParams = false
export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await getAllStaySlugs()
  return slugs.map((slug) => ({ slug }))
}

function getStayJsonLd(stay: NonNullable<Awaited<ReturnType<typeof getStayBySlug>>>) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com'
  const primarySpoke = stay.spokes.map((s) => SPOKES_CONFIG[s]).find(Boolean)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LodgingBusiness',
        name: stay.title,
        description: stay.description,
        image: stay.imageUrl || undefined,
        url: `${baseUrl}/stays/${stay.slug}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: stay.location,
          addressRegion: stay.state,
          addressCountry: 'US',
        },
        aggregateRating: stay.rating == null ? undefined : {
          '@type': 'AggregateRating',
          ratingValue: stay.rating,
          reviewCount: stay.reviewCount ?? undefined,
        },
        offers: {
          '@type': 'Offer',
          price: stay.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          ...(primarySpoke
            ? [{ '@type': 'ListItem' as const, position: 2, name: primarySpoke.title, item: `${baseUrl}/${primarySpoke.slug}` }]
            : [{ '@type': 'ListItem' as const, position: 2, name: 'Collection', item: `${baseUrl}/collection` }]
          ),
          { '@type': 'ListItem', position: 3, name: stay.title, item: `${baseUrl}/stays/${stay.slug}` },
        ],
      },
    ],
  }
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
    alternates: {
      canonical: `/stays/${stay.slug}`,
    },
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
  const jsonLd = getStayJsonLd(stay)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StayDetailContent stay={stay} related={related} />
    </>
  )
}
