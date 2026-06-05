import type { Metadata } from 'next'
import { Suspense } from 'react'
import ListingGeneratorClient from './ListingGeneratorClient'
import ToolCrossLinks from '@/components/ToolCrossLinks'

export const metadata: Metadata = {
  title: 'Free Airbnb Description Generator for Unique Stays',
  description:
    'Generate an AI-crafted listing description for your treehouse, dome, yurt, cabin, or unique stay. Optimized for Airbnb, VRBO, and Wander. Free — no login required.',
  keywords: [
    'airbnb description generator',
    'listing description generator',
    'vrbo listing generator',
    'airbnb title generator',
    'unique stay listing description',
    'treehouse listing description',
    'dome listing description',
  ],
  openGraph: {
    title: 'Free Airbnb Description Generator for Unique Stays',
    description:
      'AI-crafted listing descriptions that capture what makes your unique stay unforgettable. Paste your URL or describe your property.',
    type: 'website',
    url: '/listing-generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Airbnb Description Generator for Unique Stays',
    description:
      'AI-crafted listing descriptions for treehouses, domes, yurts, and unique stays. Free — no login required.',
  },
  alternates: { canonical: '/listing-generator' },
}

export default function ListingGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Listing Description Generator',
            description:
              'AI-powered listing description generator for unique vacation rentals. Free tool for Airbnb, VRBO, and Wander hosts.',
            url: 'https://www.uniquestaysusa.com/listing-generator',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free listing description generation',
            },
          }),
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <ListingGeneratorClient />
      </Suspense>
      <ToolCrossLinks currentSlug="listing-generator" />
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-cream">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-terracotta" />
    </div>
  )
}
