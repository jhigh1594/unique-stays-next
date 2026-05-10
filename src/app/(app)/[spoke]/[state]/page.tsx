import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, ChevronRight } from 'lucide-react'
import StayCard from '@/components/StayCard'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import { STATES, STATES_BY_SLUG, getRelatedStates } from '@/lib/states'
import { getStaysBySpokeAndState } from '@/lib/payload-queries'
import type { NormalizedStay, SpokeConfig } from '@/lib/types'

type PageParams = {
  spoke: string
  state: string
}

export const dynamicParams = false
export const revalidate = 3600

export function generateStaticParams() {
  return SPOKE_SLUGS.flatMap((spoke) => (
    STATES.map((state) => ({ spoke, state: state.slug }))
  ))
}

function getPageTitle(config: SpokeConfig, stateName: string) {
  return `${config.title} in ${stateName}`
}

function getIntro(config: SpokeConfig, stateName: string, count: number) {
  const label = config.title.toLowerCase()
  const countPhrase = count === 1 ? '1 curated stay' : `${count} curated stays`

  if (config.slug === 'work-friendly') {
    return `Planning a working trip through ${stateName}? This guide pulls together ${countPhrase} with practical remote-work details like WiFi, desks, quiet settings, and booking context, so you can compare places that work as well as they photograph.`
  }

  if (config.slug === 'pet-friendly') {
    return `Bringing a dog or cat to ${stateName} changes the search. These ${label} focus on places with clearer pet policies, outdoor access, and host details that help you choose a memorable stay without leaving part of the family behind.`
  }

  if (config.slug === 'rv-ready') {
    return `${stateName} is a natural fit for road-trip stays, but hookup details matter. Use this page to compare ${label} with RV-friendly features, scenic settings, and a direct path into the stays worth a closer look.`
  }

  if (config.slug === 'ev-ready') {
    return `For EV road trips in ${stateName}, charging access can decide the whole route. These ${label} highlight rentals with on-site charging context, distinctive settings, and easy next steps for checking availability.`
  }

  return `${stateName} has more range than a standard hotel search can show. This page collects ${countPhrase} across treehouses, cabins, domes, converted structures, and other memorable places built for travelers who want the stay itself to be part of the trip.`
}

function getMetaDescription(config: SpokeConfig, stateName: string) {
  return `Explore ${config.title.toLowerCase()} in ${stateName}. Compare curated unique rentals, view photos and prices, and find memorable stays across UniqueStaysUSA.`
}

