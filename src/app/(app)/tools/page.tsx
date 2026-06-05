import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, PenLine, Calculator, BadgeCheck, Compass } from 'lucide-react'
import { TOOLS } from '@/lib/tools-config'

export const dynamic = 'force-static'

const BASE_URL = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com').replace(/\/$/, '')

/** Map icon name strings from config to Lucide components. */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  PenLine,
  Calculator,
  BadgeCheck,
  Compass,
}

export function generateMetadata(): Metadata {
  return {
    title: 'Free Vacation Rental Tools — Unique Stays USA',
    description:
      'Free vacation rental tools: listing description generator, build cost calculator, listing score checker, and vacation match quiz. Built for hosts and travelers by Unique Stays USA.',
    alternates: { canonical: '/tools' },
    openGraph: {
      title: 'Free Vacation Rental Tools — Unique Stays USA',
      description:
        'Free vacation rental tools: listing generator, build cost calculator, score checker, and vacation quiz.',
    },
  }
}

const TOOL_COLORS = [
  { accent: 'oklch(0.55 0.14 38)', light: 'oklch(0.95 0.025 75)' },    // terracotta
  { accent: 'oklch(0.38 0.08 145)', light: 'oklch(0.93 0.025 145)' },  // forest
  { accent: 'oklch(0.50 0.14 200)', light: 'oklch(0.93 0.025 200)' },  // blue
  { accent: 'oklch(0.50 0.14 60)', light: 'oklch(0.93 0.025 60)' },    // amber
] as const

export default function ToolsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Tools for Hosts & Travelers',
    description:
      'Free vacation rental tools built by Unique Stays USA.',
    url: `${BASE_URL}/tools`,
    hasPart: TOOLS.map((t) => ({
      '@type': 'WebApplication',
      name: t.title,
      description: t.description,
      url: `${BASE_URL}/${t.slug}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
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
              Free field instruments
            </p>

            <h1
              className="text-5xl md:text-6xl font-bold leading-tight mb-5"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.99 0.005 85)' }}
            >
              Tools for hosts{' '}
              <span style={{ fontStyle: 'italic', color: 'oklch(0.92 0.08 75)' }}>
                & travelers
              </span>
            </h1>

            <p
              className="text-lg leading-relaxed max-w-xl"
              style={{ color: 'oklch(0.78 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Quick, free instruments for the road and the rental. No sign-up, no paywall — just
              useful tools built by people who know short-term rentals.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL CARDS */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
          >
            Free tools for every{' '}
            <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>
              host & traveler
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TOOLS.map((tool, i) => {
              const Icon = ICON_MAP[tool.iconName]
              const colors = TOOL_COLORS[i % TOOL_COLORS.length]

              return (
                <Link key={tool.slug} href={`/${tool.slug}`}>
                  <div
                    className="group relative overflow-hidden rounded-2xl p-6 md:p-8 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                    style={{
                      background: 'oklch(0.99 0.005 85)',
                      border: `1.5px solid ${colors.accent}25`,
                    }}
                  >
                    {/* Ghost section number */}
                    <span
                      className="absolute top-3 right-4 text-5xl font-black opacity-[0.06]"
                      style={{ fontFamily: 'Fraunces, serif', color: colors.accent }}
                      aria-hidden="true"
                    >
                      {['I', 'II', 'III', 'IV'][i]}
                    </span>

                    <div className="flex items-start gap-5">
                      {/* Icon + stamp */}
                      <div
                        className="flex-shrink-0 flex flex-col items-center gap-2"
                      >
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors group-hover:text-[oklch(0.55_0.14_38)]"
                          style={{ background: colors.light, color: colors.accent }}
                        >
                          {Icon && <Icon className="h-5 w-5" />}
                        </span>
                        <span
                          className="text-[0.52rem] font-black tracking-[0.10em] uppercase"
                          style={{ color: 'oklch(0.65 0.04 75)' }}
                        >
                          {tool.stamp}
                        </span>
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <h2
                          className="text-xl font-bold mb-2 group-hover:text-[oklch(0.55_0.14_38)] transition-colors"
                          style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                        >
                          {tool.title}
                        </h2>
                        <p
                          className="text-sm leading-relaxed mb-4"
                          style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {tool.description}
                        </p>
                        <div
                          className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                          style={{ color: colors.accent, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          Try it free <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CROSS-LINKS */}
      <section
        className="py-14 border-t border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.96 0.015 85)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p
            className="text-sm mb-6"
            style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Have a unique property? We&apos;d love to feature it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/submit">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-colors hover:bg-[oklch(0.55_0.14_38)] hover:text-[oklch(0.99_0.005_85)] hover:border-[oklch(0.55_0.14_38)]"
                style={{
                  borderColor: 'oklch(0.55 0.14 38)',
                  color: 'oklch(0.55 0.14 38)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Submit a Stay
              </span>
            </Link>
            <Link href="/collections">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors hover:bg-[oklch(0.22_0.01_60)] hover:text-[oklch(0.99_0.005_85)]"
                style={{
                  background: 'oklch(0.22 0.01 60)',
                  color: 'oklch(0.99 0.005 85)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Browse Collections
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
