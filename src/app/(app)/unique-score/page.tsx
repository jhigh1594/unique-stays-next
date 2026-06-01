// /unique-score — server page with SEO metadata

import type { Metadata } from 'next'
import { Suspense } from 'react'
import UniqueScoreClient from './UniqueScoreClient'

export const metadata: Metadata = {
  title: 'Unique Score — How Good Is Your Unique Stay Listing?',
  description:
    'Paste your Airbnb, VRBO, or Wander listing URL and get an instant AI-powered quality score. See how your photos, copy, and experience stack up against the best unique stays in America.',
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
    title: 'Unique Score — How Good Is Your Unique Stay Listing?',
    description:
      'Get an instant AI-powered quality score for your unique stay listing. Free analysis with actionable recommendations.',
    type: 'website',
    url: '/unique-score',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unique Score — How Good Is Your Unique Stay Listing?',
    description:
      'Get an instant AI-powered quality score for your unique stay listing. Free analysis with actionable recommendations.',
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
              'AI-powered listing quality analyzer for unique vacation rentals. Get an instant score for your Airbnb, VRBO, or Wander listing.',
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <UniqueScoreClient />
      </Suspense>
    </>
  )
}