function getItemListJsonLd({
  baseUrl,
  config,
  stateName,
  stays,
}: {
  baseUrl: string
  config: SpokeConfig
  stateName: string
  stays: NormalizedStay[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: getPageTitle(config, stateName),
    numberOfItems: stays.length,
    itemListElement: stays.map((stay, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/stays/${stay.slug}`,
      item: {
        '@type': 'LodgingBusiness',
        name: stay.title,
        image: stay.imageUrl || undefined,
        address: {
          '@type': 'PostalAddress',
          addressRegion: stay.state,
          addressCountry: 'US',
        },
        aggregateRating: stay.rating == null ? undefined : {
          '@type': 'AggregateRating',
          ratingValue: stay.rating,
          reviewCount: stay.reviewCount ?? undefined,
        },
        offers: {
          '@type': 'Offer',
          price: stay.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { spoke, state } = await params
  const config = SPOKES_CONFIG[spoke]
  const stateConfig = STATES_BY_SLUG[state]
  if (!config || !stateConfig) return {}

  const title = `${getPageTitle(config, stateConfig.name)} | UniqueStaysUSA`
  const description = getMetaDescription(config, stateConfig.name)

  return {
    title,
    description,
    alternates: {
      canonical: `/${spoke}/${state}`,
    },
    openGraph: {
      title,
      description,
      images: config.heroImage ? [{ url: config.heroImage, width: 1200, height: 630 }] : [],
    },
  }
}

export default async function SpokeStatePage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { spoke, state } = await params
  const config = SPOKES_CONFIG[spoke]
  const stateConfig = STATES_BY_SLUG[state]
  if (!config || !stateConfig) notFound()

  const stays = await getStaysBySpokeAndState(spoke, stateConfig.name)
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com').replace(/\/$/, '')
  const relatedStates = getRelatedStates(state, 6)
  const relatedSpokes = SPOKE_SLUGS.filter((slug) => slug !== spoke).map((slug) => SPOKES_CONFIG[slug])
  const pageTitle = getPageTitle(config, stateConfig.name)
  const intro = getIntro(config, stateConfig.name, stays.length)
  const itemListJsonLd = getItemListJsonLd({ baseUrl, config, stateName: stateConfig.name, stays })

  return (
    <main className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-[oklch(0.88_0.025_75)]">
        <div className="absolute inset-0">
          <img
            src={config.heroImage}
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, oklch(0.12 0.02 60 / 0.92), oklch(0.12 0.02 60 / 0.48), oklch(0.12 0.02 60 / 0.35))',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[460px] max-w-[1320px] flex-col justify-end px-4 pb-12 pt-32 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center gap-2">
            <Link
              href={`/${spoke}`}
              className="text-xs font-semibold uppercase tracking-widest opacity-75 transition-opacity hover:opacity-100"
              style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {config.title}
            </Link>
            <ChevronRight className="h-3 w-3 opacity-55" style={{ color: 'oklch(0.99 0.005 85)' }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {stateConfig.name}
            </span>
          </div>

          <div className="max-w-3xl">
            <p
              className="mb-4 inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{
                background: `${config.accentColor}33`,
                color: 'oklch(0.99 0.005 85)',
                border: '1px solid oklch(0.99 0.005 85 / 0.2)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {stateConfig.region} collection
            </p>
            <h1
              className="mb-5 text-5xl font-bold leading-tight md:text-6xl"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.99 0.005 85)' }}
            >
              {pageTitle}
            </h1>
            <p
              className="max-w-2xl text-lg leading-relaxed"
              style={{ color: 'oklch(0.88 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {intro}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 border-b border-[oklch(0.88_0.025_75)] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {stays.length === 1 ? '1 stay' : `${stays.length} stays`}
              </p>
              <h2
                className="text-3xl font-bold"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Browse the {stateConfig.name} shortlist
              </h2>
            </div>
            <Link
              href={`/${spoke}`}
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all hover:gap-3"
              style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              View all {config.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {stays.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stays.map((stay, index) => (
                <StayCard
                  key={stay.id}
                  stay={stay}
                  accentColor={config.accentColor}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div
              className="border border-[oklch(0.88_0.025_75)] px-6 py-12 text-center"
              style={{ background: 'oklch(0.99 0.005 85)', borderRadius: '6px' }}
            >
              <h2
                className="mb-2 text-2xl font-bold"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                More {stateConfig.name} stays are being reviewed
              </h2>
              <p
                className="mx-auto max-w-xl text-sm leading-relaxed"
                style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                This page is part of the UniqueStaysUSA state collection. Check the broader hub while we add more verified listings for this exact combination.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        className="border-t border-[oklch(0.88_0.025_75)] py-14"
        style={{ background: 'oklch(0.99 0.005 85)' }}
      >
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Related states
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedStates.map((relatedState) => (
                <Link
                  key={relatedState.slug}
                  href={`/${spoke}/${relatedState.slug}`}
                  className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[oklch(0.94_0.02_75)]"
                  style={{
                    borderColor: 'oklch(0.84 0.025 75)',
                    color: 'oklch(0.34 0.025 60)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {relatedState.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              More ways to browse {stateConfig.name}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relatedSpokes.map((relatedSpoke) => (
                <Link
                  key={relatedSpoke.slug}
                  href={`/${relatedSpoke.slug}/${state}`}
                  className="group flex items-center justify-between border p-4 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: relatedSpoke.accentColorLight,
                    borderColor: `${relatedSpoke.accentColor}40`,
                    borderRadius: '6px',
                  }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                  >
                    {relatedSpoke.title}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: relatedSpoke.accentColor }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
