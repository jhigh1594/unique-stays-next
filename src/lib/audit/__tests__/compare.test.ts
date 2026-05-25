import { describe, expect, it } from 'vitest'
import { compareData, overallSeverity, trigramSimilarity } from '../compare'
import type { AuditStay, LivenessResult, ScrapedListing } from '../types'

const baseStay: AuditStay = {
  id: '1',
  title: 'Catskills Pine Treehouse',
  slug: 'catskills-pine-treehouse',
  platform: 'Airbnb',
  affiliateUrl: 'https://www.airbnb.com/rooms/12345',
  imageUrl: 'https://a0.muscache.com/im/pictures/abc123.jpg',
  price: 285,
}

const liveResult: LivenessResult = { live: true, statusCode: 200 }

describe('compareData', () => {
  it('returns empty findings when data matches', () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 285,
      imageUrl: 'https://a0.muscache.com/im/pictures/abc123.jpg',
      available: true,
      listingActive: true,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    expect(findings).toHaveLength(0)
  })

  it('ignores minor formatting differences in title', () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse!', // punctuation difference
      price: 285,
      imageUrl: 'https://a0.muscache.com/im/pictures/abc123.jpg',
      available: true,
      listingActive: true,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    expect(findings).toHaveLength(0)
  })

  it('detects dead affiliate URL as critical', () => {
    const deadResult: LivenessResult = {
      live: false,
      statusCode: 404,
      redirectUrl: 'https://www.airbnb.com/search',
    }
    const findings = compareData(baseStay, deadResult, null)
    expect(findings).toHaveLength(1)
    expect(findings[0].field).toBe('affiliateUrl')
    expect(findings[0].severity).toBe('critical')
  })

  it('skips content comparison when URL is dead', () => {
    const deadResult: LivenessResult = {
      live: false,
      statusCode: 404,
    }
    const scraped: ScrapedListing = {
      title: 'Completely Different Name',
      price: 999,
      imageUrl: 'https://example.com/different.jpg',
      available: false,
      listingActive: false,
    }
    const findings = compareData(baseStay, deadResult, scraped)
    // Only the liveness finding, no title/price/image comparisons
    expect(findings).toHaveLength(1)
    expect(findings[0].field).toBe('affiliateUrl')
  })

  it('flags delisted/unavailable listing as critical', () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 285,
      imageUrl: baseStay.imageUrl,
      available: false,
      listingActive: false,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'listingStatus')).toBe(true)
    expect(findings.find((f) => f.field === 'listingStatus')?.severity).toBe('critical')
  })

  it('detects significant title drift', () => {
    const scraped: ScrapedListing = {
      title: 'Mountain Luxury Retreat Cabin',
      price: 285,
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'title')).toBe(true)
  })

  it('detects price drift above threshold', () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 450, // 57% drift
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    const priceFinding = findings.find((f) => f.field === 'price')
    expect(priceFinding).toBeDefined()
    expect(priceFinding!.severity).toBe('critical')
    expect(priceFinding!.expected).toBe('$285')
    expect(priceFinding!.actual).toBe('$450')
  })

  it('does not flag small price changes within threshold', () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 310, // ~9% drift, under 30% threshold
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'price')).toBe(false)
  })

  it('flags image URL change as info', () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 285,
      imageUrl: 'https://a0.muscache.com/im/pictures/def456.jpg',
      available: true,
      listingActive: true,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    const imgFinding = findings.find((f) => f.field === 'imageUrl')
    expect(imgFinding).toBeDefined()
    expect(imgFinding!.severity).toBe('info')
  })

  it('handles null scraped data gracefully', () => {
    const findings = compareData(baseStay, liveResult, null)
    expect(findings).toHaveLength(0) // Live URL, no scrape data = nothing to compare
  })

  it('handles null stored price with info finding when scraped price exists', () => {
    const stay: AuditStay = { ...baseStay, price: 0 }
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 350,
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = compareData(stay, liveResult, scraped)
    // price 0 means stored price not comparable, no finding
    expect(findings.some((f) => f.field === 'price')).toBe(false)
  })

  it('flags price not found on page as info', () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: null,
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'price' && f.severity === 'info')).toBe(true)
  })
})

describe('overallSeverity', () => {
  it('returns critical when any finding is critical', () => {
    expect(
      overallSeverity([
        { field: 'a', expected: '', actual: '', severity: 'info' },
        { field: 'b', expected: '', actual: '', severity: 'critical' },
      ]),
    ).toBe('critical')
  })

  it('returns warning when no critical but warning exists', () => {
    expect(
      overallSeverity([{ field: 'a', expected: '', actual: '', severity: 'warning' }]),
    ).toBe('warning')
  })

  it('returns info for info-only findings', () => {
    expect(overallSeverity([{ field: 'a', expected: '', actual: '', severity: 'info' }])).toBe(
      'info',
    )
  })

  it('returns info for empty findings', () => {
    expect(overallSeverity([])).toBe('info')
  })
})

describe('trigramSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(trigramSimilarity('hello world', 'hello world')).toBe(1)
  })

  it('returns high similarity for minor differences', () => {
    expect(trigramSimilarity('Catskills Treehouse', 'Catskills Treehouse!')).toBeGreaterThan(0.8)
  })

  it('returns low similarity for completely different strings', () => {
    expect(trigramSimilarity('Catskills Treehouse', 'Mountain Luxury Villa')).toBeLessThan(0.3)
  })

  it('handles empty strings', () => {
    expect(trigramSimilarity('', '')).toBe(1)
    expect(trigramSimilarity('hello', '')).toBe(0)
  })
})
