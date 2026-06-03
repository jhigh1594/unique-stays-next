import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env before imports
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'

vi.mock('@/lib/unique-score/scraper', () => ({
  scrapeListing: vi.fn(),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => () => 'mock-model',
}))

import { scrapeListing } from '@/lib/unique-score/scraper'
import { generateObject } from 'ai'
import { POST } from '../route'

const mockScrapeListing = vi.mocked(scrapeListing)
const mockGenerateObject = vi.mocked(generateObject)

function mockRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/listing-generator/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/listing-generator/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when URL is missing', async () => {
    const res = await POST(mockRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 400 for unsupported platform', async () => {
    const res = await POST(mockRequest({ url: 'https://www.booking.com/hotel/us/foo' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Airbnb, VRBO, or Wander')
  })

  it('returns 422 when scraping fails', async () => {
    mockScrapeListing.mockResolvedValueOnce({
      success: false,
      error: 'Could not extract listing data.',
    })

    const res = await POST(mockRequest({ url: 'https://www.airbnb.com/rooms/12345' }))
    expect(res.status).toBe(422)
  })

  it('returns generated result on success', async () => {
    mockScrapeListing.mockResolvedValueOnce({
      success: true,
      data: {
        title: 'Test Treehouse',
        description: 'A treehouse in the woods',
        photoUrls: [],
        amenities: ['WiFi'],
        rating: 4.9,
        reviewCount: 100,
        reviewSnippets: [],
        propertyType: 'Treehouse',
        hostName: 'John',
        location: 'Woodstock, NY',
        platform: 'airbnb',
      },
    })

    mockGenerateObject.mockResolvedValueOnce({
      object: {
        title: 'Enchanted Canopy Treehouse',
        description: 'Nestled 40 feet up in ancient oaks...',
        editorialNotes: [
          { category: 'hook', note: 'Opens with height.' },
          { category: 'story', note: 'Narrative arc.' },
          { category: 'conversion', note: 'Distinction reframe.' },
        ],
        stayTypeAffinity: 'Treehouses thrive on elevation.',
      },
    } as any)

    const res = await POST(mockRequest({ url: 'https://www.airbnb.com/rooms/12345' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.result.title).toBeDefined()
    expect(data.result.description).toBeDefined()
    expect(data.result.editorialNotes).toHaveLength(3)
    expect(data.cached).toBe(false)
  })
})
