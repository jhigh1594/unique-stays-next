// Find correct affiliate URLs via Bing search
// Run: node --env-file=.env.local --import tsx/esm scripts/fix-affiliate-urls-bing.ts

import { getPayload } from 'payload'
import config from '@payload-config'
import Firecrawl from '@mendable/firecrawl-js'

const PLACEHOLDER_IDS = [13, 14, 15, 17, 18, 19, 20, 21, 22, 47, 48, 49, 50]

const DELAY_MS = 5000

function extractUrlFromBing(markdown: string, platform: string): string | null {
  const patterns: Record<string, RegExp[]> = {
    Airbnb: [
      // Direct airbnb.com/rooms/ links
      /https?:\/\/www\.airbnb\.com\/rooms\/(\d+)/gi,
      // Bing redirect links containing base64 airbnb URLs
      /\bu=a1[a-zA-Z0-9&;=]*?(?:airbnb\.com[^\s"'<>]*)/gi,
    ],
    VRBO: [
      /https?:\/\/www\.vrbo\.com\/(\d+)/gi,
    ],
    Wander: [
      /https?:\/\/www\.wander\.com\/property\/([a-z0-9-]+)/gi,
    ],
    Direct: [
      /https?:\/\/www\.hipcamp\.com\/([a-zA-Z0-9\/_-]+)/gi,
    ],
  }

  const testPatterns = patterns[platform] || patterns.Airbnb!

  for (const pattern of testPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(markdown)) !== null) {
      const url = match[0]
      // For airbnb direct pattern, reconstruct clean URL
      if (platform === 'Airbnb' && match[1]) {
        const cleanUrl = `https://www.airbnb.com/rooms/${match[1]}`
        return cleanUrl
      }
      if (url.startsWith('http')) {
        return url.split('?')[0].split('#')[0].replace(/\/$/, '')
      }
    }
  }

  return null
}

function decodeBingRedirect(encoded: string): string | null {
  try {
    // Bing encodes redirect URLs in base64-ish in the u= parameter
    const decoded = decodeURIComponent(encoded)
    const urlMatch = decoded.match(/airbnb\.com\/rooms\/\d+/)
    if (urlMatch) return `https://www.${urlMatch[0]}`
    return null
  } catch {
    return null
  }
}

function extractAirbnbIdFromBingMarkdown(markdown: string): string | null {
  // Method 1: Decode Bing base64 redirect links
  // Bing encodes as: u=a1aHR0cHM6Ly93d3cuYWlyYm5iLmNvbS9yb29tcy82Njc2Nzk2NDg0Nzk5MTEwMzA
  const bingLinks = markdown.match(/u=a1([a-zA-Z0-9+/=]+)/g)
  if (bingLinks) {
    for (const link of bingLinks) {
      const b64 = link.replace('u=a1', '')
      try {
        const decoded = Buffer.from(b64, 'base64').toString('utf-8')
        const roomMatch = decoded.match(/airbnb\.com\/rooms\/(\d+)/)
        if (roomMatch) return roomMatch[1]
      } catch { /* skip */ }
    }
  }

  // Method 2: Direct room IDs in text
  const directMatch = markdown.match(/airbnb\.com[\/\s]*rooms[\/\s]*(\d{5,})/i)
  if (directMatch) return directMatch[1]

  return null
}

function extractRvUrl(markdown: string): string | null {
  // Decode Bing base64 redirect links for RV/camping sites
  const bingLinks = markdown.match(/u=a1([a-zA-Z0-9+/=]+)/g)
  if (bingLinks) {
    for (const link of bingLinks) {
      const b64 = link.replace('u=a1', '')
      try {
        const decoded = Buffer.from(b64, 'base64').toString('utf-8')
        const rvMatch = decoded.match(/https?:\/\/(www\.)?(hipcamp\.com|recreation\.gov|reserveamerica\.com|reservecalifornia\.com|campspot\.com)\/[^\s"'<>]+/)
        if (rvMatch) return `https://${rvMatch[0].replace('https://', '').replace('http://', '')}`.split('?')[0].replace(/\/$/, '')
      } catch { /* skip */ }
    }
  }

  // Fallback: direct URL patterns
  const patterns = [
    /https?:\/\/www\.hipcamp\.com\/[a-zA-Z0-9\/_-]+/gi,
    /https?:\/\/www\.recreation\.gov\/[a-zA-Z0-9\/_-]+/gi,
    /https?:\/\/www\.reserveamerica\.com\/[^\s"'<>]+/gi,
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(markdown)) !== null) {
      const url = match[0].split('?')[0].split('#')[0].replace(/\/$/, '')
      if (url.length > 30) return url
    }
  }
  return null
}

async function findListingUrl(
  title: string,
  location: string,
  platform: string,
  apiKey: string,
): Promise<{ url: string | null; method: string }> {
  const client = new Firecrawl({ apiKey, apiUrl: 'https://api.firecrawl.dev' })

  // Build search query — include "airbnb.com" to bias Bing toward listing results
  const siteHint = platform === 'Airbnb' ? 'airbnb.com' : platform === 'VRBO' ? 'vrbo.com' : ''
  const query = `${title} ${location} ${siteHint}`
  const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`

  try {
    const result = await client.scrape(bingUrl, { formats: ['markdown'], timeout: 20000 })
    if (!result?.markdown) return { url: null, method: 'no_result' }

    const md = result.markdown

    if (platform === 'Airbnb') {
      const roomId = extractAirbnbIdFromBingMarkdown(md)
      if (roomId) return { url: `https://www.airbnb.com/rooms/${roomId}`, method: 'bing_b64' }
    } else if (platform === 'Direct') {
      const rvUrl = extractRvUrl(md)
      if (rvUrl) return { url: rvUrl, method: 'bing_rv' }
    }

    return { url: null, method: 'not_found' }
  } catch (err) {
    return { url: null, method: `error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function main() {
  const payload = await getPayload({ config })
  const apiKey = process.env.FIRECRAWL_API_KEY!

  console.log(`Finding affiliate URLs for ${PLACEHOLDER_IDS.length} stays via Bing...\n`)

  const results: Array<{ id: number; slug: string; status: string; url?: string; method?: string }> = []

  for (const id of PLACEHOLDER_IDS) {
    const stay = await payload.findByID({ collection: 'stays', id, depth: 0 })
    const slug = stay.slug as string
    const title = stay.title as string
    const location = stay.location as string
    const platform = stay.platform as string

    console.log(`→ [${id}] ${slug} — "${title}" (${platform}, ${location})`)

    const { url, method } = await findListingUrl(title, location, platform, apiKey)

    if (url) {
      console.log(`  Found: ${url} (via ${method})`)
      await payload.update({
        collection: 'stays',
        id,
        data: { affiliateUrl: url },
      })
      console.log(`  ✓ Updated`)
      results.push({ id, slug, status: 'fixed', url, method })
    } else {
      console.log(`  ✗ Not found (${method})`)
      results.push({ id, slug, status: 'failed', method })
    }

    if (id !== PLACEHOLDER_IDS[PLACEHOLDER_IDS.length - 1]) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  const fixed = results.filter(r => r.status === 'fixed')
  const failed = results.filter(r => r.status === 'failed')

  console.log(`Summary: ${fixed.length} fixed | ${failed.length} failed`)

  if (failed.length > 0) {
    console.log(`\nStill missing:`)
    failed.forEach(r => console.log(`  ✗ [${r.id}] ${r.slug} (${r.method})`))
  }

  await payload.db.pool.end()
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
