import type { Metadata } from 'next'
import { SPOKES_CONFIG, SPOKE_SLUGS } from './spokes-config'
import type { SpokeSlug } from './spokes-config'
import { STATES, STATES_BY_SLUG, getRelatedStates } from './states'
import type { StateConfig } from './states'
import type { NormalizedStay, SpokeConfig } from './types'

export type PseoRouteParams = {
  spoke: string
  state: string
}

export type PseoRouteContext = {
  spoke: SpokeSlug
  state: string
  config: SpokeConfig
  stateConfig: StateConfig
}

export type PseoIndexPolicy = {
  isIndexable: boolean
  isSitemapEligible: boolean
  stayCount: number
}

export const MIN_INDEXABLE_PSEO_STAYS = 1

export function getPseoRouteParams(): PseoRouteParams[] {
  return SPOKE_SLUGS.flatMap((spoke) => (
    STATES.map((state) => ({ spoke, state: state.slug }))
  ))
}

export function resolvePseoRouteContext(params: PseoRouteParams): PseoRouteContext | null {
  if (!isSpokeSlug(params.spoke)) return null

  const stateConfig = STATES_BY_SLUG[params.state]
  if (!stateConfig) return null

  return {
    spoke: params.spoke,
    state: params.state,
    config: SPOKES_CONFIG[params.spoke],
    stateConfig,
  }
}

export function getPseoPageTitle(config: SpokeConfig, stateName: string) {
  return `${config.title} in ${stateName}`
}

export function getPseoMetaDescription(config: SpokeConfig, stateName: string) {
  return `Explore ${config.title.toLowerCase()} in ${stateName}. Compare curated unique rentals, view photos and prices, and find memorable stays across UniqueStaysUSA.`
}

export function getPseoIntro(config: SpokeConfig, stateName: string, count: number) {
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

export function getPseoCanonicalPath(context: PseoRouteContext) {
  return `/${context.spoke}/${context.state}`
}

export function getPseoIndexPolicy(stayCount: number): PseoIndexPolicy {
  const isIndexable = stayCount >= MIN_INDEXABLE_PSEO_STAYS

  return {
    isIndexable,
    isSitemapEligible: isIndexable,
    stayCount,
  }
}

export function getPseoMetadata(context: PseoRouteContext, stayCount: number): Metadata {
  const title = `${getPseoPageTitle(context.config, context.stateConfig.name)} | UniqueStaysUSA`
  const description = getPseoMetaDescription(context.config, context.stateConfig.name)
  const policy = getPseoIndexPolicy(stayCount)

  return {
    title,
    description,
    alternates: {
      canonical: getPseoCanonicalPath(context),
    },
    robots: policy.isIndexable ? undefined : {
      index: false,
      follow: true,
    },
    openGraph: {
      title,
      description,
      images: context.config.heroImage
        ? [{ url: context.config.heroImage, width: 1200, height: 630 }]
        : [],
    },
  }
}

export function getPseoItemListJsonLd({
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
    name: getPseoPageTitle(config, stateName),
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

export function getPseoRelatedStates(stateSlug: string, limit = 6) {
  return getRelatedStates(stateSlug, limit)
}

export function getPseoRelatedSpokes(spoke: SpokeSlug) {
  return SPOKE_SLUGS.filter((slug) => slug !== spoke).map((slug) => SPOKES_CONFIG[slug])
}

export function getPseoStateLinks(spoke: SpokeSlug) {
  return STATES.map((state) => ({
    ...state,
    href: `/${spoke}/${state.slug}`,
  }))
}

export function getPseoSitemapPaths(inventoryCounts: Map<string, number> | Record<string, number>) {
  const getCount = (key: string) => inventoryCounts instanceof Map
    ? inventoryCounts.get(key) ?? 0
    : inventoryCounts[key] ?? 0

  return getPseoRouteParams()
    .filter((params) => getPseoIndexPolicy(getCount(getPseoInventoryKey(params.spoke, params.state))).isSitemapEligible)
    .map((params) => `/${params.spoke}/${params.state}`)
}

export function getPseoInventoryKey(spoke: string, state: string) {
  return `${spoke}:${state}`
}

export function getPseoInventoryCounts(stays: Array<Pick<NormalizedStay, 'state' | 'spokes'>>) {
  const counts = new Map<string, number>()

  stays.forEach((stay) => {
    const state = stateNameToSlug(stay.state)
    if (!state) return

    stay.spokes.forEach((spoke) => {
      if (!isSpokeSlug(spoke)) return
      const key = getPseoInventoryKey(spoke, state)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
  })

  return counts
}

function isSpokeSlug(value: string): value is SpokeSlug {
  return SPOKE_SLUGS.includes(value as SpokeSlug)
}

function stateNameToSlug(name: string) {
  return STATES.find((state) => state.name === name)?.slug ?? null
}
