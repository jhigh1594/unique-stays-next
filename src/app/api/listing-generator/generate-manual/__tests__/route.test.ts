import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env before imports
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => () => 'mock-model',
}))

import { generateObject } from 'ai'
import { POST } from '../route'

const mockGenerateObject = vi.mocked(generateObject)

function mockRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/listing-generator/generate-manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/listing-generator/generate-manual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(mockRequest({ stayType: 'treehouse' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid stay type', async () => {
    const res = await POST(mockRequest({
      stayType: 'skyscraper',
      propertyName: 'Test',
      city: 'Test',
      state: 'Test',
      bedrooms: 1,
      bathrooms: 1,
      sleeps: 2,
      standoutFeatures: ['A', 'B', 'C'],
      vibe: 'romantic',
    }))
    expect(res.status).toBe(400)
  })

  it('returns generated result on valid input', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        title: 'Romantic Treehouse Escape',
        description: 'Wake up in the canopy...',
        editorialNotes: [
          { category: 'hook', note: 'Test hook note' },
          { category: 'story', note: 'Test story note' },
          { category: 'conversion', note: 'Test conversion note' },
        ],
        stayTypeAffinity: 'Treehouses offer unmatched seclusion.',
      },
    } as any)

    const res = await POST(mockRequest({
      stayType: 'treehouse',
      propertyName: 'Catskills Pine Treehouse',
      city: 'Woodstock',
      state: 'New York',
      bedrooms: 2,
      bathrooms: 1,
      sleeps: 4,
      standoutFeatures: ['Stargazing deck', 'Wood-burning stove', 'Canopy views'],
      vibe: 'romantic',
    }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.result.title).toBeDefined()
    expect(data.cached).toBe(false)
  })
})
