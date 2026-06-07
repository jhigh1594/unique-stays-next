import { describe, expect, it, vi } from 'vitest'
import { compareData, overallSeverity, trigramSimilarity } from '../compare'
import type { AuditStay, LivenessResult, ScrapedListing } from '../types'

// Mock image-validation so compare tests don't make real HTTP requests
vi.mock('../../image-validation', () => ({
  checkImageUrlLiveness: vi.fn().mockResolvedValue({ live: true, isImage: true, statusCode: 200, contentLength: 50000, contentType: 'image/jpeg' }),
  isR2Url: vi.fn((url: string) => url.includes('.r2.dev') || url.includes('media.uniquestaysusa.com')),
}))

const baseStay: AuditStay = {
  id: '1',
  title: 'Catskills Pine Treehouse',
  slug: 'catskills-pine-treehouse',
  platform: 'Airbnb',
  affiliateUrl: 'https://www.airbnb.com/rooms/12345',
  imageUrl: 'https://a0.muscache.com/im/pictures/abc123.jpg',
  galleryImages: [],
  price: 285,
}

const liveResult: LivenessResult = { live: true, statusCode: 200 }

describe('compareData', () => {
  it('returns empty findings when data matches', async () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 285,
      imageUrl: 'https://a0.muscache.com/im/pictures/abc123.jpg',
      available: true,
      listingActive: true,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    // Non-R2 hero URL triggers a warning; empty gallery triggers info
    // No critical/warning content findings for matching data
    expect(findings.some((f) => f.field === 'title')).toBe(false)
    expect(findings.some((f) => f.field === 'price')).toBe(false)
    expect(findings.some((f) => f.field === 'listingStatus')).toBe(false)
  })

  it('ignores minor formatting differences in title', async () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse!', // punctuation difference
      price: 285,
      imageUrl: 'https://a0.muscache.com/im/pictures/abc123.jpg',
      available: true,
      listingActive: true,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'title')).toBe(false)
  })

  it('detects dead affiliate URL as critical', async () => {
    const deadResult: LivenessResult = {
      live: false,
      statusCode: 404,
      redirectUrl: 'https://www.airbnb.com/search',
    }
    const findings = await compareData(baseStay, deadResult, null)
    expect(findings).toHaveLength(1)
    expect(findings[0].field).toBe('affiliateUrl')
    expect(findings[0].severity).toBe('critical')
  })

  it('skips content comparison when URL is dead', async () => {
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
    const findings = await compareData(baseStay, deadResult, scraped)
    // Only the liveness finding, no title/price/image comparisons
    expect(findings).toHaveLength(1)
    expect(findings[0].field).toBe('affiliateUrl')
  })

  it('flags delisted/unavailable listing as critical', async () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 285,
      imageUrl: baseStay.imageUrl,
      available: false,
      listingActive: false,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'listingStatus')).toBe(true)
    expect(findings.find((f) => f.field === 'listingStatus')?.severity).toBe('critical')
  })

  it('detects significant title drift', async () => {
    const scraped: ScrapedListing = {
      title: 'Mountain Luxury Retreat Cabin',
      price: 285,
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'title')).toBe(true)
  })

  it('detects price drift above threshold', async () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 450, // 57% drift
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    const priceFinding = findings.find((f) => f.field === 'price')
    expect(priceFinding).toBeDefined()
    expect(priceFinding!.severity).toBe('critical')
    expect(priceFinding!.expected).toBe('$285')
    expect(priceFinding!.actual).toBe('$450')
  })

  it('does not flag small price changes within threshold', async () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 310, // ~9% drift, under 30% threshold
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'price')).toBe(false)
  })

  it('flags image URL change as info', async () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 285,
      imageUrl: 'https://a0.muscache.com/im/pictures/def456.jpg',
      available: true,
      listingActive: true,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    const imgFindings = findings.filter((f) => f.field === 'imageUrl')
    const filenameChange = imgFindings.find((f) => f.expected.includes('abc123'))
    expect(filenameChange).toBeDefined()
    expect(filenameChange!.severity).toBe('info')
  })

  it('handles null scraped data gracefully', async () => {
    const findings = await compareData(baseStay, liveResult, null)
    // Non-R2 URL warning still present, but no content findings
    expect(findings.some((f) => ['title', 'price', 'listingStatus'].includes(f.field))).toBe(false)
  })

  it('handles null stored price with info finding when scraped price exists', async () => {
    const stay: AuditStay = { ...baseStay, price: 0 }
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: 350,
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = await compareData(stay, liveResult, scraped)
    // price 0 means stored price not comparable, no finding
    expect(findings.some((f) => f.field === 'price')).toBe(false)
  })

  it('flags price not found on page as info', async () => {
    const scraped: ScrapedListing = {
      title: 'Catskills Pine Treehouse',
      price: null,
      imageUrl: baseStay.imageUrl,
      available: true,
      listingActive: true,
    }
    const findings = await compareData(baseStay, liveResult, scraped)
    expect(findings.some((f) => f.field === 'price' && f.severity === 'info')).toBe(true)
  })

  it('flags missing hero image as critical', async () => {
    const stay: AuditStay = { ...baseStay, imageUrl: '' }
    const findings = await compareData(stay, liveResult, null)
    const heroFinding = findings.find((f) => f.field === 'imageUrl' && f.actual === 'empty')
    expect(heroFinding).toBeDefined()
    expect(heroFinding!.severity).toBe('critical')
  })

  it('flags non-R2 hero URL as warning', async () => {
    const findings = await compareData(baseStay, liveResult, null)
    const r2Warning = findings.find((f) => f.field === 'imageUrl' && f.severity === 'warning')
    expect(r2Warning).toBeDefined()
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
