import Image from 'next/image'
import type { CategoryConfig } from '@/lib/categories-config'
import { HERO_FIRST_SLIDE } from './hero-slides'
import HeroClient from './HeroClient'

interface HeroProps {
  categories: CategoryConfig[]
  stats: Array<{ value: number; suffix: string; label: string }>
}

export default function Hero({ categories, stats }: HeroProps) {
  const first = HERO_FIRST_SLIDE

  return (
    <div className="relative min-h-[100svh] w-full" style={{ background: 'oklch(0.13 0.02 40)' }}>
      {/* SSR LCP candidate — painted in initial HTML before client JS */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Image
          src={first.url}
          alt={`${first.label} — ${first.location}`}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={80}
          className="object-cover"
        />
      </div>
      <div className="relative z-10">
        <HeroClient categories={categories} stats={stats} />
      </div>
    </div>
  )
}
