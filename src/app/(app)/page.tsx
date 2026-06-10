import { Suspense } from 'react'
import Hero from './_home/Hero'
import HeroSection from './_home/HeroSection'
import HomeBody from './_home/HomeBody'
import { HERO_FALLBACK_CATEGORIES, HERO_FALLBACK_STATS } from './_home/home-fallback'
import { HERO_FIRST_IMAGE } from './_home/hero-slides'
import { buildR2CdnUrl } from '@/lib/image-loader'

export const revalidate = 86400

const HERO_PRELOAD_WIDTH = 1200

export default function HomePage() {
  const heroPreload =
    buildR2CdnUrl(HERO_FIRST_IMAGE, HERO_PRELOAD_WIDTH) ?? HERO_FIRST_IMAGE

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <link rel="preconnect" href="https://img.uniquestaysusa.com" crossOrigin="" />
      <link rel="preload" as="image" href={heroPreload} fetchPriority="high" />
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
