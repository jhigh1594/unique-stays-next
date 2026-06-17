import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowRight, ExternalLink, ChevronRight } from 'lucide-react'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import type { SpokeSlug } from '@/lib/spokes-config'
import { getSpokeHubJsonLd, getPseoStateLinks } from '@/lib/pseo'
import { toCdnUrlOrRaw } from '@/lib/image-loader'
import { getStaysBySpoke } from '@/lib/payload-queries'
import SpokeFilterBar from './_spoke/SpokeFilterBar'

export const dynamicParams = false
export const revalidate = 86400

export function generateStaticParams() {
  return SPOKE_SLUGS.map((slug) => ({ spoke: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ spoke: string }>
}): Promise<Metadata> {
  const { spoke } = await params
  const config = SPOKES_CONFIG[spoke]
  if (!config) return {}
  return {
    title: { absolute: config.seoTitle },
    description: config.seoDescription,
    alternates: {
      canonical: `/${spoke}`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      images: config.heroImage
        ? [{ url: toCdnUrlOrRaw(config.heroImage, { width: 1200 }) as string, width: 1200, height: 630 }]
        : [],
    },
  }
}

function SpokeCallout({ slug, config }: { slug: SpokeSlug; config: typeof SPOKES_CONFIG[string] }) {
  const callouts: Record<SpokeSlug, { title: string; body: string; cta: string }> = {
    'unique': {
      title: "Can't find what you're looking for?",
      body: "We're constantly adding new extraordinary stays. Submit a hidden gem you've discovered and we'll review it for the directory.",
      cta: 'Submit a Stay',
    },
    'work-friendly': {
      title: 'Are you a remote-work-ready host?',
      body: 'If your property has verified high-speed WiFi and a dedicated workspace, get listed in our Work-Friendly directory and reach thousands of digital nomads.',
      cta: 'List Your Property',
    },
    'pet-friendly': {
      title: 'Host a pet-friendly property?',
      body: 'Earn more bookings by getting listed in our Pet-Friendly directory. Travelers with pets are loyal, high-value guests who book longer stays.',
      cta: 'Get Listed',
    },
    'rv-ready': {
      title: 'Have RV hookups on your property?',
      body: 'The RV travel market is booming. Get your hookup site in front of thousands of RV travelers planning their next adventure.',
      cta: 'List Your Site',
    },
    'ev-ready': {
      title: 'Have an EV charger at your property?',
      body: 'EV drivers specifically seek out properties with on-site charging. Get listed and capture this fast-growing, high-income traveler segment.',
      cta: 'Get EV Verified',
    },
  }

  const c = callouts[slug]

  return (
    <section className="py-14" style={{ background: config.accentColorLight }}>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              {c.title}
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {c.body}
            </p>
          </div>
          <Link href="/submit">
            <button
              className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all hover:gap-3 hover:shadow-lg"
              style={{
                background: config.accentColor,
                color: 'oklch(0.99 0.005 85)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {c.cta} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default async function SpokePage({
  params,
}: {
  params: Promise<{ spoke: string }>
}) {
  const { spoke } = await params
  const config = SPOKES_CONFIG[spoke]
  if (!config) notFound()

  const stays = await getStaysBySpoke(spoke)
  const uniqueStates = new Set(stays.map((s) => s.state)).size
  const dynamicStats = [
    { value: `${stays.length}+`, label: config.stats[0].label },
    { value: `${uniqueStates}`, label: config.stats[1].label },
    ...config.stats.slice(2),
  ]
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://www.uniquestaysusa.com').replace(/\/$/, '')
  const hubJsonLd = getSpokeHubJsonLd({ baseUrl, config, stays })
  const spokeSlug = spoke as SpokeSlug
  const siblings = SPOKE_SLUGS.filter((s) => s !== spoke).map((s) => SPOKES_CONFIG[s])
  const stateLinks = getPseoStateLinks(spokeSlug)
  const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubJsonLd) }}
      />

      {/* HERO */}
      <section className="relative min-h-[480px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={config.heroImage}
            alt={config.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, oklch(0.12 0.02 60 / 0.92) 0%, oklch(0.12 0.02 60 / 0.55) 50%, oklch(0.12 0.02 60 / 0.25) 100%)`,
            }}
          />
        </div>

        <div className="relative z-10 w-full pb-12 pt-32">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-5">
              <Link href="/">
                <span
                  className="text-xs font-semibold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Unique Stays USA
                </span>
              </Link>
              <ChevronRight className="w-3 h-3 opacity-50" style={{ color: 'oklch(0.99 0.005 85)' }} />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {config.title}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                  style={{
                    background: `${config.accentColor}33`,
                    color: 'oklch(0.99 0.005 85)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid oklch(0.99 0.005 85 / 0.2)`,
                  }}
                >
                  <span>{config.heroEmoji}</span>
                  <span>Curated by Unique Stays USA</span>
                </div>

                <h1
                  className="text-5xl md:text-6xl font-bold leading-tight mb-4"
                  style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.99 0.005 85)' }}
                >
                  {config.title.split(' ').map((word, i, arr) =>
                    i === arr.length - 1 ? (
                      <span key={i} style={{ fontStyle: 'italic', color: 'oklch(0.92 0.08 75)' }}>
                        {' '}{word}
                      </span>
                    ) : (
                      <span key={i}>{i > 0 ? ' ' : ''}{word}</span>
                    )
                  )}
                </h1>

                <p
                  className="text-lg leading-relaxed max-w-xl"
                  style={{ color: 'oklch(0.85 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {config.description}
                </p>

                <div
                  className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'oklch(0.99 0.005 85 / 0.12)',
                    color: 'oklch(0.85 0.01 85)',
                    border: '1px solid oklch(0.99 0.005 85 / 0.2)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {config.externalDomain} redirects here
                </div>

                <p
                  className="mt-3 text-xs"
                  style={{ color: 'oklch(0.70 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Last updated {lastUpdated}
                </p>
              </div>

              <div className="flex gap-6">
                {dynamicStats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="text-3xl font-bold"
                      style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.92 0.08 75)' }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-xs mt-0.5 opacity-70"
                      style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH + FILTERS + LISTINGS (client component) */}
      <SpokeFilterBar stays={stays} config={config} spokeSlug={spokeSlug} />

      {/* SPOKE-SPECIFIC CALLOUT */}
      <SpokeCallout slug={spokeSlug} config={config} />

      {/* STATE INTERSECTIONS */}
      <section
        className="py-16 border-t border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.965 0.015 85)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Browse by state
            </p>
            <h2
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Find {config.title.toLowerCase()} near your next route
            </h2>
            <p
              className="max-w-2xl text-sm leading-relaxed"
              style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Jump into state-level shortlists built for discovery, from regional road trips to long-weekend escapes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {stateLinks.map((stateLink) => (
              <Link
                key={stateLink.slug}
                href={stateLink.href}
                className="group flex items-center justify-between border px-3 py-2 text-sm font-semibold transition-colors hover:bg-[oklch(0.99_0.005_85)]"
                style={{
                  borderColor: 'oklch(0.84 0.025 75)',
                  borderRadius: '6px',
                  color: 'oklch(0.34 0.025 60)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                <span>{stateLink.name}</span>
                <ArrowRight
                  className="h-3.5 w-3.5 opacity-45 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                  style={{ color: config.accentColor }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CROSS-LINK TO OTHER SPOKES */}
      <section
        className="py-16 border-t border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.99 0.005 85)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              More from Unique Stays USA
            </p>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Explore Other Collections
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {siblings.map((s) => (
              <Link key={s.slug} href={`/${s.slug}`}>
                <div
                  className="group relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: s.accentColorLight,
                    border: `1.5px solid ${s.accentColor}30`,
                  }}
                >
                  <div className="text-3xl mb-3">{s.heroEmoji}</div>
                  <h3
                    className="font-bold text-sm mb-1"
                    style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-xs leading-snug opacity-70"
                    style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {s.tagline}
                  </p>
                  <div
                    className="mt-3 flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                    style={{ color: s.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Explore <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/collections">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors hover:bg-[oklch(0.22_0.01_60)] hover:text-[oklch(0.99_0.005_85)]"
                style={{
                  background: 'oklch(0.22 0.01 60)',
                  color: 'oklch(0.99 0.005 85)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                View all collections <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
