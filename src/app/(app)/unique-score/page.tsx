// /unique-score: server page with SEO metadata

import type { Metadata } from 'next'
import { Suspense } from 'react'
import UniqueScoreClient from './UniqueScoreClient'

export const metadata: Metadata = {
  title: 'Unique Score | Listing Field Report for Hosts',
  description:
    'Paste your Airbnb, VRBO, or Wander listing URL and get a host field report on your photos, copy, trust signals, and standout factor.',
  keywords: [
    'airbnb listing grader',
    'unique stay score',
    'listing quality checker',
    'how good is my airbnb listing',
    'vacation rental listing analysis',
    'airbnb photo quality',
    'listing optimization',
  ],
  openGraph: {
    title: 'Unique Score | Listing Field Report for Hosts',
    description:
      'See your listing through the eyes of a discerning traveler, with a practical field report for hosts.',
    type: 'website',
    url: '/unique-score',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unique Score | Listing Field Report for Hosts',
    description:
      'Paste a listing URL and get an editorial field report for your unique stay.',
  },
  alternates: {
    canonical: '/unique-score',
  },
}

export default function UniqueScorePage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Unique Score',
            description:
              'Listing field report for unique vacation rental hosts. Get a practical score for your Airbnb, VRBO, or Wander listing.',
            url: 'https://www.uniquestaysusa.com/unique-score',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free analysis with 2 dimension scores',
            },
          }),
        }}
      />
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-terracotta border-t-transparent" />
        </div>
      }>
        <UniqueScoreClient />
      </Suspense>
    </>
  )
}
