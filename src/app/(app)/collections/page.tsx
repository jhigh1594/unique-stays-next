import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'

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

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

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
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: 'oklch(0.22 0.01 60)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex items-center gap-2 mb-5">
            <Link href="/">
              <span
                className="text-xs font-semibold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Unique Stays USA
              </span>
            </Link>
          </div>

          <div className="max-w-3xl">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'oklch(0.92 0.08 75)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Five curated ways into the map
            </p>

            <h1
              className="text-5xl md:text-6xl font-bold leading-tight mb-5"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.99 0.005 85)' }}
            >
              Pick the trip by its{' '}
              <span style={{ fontStyle: 'italic', color: 'oklch(0.92 0.08 75)' }}>
                texture
              </span>
            </h1>

            <p
              className="text-lg leading-relaxed max-w-xl"
              style={{ color: 'oklch(0.78 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Every collection is a different lens on the same idea: ordinary is optional.
              Browse by what matters most — uniqueness, work setup, pet policy, RV hookup, or EV charging.
            </p>
          </div>
        </div>
      </section>

      {/* COLLECTION CARDS */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
          >
            Five ways to explore{' '}
            <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>
              unique stays
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spokes.map((spoke, i) => (
              <Link key={spoke.slug} href={`/${spoke.slug}`}>
                <div
                  className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: 'oklch(0.99 0.005 85)',
                    border: `1.5px solid ${spoke.accentColor}25`,
                  }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={spoke.heroImage}
                      alt={spoke.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, ${spoke.accentColor}40 0%, transparent 60%)`,
                      }}
                    />
                    {/* Ghost section number */}
                    <span
                      className="absolute top-3 left-4 text-4xl font-black opacity-10"
                      style={{ fontFamily: 'Fraunces, serif', color: spoke.accentColor }}
                      aria-hidden="true"
                    >
                      {ROMAN[i]}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2
                      className="text-xl font-bold mb-1.5 group-hover:text-[oklch(0.55_0.14_38)] transition-colors"
                      style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                    >
                      {spoke.title}
                    </h2>
                    <p
                      className="text-sm leading-snug mb-3"
                      style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {spoke.tagline}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-4 mb-3">
                      {spoke.stats.slice(0, 2).map((stat, j) => (
                        <div key={j}>
                          <span
                            className="text-lg font-bold"
                            style={{ fontFamily: 'Fraunces, serif', color: spoke.accentColor }}
                          >
                            {stat.value}
                          </span>
                          <span
                            className="ml-1.5 text-xs"
                            style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            {stat.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                      style={{ color: spoke.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      Explore collection <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CROSS-LINKS */}
      <section
        className="py-14 border-t border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.96 0.015 85)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/collection">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-colors hover:bg-[oklch(0.55_0.14_38)] hover:text-[oklch(0.99_0.005_85)] hover:border-[oklch(0.55_0.14_38)]"
                style={{
                  borderColor: 'oklch(0.55 0.14 38)',
                  color: 'oklch(0.55 0.14 38)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Browse the full directory
              </span>
            </Link>
            <Link href="/journal">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors hover:bg-[oklch(0.22_0.01_60)] hover:text-[oklch(0.99_0.005_85)]"
                style={{
                  background: 'oklch(0.22 0.01 60)',
                  color: 'oklch(0.99 0.005 85)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Read the Journal
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
