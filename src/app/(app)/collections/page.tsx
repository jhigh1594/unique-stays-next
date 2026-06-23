import type { Metadata } from 'next'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import CollectionsContent from './_collections/CollectionsContent'

export const dynamic = 'force-static'

const BASE_URL = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://www.uniquestaysusa.com').replace(/\/$/, '')

export function generateMetadata(): Metadata {
  return {
    title: 'Unique Vacation Rental Collections — Unique Stays USA',
    description:
      'Explore five curated collections of extraordinary vacation rentals across America. From treehouses and domes to pet-friendly retreats and EV-charged escapes.',
    alternates: { canonical: '/collections' },
    openGraph: {
      title: 'Unique Vacation Rental Collections — Unique Stays USA',
      description:
        'Explore five curated collections of extraordinary vacation rentals across America.',
    },
  }
}

export default function CollectionsPage() {
  const spokes = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Curated Vacation Rental Collections',
    description:
      'Five curated collections of extraordinary vacation rentals across America.',
    url: `${BASE_URL}/collections`,
    hasPart: spokes.map((s) => ({
      '@type': 'CollectionPage',
      name: s.title,
      url: `${BASE_URL}/${s.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionsContent />
    </>
  )
}
