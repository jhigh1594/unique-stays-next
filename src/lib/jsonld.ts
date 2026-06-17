/**
 * Schema.org JSON-LD builders for UniqueStaysUSA.
 *
 * Field provenance — every field below is tagged:
 *   REAL      = value comes from Payload document data (stays / blog-posts)
 *   DERIVED   = computed from real document data (e.g. word count)
 *   CONSTANT  = fixed site constant or schema.org vocabulary default
 *
 * Constraint: no invented ratings, reviews, or people. ratingValue always comes
 * from real stay data; bestRating/worstRating are constants; author is omitted
 * entirely until a real author identity exists (see buildJournalPostJsonLd).
 */

import type { NormalizedStay, NormalizedJournalPost } from './types'
import { toCdnUrlOrRaw } from './image-loader'
import { SPOKES_CONFIG } from './spokes-config'
import { countWordsInLexical } from './lexical-wordcount'

export function siteBaseUrl(): string {
  // CONSTANT-ish: resolved from env at render time.
  return process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://www.uniquestaysusa.com'
}

// ── Constants (schema.org vocabulary defaults) ──────────────────────────────
const BEST_RATING = 5 // CONSTANT
const WORST_RATING = 1 // CONSTANT
const PRICE_CURRENCY = 'USD' // CONSTANT

// ── Organization + WebSite (site-wide, rendered in root layout) ─────────────
export function buildOrganizationGraph(baseUrl = siteBaseUrl()) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`, // CONSTANT @id for @graph linkage
        name: 'UniqueStaysUSA',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo-illustrated.png`,
        },
        description:
          'Curated directory of unique vacation rentals across the USA — treehouses, domes, cabins, houseboats, and more.',
        // sameAs intentionally removed: no real brand social profile is configured yet
        // (footer's instagram link is a bare placeholder, not a real profile URL).
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@uniquestaysusa.com',
          contactType: 'customer service',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`, // CONSTANT @id for @graph linkage
        name: 'UniqueStaysUSA',
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/collection?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}

// ── Stay detail page (LodgingBusiness + BreadcrumbList) ─────────────────────
export function buildStayJsonLd(stay: NormalizedStay, baseUrl = siteBaseUrl()) {
  const primarySpoke = stay.spokes.map((s) => SPOKES_CONFIG[s]).find(Boolean)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LodgingBusiness',
        '@id': `${baseUrl}/stays/${stay.slug}#lodging`,
        name: stay.title, // REAL
        description: stay.description, // REAL
        image: toCdnUrlOrRaw(stay.imageUrl, { width: 1200 }), // REAL (CDN-routed)
        url: `${baseUrl}/stays/${stay.slug}`, // CONSTANT pattern + REAL slug
        address: {
          '@type': 'PostalAddress',
          addressLocality: stay.location, // REAL
          addressRegion: stay.state, // REAL
          addressCountry: 'US', // CONSTANT
        },
        aggregateRating:
          stay.rating == null
            ? undefined
            : {
                '@type': 'AggregateRating',
                ratingValue: stay.rating, // REAL — payload stays.rating, never hardcoded
                bestRating: BEST_RATING, // CONSTANT
                worstRating: WORST_RATING, // CONSTANT
                reviewCount: stay.reviewCount ?? undefined, // REAL
              },
        // Offer only when a real price exists (price=0 == "price unavailable").
        ...(stay.price != null && stay.price > 0
          ? {
              offers: {
                '@type': 'Offer',
                url: stay.affiliateUrl || undefined, // REAL affiliate link — machine-readable
                price: stay.price, // REAL
                priceCurrency: PRICE_CURRENCY, // CONSTANT
                availability: 'https://schema.org/InStock', // CONSTANT heuristic
                itemOffered: {
                  '@type': 'LodgingBusiness',
                  name: stay.title, // REAL
                },
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          ...(primarySpoke
            ? [
                {
                  '@type': 'ListItem' as const,
                  position: 2,
                  name: primarySpoke.title,
                  item: `${baseUrl}/${primarySpoke.slug}`,
                },
              ]
            : [
                {
                  '@type': 'ListItem' as const,
                  position: 2,
                  name: 'Collection',
                  item: `${baseUrl}/collection`,
                },
              ]),
          {
            '@type': 'ListItem',
            position: 3,
            name: stay.title, // REAL
            item: `${baseUrl}/stays/${stay.slug}`,
          },
        ],
      },
    ],
  }
}

// ── Journal post (BlogPosting) ──────────────────────────────────────────────
//
// author is INTENTIONALLY OMITTED: the BlogPosts collection has no author field
// and no real author identity (Person + sameAs) is configured anywhere on the
// site. Per the structured-data constraint, do not invent a Person. When a real
// author identity is added (schema field + populated data), add:
//   author: { '@type': 'Person', '@id': `${baseUrl}/#author-<slug>`, name, sameAs: [...] }
export function buildJournalPostJsonLd(
  post: NormalizedJournalPost,
  baseUrl = siteBaseUrl(),
) {
  const wordCount = countWordsInLexical(post.content) // DERIVED from real Lexical body

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${baseUrl}/journal/${post.slug}#article`, // CONSTANT pattern + REAL slug
    headline: post.title, // REAL
    description: post.excerpt, // REAL
    image: toCdnUrlOrRaw(post.heroImageUrl, { width: 1200 }), // REAL (CDN-routed)
    url: `${baseUrl}/journal/${post.slug}`,
    datePublished: post.publishedAt || undefined, // REAL
    dateModified: post.updatedAt || post.publishedAt || undefined, // REAL (payload updatedAt)
    wordCount, // DERIVED
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`, // links to the org node rendered in layout
      name: 'UniqueStaysUSA',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-illustrated.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/journal/${post.slug}`,
    },
  }
}

// ── Homepage (CollectionPage + ItemList of top stays) ───────────────────────
export function buildHomepageJsonLd(
  stays: NormalizedStay[],
  baseUrl = siteBaseUrl(),
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/#collectionpage`,
        name: 'UniqueStaysUSA — Curated Unique Vacation Rentals',
        url: baseUrl,
        description:
          'Discover treehouses, geodesic domes, cave dwellings, houseboats, and more extraordinary stays across the USA.',
        isPartOf: { '@id': `${baseUrl}/#website` },
        mainEntity: { '@id': `${baseUrl}/#itemlist` },
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}/#itemlist`,
        name: "Editors' Picks — Unique Stays", // describes the curated set passed in
        numberOfItems: stays.length, // REAL count
        itemListElement: stays.map((stay, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: stay.title, // REAL
          url: `${baseUrl}/stays/${stay.slug}`, // REAL slug
          item: {
            '@type': 'LodgingBusiness',
            name: stay.title, // REAL
            url: `${baseUrl}/stays/${stay.slug}`,
            ...(stay.imageUrl
              ? { image: toCdnUrlOrRaw(stay.imageUrl, { width: 1200 }) } // REAL
              : {}),
            ...(stay.rating == null
              ? {}
              : {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: stay.rating, // REAL
                    bestRating: BEST_RATING, // CONSTANT
                    worstRating: WORST_RATING, // CONSTANT
                    reviewCount: stay.reviewCount ?? undefined, // REAL
                  },
                }),
          },
        })),
      },
    ],
  }
}
