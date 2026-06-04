import { describe, it, expect, beforeEach } from 'vitest'
import { ListingGeneratorCache } from '../cache'
import type { GenerationResult } from '../types'

const mockResult: GenerationResult = {
  title: 'Enchanted Treehouse in the Redwoods',
  description: 'Nestled 40 feet up in ancient redwood trees...',
  editorialNotes: [
    { category: 'hook', note: 'Opens with height — most guests scroll past ground-level listings.' },
    { category: 'story', note: 'Narrative arc: arrival → ascent → canopy reveal.' },
    { category: 'conversion', note: 'Urgency trigger: "only 2 dates left this month".' },
  ],
  stayTypeAffinity: 'Treehouses thrive on the sense of elevation and separation from the ground world.',
}

describe('ListingGeneratorCache', () => {
  let cache: ListingGeneratorCache

  beforeEach(() => {
    cache = new ListingGeneratorCache()
  })

  it('returns miss for uncached URL', async () => {
    const result = await cache.get('https://www.airbnb.com/rooms/12345')
    expect(result.hit).toBe(false)
    expect(result.data).toBeUndefined()
  })

  it('returns hit after storing', async () => {
    const url = 'https://www.airbnb.com/rooms/12345'
    await cache.set(url, mockResult)
    const result = await cache.get(url)
    expect(result.hit).toBe(true)
    expect(result.data).toEqual(mockResult)
  })

  it('normalizes URLs for cache lookup', async () => {
    await cache.set('https://www.airbnb.com/rooms/12345', mockResult)
    const result = await cache.get('https://www.airbnb.com/rooms/12345?check_in=2026-07-01')
    expect(result.hit).toBe(true)
  })

  it('respects TTL — expired entries are misses', async () => {
    const shortCache = new ListingGeneratorCache(0) // 0ms TTL = instant expiry
    await shortCache.set('https://www.airbnb.com/rooms/12345', mockResult)
    const result = await shortCache.get('https://www.airbnb.com/rooms/12345')
    expect(result.hit).toBe(false)
  })

  it('generates consistent hashes for same URL', async () => {
    const url = 'https://www.airbnb.com/rooms/12345'
    await cache.set(url, mockResult)
    // Different casing should still hit (URLs are case-insensitive for domain)
    const result = await cache.get('https://WWW.AIRBNB.COM/rooms/12345')
    expect(result.hit).toBe(true)
  })
})
