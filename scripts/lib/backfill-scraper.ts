// scripts/lib/backfill-scraper.ts
// Firecrawl JSON schema extraction for structural stay fields

import Firecrawl from '@mendable/firecrawl-js'
import { extractAmenities } from './scraper'

export interface StructuralData {
  price: number | null
  sleeps: number | null
  bedrooms: number | null
  bathrooms: number | null
  rating: number | null
  reviewCount: number | null
  amenities: string[]
}

export interface BackfillScrapeResult {
  success: boolean
  data?: StructuralData
  error?: string
}

const SCRAPE_DELAY_MS = 4000

export async function scrapeStructuralData(
  url: string,
  retryCount = 0,
): Promise<BackfillScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    return { success: false, error: 'FIRECRAWL_API_KEY not set' }
  }

  try {
    const client = new Firecrawl({ apiKey })

    const result = await client.scrape(url, {
      formats: [
        {
          type: 'json',
          schema: {
            type: 'object',
            properties: {
              price: { type: 'number' },
              sleeps: { type: 'number' },
              bedrooms: { type: 'number' },
              bathrooms: { type: 'number' },
              rating: { type: 'number' },
              reviewCount: { type: 'number' },
              amenities: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        'markdown',
      ],
      timeout: 30000,
    })

    if (!result || !result.json) {
      let amenities: string[] = []
      if (result?.markdown) {
        amenities = extractAmenities(result.markdown as string)
      }
      if (amenities.length > 0) {
        return {
          success: true,
          data: {
            price: null,
            sleeps: null,
            bedrooms: null,
            bathrooms: null,
            rating: null,
            reviewCount: null,
            amenities,
          },
        }
      }
      return { success: false, error: 'Scrape returned no structured data' }
    }

    const json = result.json as Record<string, unknown>
    const markdown = (result.markdown as string) ?? ''

    let amenities: string[] = []
    const jsonAmenities = json.amenities
    if (Array.isArray(jsonAmenities) && jsonAmenities.length > 0) {
      amenities = jsonAmenities.filter((a): a is string => typeof a === 'string')
    } else if (markdown) {
      amenities = extractAmenities(markdown)
    }

    return {
      success: true,
      data: {
        price: parseNumber(json.price),
        sleeps: parseNumber(json.sleeps),
        bedrooms: parseNumber(json.bedrooms),
        bathrooms: parseNumber(json.bathrooms),
        rating: parseNumber(json.rating),
        reviewCount: parseNumber(json.reviewCount),
        amenities,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const is429 = message.includes('429') || message.includes('rate limit')

    if (is429 && retryCount < 2) {
      const delay = SCRAPE_DELAY_MS * Math.pow(2, retryCount + 1)
      await new Promise((r) => setTimeout(r, delay))
      return scrapeStructuralData(url, retryCount + 1)
    }

    return { success: false, error: message }
  }
}

function parseNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value > 0 ? value : null
  if (typeof value === 'string') {
    const match = value.match(/\$?([\d.]+)/)
    if (match) {
      const parsed = parseFloat(match[1])
      return parsed > 0 ? parsed : null
    }
  }
  return null
}

export async function scrapeDelay(): Promise<void> {
  await new Promise((r) => setTimeout(r, SCRAPE_DELAY_MS))
}
