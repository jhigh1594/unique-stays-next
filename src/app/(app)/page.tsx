import { Suspense } from 'react'
import type { Metadata } from 'next'
import Hero from './_home/Hero'
import HeroSection from './_home/HeroSection'
import HomeBody from './_home/HomeBody'
import { HERO_FALLBACK_CATEGORIES, HERO_FALLBACK_STATS } from './_home/home-fallback'
export const revalidate = 86400

export const metadata: Metadata = {
  // Resolved against layout.metadataBase (www) → https://www.uniquestaysusa.com/
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <link rel="preconnect" href="https://img.uniquestaysusa.com" crossOrigin="" />
      <Suspense
        fallback={
          <Hero categories={HERO_FALLBACK_CATEGORIES} stats={HERO_FALLBACK_STATS} />
        }
      >
        <HeroSection />
      </Suspense>
      <Suspense fallback={null}>
        <HomeBody />
      </Suspense>
    </div>
  )
}
