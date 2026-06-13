// Scraping module for platform listing pages
// Primary: Firecrawl. Fallback: raw HTTP fetch when credits exhausted.

import Firecrawl from '@mendable/firecrawl-js'
import { extractJsonLdImageUrls } from './jsonld-images'

export interface ScrapedData {
  description: string
  amenities: string[]
  neighborhood: string
  photoUrls: string[]
}

export interface ScrapeResult {
  success: boolean
  data?: ScrapedData
  error?: string
}

function isCreditsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('Insufficient credits') || msg.includes('credits') || msg.includes('429')
}

async function scrapeWithFetch(url: string): Promise<{ markdown: string; html: string }> {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const html = await resp.text()
  const markdown = htmlToMarkdown(html)
  return { markdown, html }
}

function htmlToMarkdown(html: string): string {
  let md = html
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  md = md.replace(/<br\s*\/?>/gi, '\n')
  md = md.replace(/<\/p>/gi, '\n\n')
  md = md.replace(/<\/h[1-6]>/gi, '\n\n')
  md = md.replace(/<h[1-6][^>]*>/gi, (m) => {
    const level = parseInt(m.match(/<h([1-6])/)?.[1] ?? '2')
    return '#'.repeat(level) + ' '
  })
  md = md.replace(/<li[^>]*>/gi, '- ')
  md = md.replace(/<[^>]+>/g, '')
  md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  md = md.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  md = md.replace(/\n{3,}/g, '\n\n')
  return md.trim()
}

export async function scrapeListing(affiliateUrl: string, apiKey?: string): Promise<ScrapeResult> {
  const key = apiKey ?? process.env.FIRECRAWL_API_KEY

  let markdown = ''
  let html = ''

  if (key) {
    try {
      const client = new Firecrawl({ apiKey: key, apiUrl: 'https://api.firecrawl.dev' })
      const result = await client.scrape(affiliateUrl, {
        formats: ['markdown', 'html'],
        timeout: 30000,
      })
      if (result?.markdown) {
        markdown = result.markdown as string
        html = (result.html as string) ?? ''
      }
    } catch (err) {
      if (!isCreditsError(err)) {
        const message = err instanceof Error ? err.message : String(err)
        return { success: false, error: message }
      }
      // Credits exhausted — fall through to fetch fallback
      process.stdout.write('  Firecrawl credits exhausted, using fetch fallback\n')
    }
  }

  if (!markdown) {
    try {
      const fetched = await scrapeWithFetch(affiliateUrl)
      markdown = fetched.markdown
      html = fetched.html
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: `Fetch fallback failed: ${message}` }
    }
  }

  if (!markdown || markdown.length < 50) {
    return { success: false, error: 'Scrape returned insufficient content' }
  }

  const description = extractDescription(markdown)
  const amenities = extractAmenities(markdown)
  const neighborhood = extractNeighborhood(markdown)
  const photoUrls = extractPhotoUrls(html, markdown)

  return {
    success: true,
    data: { description, amenities, neighborhood, photoUrls },
  }
}

function extractDescription(markdown: string): string {
  // Look for common listing description sections
  const sections = markdown.split(/\n#{1,3}\s/)
  for (const section of sections) {
    const lower = section.toLowerCase()
    if (
      lower.startsWith('about') ||
      lower.startsWith('the space') ||
      lower.startsWith('description') ||
      lower.startsWith('property details')
    ) {
      // Take the content after the heading, up to 2000 chars
      const content = section.replace(/^[^\n]*\n/, '').trim()
      if (content.length > 50) return content.slice(0, 2000)
    }
  }

  // Fallback: first substantial paragraph
  const paragraphs = markdown.split(/\n\n+/).filter((p) => p.trim().length > 100)
  if (paragraphs.length > 0) {
    return paragraphs[0].trim().slice(0, 2000)
  }

  return ''
}

export function extractAmenities(markdown: string): string[] {
  const amenities: string[] = []
  const lower = markdown.toLowerCase()

  // Look for amenities section markers
  const amenityMarkers = [
    'amenities',
    'what this place offers',
    'highlights',
    'features',
    'this home offers',
  ]

  const lines = markdown.split('\n')
  let inAmenitySection = false

  for (const line of lines) {
    const lineLower = line.toLowerCase().trim()

    if (amenityMarkers.some((m) => lineLower.includes(m))) {
      inAmenitySection = true
      continue
    }

    if (inAmenitySection) {
      // End amenity section at next heading or blank area
      if (line.startsWith('#') || (line.trim() === '' && amenities.length > 0)) {
        if (amenities.length > 0) break
        continue
      }

      // Extract list items
      const item = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim()
      if (item.length > 2 && item.length < 80) {
        amenities.push(item)
      }

      // Cap at 30 amenities
      if (amenities.length >= 30) break
    }
  }

  return amenities
}

function extractNeighborhood(markdown: string): string {
  const lower = markdown.toLowerCase()
  const neighborhoodMarkers = [
    'neighborhood',
    'location',
    'getting around',
    'the area',
    'surroundings',
    'where you\'ll be',
  ]

  const lines = markdown.split('\n')
  let inSection = false
  const contentLines: string[] = []

  for (const line of lines) {
    const lineLower = line.toLowerCase().trim()

    if (neighborhoodMarkers.some((m) => lineLower.startsWith(m) || lineLower.includes(m))) {
      if (line.startsWith('#') || line.startsWith('**')) {
        inSection = true
        continue
      }
    }

    if (inSection) {
      if (line.startsWith('#') && contentLines.length > 0) break
      const trimmed = line.trim()
      if (trimmed) contentLines.push(trimmed)
      if (contentLines.join(' ').length > 1500) break
    }
  }

  return contentLines.join(' ').slice(0, 1500)
}

function extractPhotoUrls(html: string, markdown: string): string[] {
  // PRIMARY: JSON-LD structured data (100% accurate for Airbnb)
  const jsonLdImages = extractJsonLdImageUrls(html)
  if (jsonLdImages.length > 0) return jsonLdImages

  // FALLBACK: extract from HTML img src attributes (noisy — avatars, logos, etc.)
  const urls: string[] = []
  const seen = new Set<string>()
  const imgRegex = /src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1]
    // Filter out tiny thumbnails, logos, and avatars
    if (
      !seen.has(url) &&
      !url.includes('avatar') &&
      !url.includes('logo') &&
      !url.includes('icon') &&
      url.length > 30
    ) {
      seen.add(url)
      urls.push(url)
    }
  }

  // Also check markdown image syntax
  const mdImgRegex = /!\[.*?\]\((https:\/\/[^)]+)\)/gi
  while ((match = mdImgRegex.exec(markdown)) !== null) {
    const url = match[1]
    if (!seen.has(url) && url.length > 30) {
      seen.add(url)
      urls.push(url)
    }
  }

  return urls.slice(0, 20)
}
