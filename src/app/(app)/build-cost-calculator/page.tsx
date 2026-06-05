import type { Metadata } from 'next'
import { Suspense } from 'react'
import BuildCostCalculatorClient from './BuildCostCalculatorClient'
import ToolCrossLinks from '@/components/ToolCrossLinks'

export const metadata: Metadata = {
  title: 'How Much Does It Cost to Build a Treehouse? Free Calculator',
  description:
    'Estimate build cost, furnishing budget, revenue, and ROI for treehouses, domes, yurts, A-frames, tiny houses, cabins, and glamping tents.',
  keywords: [
    'treehouse build cost calculator',
    'dome home cost',
    'yurt cost calculator',
    'glamping pod cost',
    'a frame cabin cost',
    'unique stay building cost',
    'glamping business calculator',
  ],
  openGraph: {
    title: 'Unique Stay Building Cost Calculator',
    description:
      'Estimate the cost and payback timeline for treehouses, domes, yurts, A-frames, cabins, tiny houses, and glamping tents.',
    type: 'website',
    url: '/build-cost-calculator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unique Stay Building Cost Calculator',
    description:
      'Plan a treehouse, dome, yurt, cabin, or glamping tent with a free build cost and ROI estimate.',
  },
  alternates: { canonical: '/build-cost-calculator' },
}

export default function BuildCostCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Unique Stay Building Cost Calculator',
            description:
              'Free calculator for estimating unique stay build costs, nightly revenue, and ROI timeline.',
            url: 'https://www.uniquestaysusa.com/build-cost-calculator',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free building cost and ROI estimate',
            },
          }),
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <BuildCostCalculatorClient />
      </Suspense>
      <ToolCrossLinks currentSlug="build-cost-calculator" />
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
