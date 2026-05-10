import { describe, expect, it } from 'vitest'
import {
  getPseoCanonicalPath,
  getPseoIndexPolicy,
  getPseoInventoryCounts,
  getPseoInventoryKey,
  getPseoItemListJsonLd,
  getPseoMetadata,
  getPseoRouteParams,
  getPseoSitemapPaths,
  resolvePseoRouteContext,
} from './pseo'
import type { NormalizedStay } from './types'

function stay(overrides: Partial<NormalizedStay> = {}): NormalizedStay {
  return {
    id: 1,
    slug: 'california-dog-cabin',
    title: 'California Dog Cabin',
    subtitle: '',
    location: 'Big Sur, California',
    state: 'California',
    region: 'West',
    category: 'cabins',
    spokes: ['pet-friendly'],
    platform: 'VRBO',
    affiliateUrl: 'https://example.com/book',
    imageUrl: 'https://example.com/cabin.jpg',
    price: 320,
    rating: 4.9,
    reviewCount: 88,
    sleeps: 4,
    bedrooms: 2,
    description: 'A dog-friendly cabin.',
    tags: ['Fenced Yard'],
    galleryImages: [],
    editorNote: '',
    bestFor: '',
    bestSeason: '',
    vibe: '',
    featured: false,
    editorsPick: false,
    isNew: false,
    wifiSpeed: '',
    hasDesk: false,
    petFriendly: true,
    petPolicy: 'Dogs welcome',
    rvHookup: false,
    rvDetails: '',
    evCharger: false,
    evDetails: '',
    ...overrides,
  }
}

describe('pSEO route helpers', () => {
  it('builds the full 5 by 50 route matrix', () => {
    const params = getPseoRouteParams()

    expect(params).toHaveLength(250)
    expect(params).toContainEqual({ spoke: 'pet-friendly', state: 'california' })
  })

  it('resolves valid spoke and state params into page context', () => {
    const context = resolvePseoRouteContext({ spoke: 'pet-friendly', state: 'california' })

    expect(context?.config.title).toBe('Pet-Friendly Stays')
    expect(context?.stateConfig.name).toBe('California')
    expect(context && getPseoCanonicalPath(context)).toBe('/pet-friendly/california')
  })

  it('rejects unknown spoke and state params', () => {
    expect(resolvePseoRouteContext({ spoke: 'not-a-spoke', state: 'california' })).toBeNull()
    expect(resolvePseoRouteContext({ spoke: 'pet-friendly', state: 'not-a-state' })).toBeNull()
  })

  it('generates stable metadata and noindexes thin valid pages', () => {
    const context = resolvePseoRouteContext({ spoke: 'pet-friendly', state: 'california' })
    expect(context).not.toBeNull()

    const richMetadata = getPseoMetadata(context!, 2)
    expect(richMetadata.title).toBe('Pet-Friendly Stays in California | UniqueStaysUSA')
    expect(richMetadata.alternates?.canonical).toBe('/pet-friendly/california')
    expect(richMetadata.robots).toBeUndefined()

    const thinMetadata = getPseoMetadata(context!, 0)
    expect(thinMetadata.robots).toEqual({ index: false, follow: true })
  })

  it('builds ItemList JSON-LD without misleading empty rating objects', () => {
    const context = resolvePseoRouteContext({ spoke: 'pet-friendly', state: 'california' })
    const jsonLd = getPseoItemListJsonLd({
      baseUrl: 'https://uniquestaysusa.com',
      config: context!.config,
      stateName: context!.stateConfig.name,
      stays: [
        stay(),
        stay({
          id: 2,
          slug: 'unrated-stay',
          title: 'Unrated Stay',
          imageUrl: '',
          rating: null,
          reviewCount: null,
        }),
      ],
    })

    expect(jsonLd['@type']).toBe('ItemList')
    expect(jsonLd.numberOfItems).toBe(2)
    expect(jsonLd.itemListElement[0].position).toBe(1)
    expect(jsonLd.itemListElement[0].url).toBe('https://uniquestaysusa.com/stays/california-dog-cabin')
    expect(jsonLd.itemListElement[1].item.aggregateRating).toBeUndefined()
    expect(jsonLd.itemListElement[1].item.image).toBeUndefined()
  })

  it('keeps indexing and sitemap eligibility behind one policy', () => {
    expect(getPseoIndexPolicy(1)).toEqual({
      isIndexable: true,
      isSitemapEligible: true,
      stayCount: 1,
    })
    expect(getPseoIndexPolicy(0)).toEqual({
      isIndexable: false,
      isSitemapEligible: false,
      stayCount: 0,
    })
  })

  it('derives sitemap paths from stay inventory counts', () => {
    const counts = getPseoInventoryCounts([
      stay(),
      stay({ id: 2, state: 'California', spokes: ['unique', 'pet-friendly'] }),
      stay({ id: 3, state: 'Atlantis', spokes: ['pet-friendly'] }),
      stay({ id: 4, state: 'California', spokes: ['unknown-spoke'] }),
    ])

    expect(counts.get(getPseoInventoryKey('pet-friendly', 'california'))).toBe(2)
    expect(counts.get(getPseoInventoryKey('unique', 'california'))).toBe(1)
    expect(getPseoSitemapPaths(counts)).toEqual(
      expect.arrayContaining(['/pet-friendly/california', '/unique/california'])
    )
    expect(getPseoSitemapPaths(counts)).not.toContain('/rv-ready/california')
  })
})
