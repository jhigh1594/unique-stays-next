import Firecrawl from '@mendable/firecrawl-js'
import type { ScrapeResult } from './types'

const SCRAPE_DELAY_MS = 4000

// Firecrawl scrape with schema extraction for structured listing data
export async function scrapeListing(
  url: string,
  platform: string,
  retryCount = 0,
): Promise<ScrapeResult> {
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
              title: { type: 'string' },
              price: { type: 'number' },
              imageUrl: { type: 'string' },
              available: { type: 'boolean' },
              listingActive: { type: 'boolean' },
            },
          },
        },
      ],
      timeout: 30000,
    })

    if (!result || !result.json) {
      return { success: false, error: 'Scrape returned no structured data' }
    }

    const data = result.json as Record<string, unknown>

    return {
      success: true,
      data: {
        title: typeof data.title === 'string' ? data.title : null,
        price: typeof data.price === 'number' ? data.price : parsePrice(data.price),
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : null,
        available: data.available !== false,
        listingActive: data.listingActive !== false,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const is429 = message.includes('429') || message.includes('rate limit')

    if (is429 && retryCount < 2) {
      const delay = SCRAPE_DELAY_MS * Math.pow(2, retryCount + 1)
      await new Promise((r) => setTimeout(r, delay))
      return scrapeListing(url, platform, retryCount + 1)
    }

    return { success: false, error: message }
  }
}

function parsePrice(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const match = value.match(/\$?(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }
  return null
}

// Delay between scrapes to avoid rate limits
export async function scrapeDelay(): Promise<void> {
  await new Promise((r) => setTimeout(r, SCRAPE_DELAY_MS))
}
