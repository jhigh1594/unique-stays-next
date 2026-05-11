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

export const MIN_INDEXABLE_PSEO_STAYS = 3

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
  const label = config.title.toLowerCase()
  return `Explore ${label} in ${stateName}. Compare curated ${label}, view photos and prices, and find memorable stays across UniqueStaysUSA.`
}

export function getPseoIntro(config: SpokeConfig, stateName: string, count: number) {
  const label = config.title.toLowerCase()
  const countPhrase = count === 1 ? '1 curated stay' : `${count} curated stays`

  if (config.slug === 'work-friendly') {
    return `Planning a working trip through ${stateName}? This guide pulls together ${countPhrase} with practical remote-work details like WiFi, desks, quiet settings, and booking context, so you can compare places that work as well as they photograph. Whether you're base-camping in a single spot for a week or hopping between regions, these stays have the connectivity and setup to keep you productive — without trading away the scenery that made you want to work remotely in the first place. Each listing includes verified WiFi speeds, workspace photos, and notes on cell coverage for hotspot fallback.`
  }

  if (config.slug === 'pet-friendly') {
    return `Bringing a dog or cat to ${stateName} changes the search. These ${label} focus on places with clearer pet policies, outdoor access, and host details that help you choose a memorable stay without leaving part of the family behind. We look for fenced yards, nearby trails, pet fees (or the absence of them), and hosts who actually welcome animals rather than merely tolerating them. Every listing on this page has been reviewed for pet-specific details so you can book with confidence and spend less time reading fine print.`
  }

  if (config.slug === 'rv-ready') {
    return `${stateName} is a natural fit for road-trip stays, but hookup details matter. Use this page to compare ${label} with RV-friendly features, scenic settings, and a direct path into the stays worth a closer look. From full-hookup pull-through sites with 50-amp service to more rustic boondocking-adjacent spots with partial utilities, we verify the specs that matter most before you commit a route. Each listing includes rig-length limits, amp service, water and sewer details, and whether the setting lives up to the photographs.`
  }

  if (config.slug === 'ev-ready') {
    return `For EV road trips in ${stateName}, charging access can decide the whole route. These ${label} highlight rentals with on-site charging context, distinctive settings, and easy next steps for checking availability. We track charger types (Tesla Wall Connectors, J1772, Level 2, solar-assisted), estimated charge speeds, and whether the host provides a dedicated parking spot near the charger. If you've ever planned a day around a Supercharger stop, you know how much an overnight charge at your rental changes the calculus of the whole trip.`
  }

  return `${stateName} has more range than a standard hotel search can show. This page collects ${countPhrase} across treehouses, cabins, domes, converted structures, and other memorable places built for travelers who want the stay itself to be part of the trip. We vet every listing for photographic accuracy, host responsiveness, and the kind of architectural or natural detail that makes a place worth talking about. Use the filters to narrow by category, region within the state, or guest capacity — then read the shortlist and see what jumps out.`
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

export function getPseoBreadcrumbJsonLd({
  baseUrl,
  config,
  stateConfig,
}: {
  baseUrl: string
  config: SpokeConfig
  stateConfig: StateConfig
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: config.title,
        item: `${baseUrl}/${config.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: stateConfig.name,
        item: `${baseUrl}/${config.slug}/${stateConfig.slug}`,
      },
    ],
  }
}

export function getSpokeHubJsonLd({
  baseUrl,
  config,
  stays,
}: {
  baseUrl: string
  config: SpokeConfig
  stays: NormalizedStay[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: config.seoTitle,
    description: config.seoDescription,
    url: `${baseUrl}/${config.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: stays.length,
      itemListElement: stays.slice(0, 20).map((stay, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${baseUrl}/stays/${stay.slug}`,
      })),
    },
  }
}

export function getPseoFaqs(config: SpokeConfig, stateName: string): Array<{ question: string; answer: string }> {
  const label = config.title.toLowerCase()

  const templates: Record<SpokeSlug, Array<{ question: string; answer: string }>> = {
    'unique': [
      {
        question: `What types of unique stays are available in ${stateName}?`,
        answer: `${stateName} offers treehouses, geodesic domes, converted barns, houseboats, and architecturally distinctive cabins. Our ${stateName} collection includes verified listings across Airbnb, VRBO, and Wander, each reviewed for the kind of setting that makes a trip memorable.`,
      },
      {
        question: `How much do unique rentals in ${stateName} cost?`,
        answer: `Prices for unique stays in ${stateName} typically range from $75 to $500+ per night depending on the property type, season, and amenities. Treehouses and domes tend to book out early in peak season — reserve well ahead if you're planning a summer or holiday trip.`,
      },
      {
        question: `Are pets allowed at these unique stays in ${stateName}?`,
        answer: `Some unique stays in ${stateName} welcome pets, though policies vary by property. Check our Pet-Friendly collection for ${stateName}-specific listings with fenced yards, pet policies, and host details that go beyond the standard "pets considered" checkbox.`,
      },
    ],
    'work-friendly': [
      {
        question: `What WiFi speeds can I expect at work-friendly stays in ${stateName}?`,
        answer: `Our ${stateName} listings include verified WiFi speeds ranging from 100 Mbps to gigabit fiber. Many rural and mountain properties now offer Starlink as a fallback. Each listing shows the specific speed test result and whether a dedicated desk or workspace is available.`,
      },
      {
        question: `Are these work-friendly stays suitable for team retreats in ${stateName}?`,
        answer: `Several ${stateName} listings accommodate groups with multiple bedrooms, shared common areas, and enough bandwidth for video calls across multiple devices. Filter by sleeps count and WiFi speed to find properties that match your team size and connectivity needs.`,
      },
      {
        question: `How far are these stays from major airports in ${stateName}?`,
        answer: `Drive times vary — some ${label} are within 30 minutes of major airports, while others require a scenic drive of an hour or more. Each listing includes location context so you can plan around flight schedules and arrival times.`,
      },
    ],
    'pet-friendly': [
      {
        question: `What pet amenities do these ${stateName} stays offer?`,
        answer: `Common amenities include fenced yards, dog wash stations, pet beds, designated outdoor areas, and nearby trail access. Each listing specifies which amenities are available and whether there are breed or size restrictions.`,
      },
      {
        question: `Are there pet fees at ${stateName} pet-friendly rentals?`,
        answer: `Pet fees vary by property — some hosts include pets at no extra charge, while others add a per-stay or per-night fee. We note the pet fee structure in each listing so you can factor it into your budget before booking.`,
      },
      {
        question: `Can I bring more than one pet to these ${stateName} stays?`,
        answer: `Many ${stateName} listings allow multiple pets, though some cap the number or total weight. Check the individual listing's pet policy for specifics on multi-pet households, and reach out to the host directly if the policy isn't clear.`,
      },
    ],
    'rv-ready': [
      {
        question: `What hookup types are available at RV stays in ${stateName}?`,
        answer: `${stateName} listings range from full-hookup sites (water, electric, sewer) with 30-amp and 50-amp service to partial-hookup and boondocking-adjacent spots. Each listing specifies the amp service, water availability, and whether the site is pull-through or back-in.`,
      },
      {
        question: `What's the maximum RV length allowed at these ${stateName} sites?`,
        answer: `Maximum rig lengths vary by property. Most ${stateName} listings accommodate rigs from 25 to 45 feet, with some larger pull-through sites available. The listing details include the specific length limit and turn-around space.`,
      },
      {
        question: `Do these ${stateName} RV sites require advance reservations?`,
        answer: `Most curated RV stays in ${stateName} require advance booking, especially during peak travel seasons. We recommend booking 2-4 weeks ahead for popular regions. Each listing links directly to the booking platform for real-time availability.`,
      },
    ],
    'ev-ready': [
      {
        question: `What types of EV chargers are available at these ${stateName} stays?`,
        answer: `${stateName} listings feature a range of charger types including Tesla Wall Connectors, universal J1772 Level 2 chargers, and some solar-assisted setups. Each listing specifies the connector type, estimated charge speed, and whether the charger is dedicated to your unit.`,
      },
      {
        question: `Can I charge my EV overnight at these ${stateName} rentals?`,
        answer: `Yes — all ${label} in our ${stateName} collection have on-site charging available for guest use. Most allow overnight charging so you wake up to a full battery. Check the listing for any time-of-use restrictions or shared-charger policies.`,
      },
      {
        question: `Are there public charging stations near these ${stateName} stays?`,
        answer: `Many ${stateName} listings are located near public DC fast-charging stations in addition to the on-site charger. We include notes on nearby Superchargers and CCS stations when available, so you can plan day trips with confidence.`,
      },
    ],
  }

  return templates[config.slug as SpokeSlug] ?? []
}

export function getPseoFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
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
