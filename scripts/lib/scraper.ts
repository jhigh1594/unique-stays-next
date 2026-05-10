// Firecrawl scraping module for platform listing pages
// Extracts host description, amenities, neighborhood info, and photo URLs

import Firecrawl from '@mendable/firecrawl-js'

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

export async function scrapeListing(affiliateUrl: string, apiKey?: string): Promise<ScrapeResult> {
  const key = apiKey ?? process.env.FIRECRAWL_API_KEY
  if (!key) {
    return { success: false, error: 'FIRECRAWL_API_KEY not set' }
  }

  try {
    const client = new Firecrawl({ apiKey: key, apiUrl: 'https://api.firecrawl.dev' })
    const result = await client.scrape(affiliateUrl, {
      formats: ['markdown', 'html'],
      timeout: 30000,
    })

    if (!result || !result.markdown) {
      return { success: false, error: 'Scrape returned no content' }
    }

    const markdown = result.markdown as string
    const html = (result.html as string) ?? ''

    const description = extractDescription(markdown)
    const amenities = extractAmenities(markdown)
    const neighborhood = extractNeighborhood(markdown)
    const photoUrls = extractPhotoUrls(html, markdown)

    return {
      success: true,
      data: { description, amenities, neighborhood, photoUrls },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
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

function extractAmenities(markdown: string): string[] {
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
  const urls: string[] = []
  const seen = new Set<string>()

  // Extract from HTML img src attributes
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
