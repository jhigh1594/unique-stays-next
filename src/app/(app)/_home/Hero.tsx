import Image from 'next/image'
import type { CategoryConfig } from '@/lib/categories-config'
import { HERO_FIRST_SLIDE } from './hero-slides'
import HeroClient from './HeroClient'
import HeroCopy, { type HeroStat } from './HeroCopy'
import HeroMarquee from './HeroMarquee'

interface HeroProps {
  categories: CategoryConfig[]
  stats: HeroStat[]
}

export default function Hero({ categories, stats }: HeroProps) {
  const first = HERO_FIRST_SLIDE

  return (
    <div
      id="main-content"
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{ background: 'oklch(0.13 0.02 40)' }}
    >
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
      <HeroClient />
      <HeroCopy stats={stats} />
      <HeroMarquee categories={categories} />
    </div>
  )
}
