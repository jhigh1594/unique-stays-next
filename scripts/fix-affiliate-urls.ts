// Fix dead and placeholder affiliate URLs by searching for correct listing URLs
// Run: node --env-file=.env.local --import tsx/esm scripts/fix-affiliate-urls.ts
// Requires: DATABASE_URI, PAYLOAD_SECRET, FIRECRAWL_API_KEY

import { getPayload } from 'payload'
import config from '@payload-config'
import Firecrawl from '@mendable/firecrawl-js'

const DEAD_IDS = [1, 171, 172, 188, 196, 200]
const PLACEHOLDER_IDS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 47, 48, 49, 50]
const ALL_IDS = [...DEAD_IDS, ...PLACEHOLDER_IDS]

const DELAY_MS = 4000

function buildSearchUrl(title: string, location: string, platform: string): string {
  const query = encodeURIComponent(`${title} ${location}`)
  if (platform === 'Airbnb') {
    return `https://www.airbnb.com/s/${encodeURIComponent(location)}/homes?query=${query}`
  }
  if (platform === 'VRBO') {
    return `https://www.vrbo.com/search?query=${query}`
  }
  if (platform === 'Wander') {
    return `https://www.wander.com/search?q=${query}`
  }
  if (platform === 'Direct') {
    return `https://www.google.com/search?q=${query}+site%3Ahipcamp.com+OR+site%3Areserveamerica.com+OR+site%3Areservecalifornia.com`
  }
  return `https://www.google.com/search?q=${query}`
}

function extractListingUrl(html: string, markdown: string, platform: string): string | null {
  const patterns: Record<string, RegExp[]> = {
    Airbnb: [
      /href="(https:\/\/www\.airbnb\.com\/rooms\/\d+[^"]*)"/gi,
      /\[(https:\/\/www\.airbnb\.com\/rooms\/\d+[^\]]*)\]/gi,
      /(https:\/\/www\.airbnb\.com\/rooms\/\d+)/gi,
    ],
    VRBO: [
      /href="(https:\/\/www\.vrbo\.com\/\d+[^\"]*)"/gi,
      /(https:\/\/www\.vrbo\.com\/\d+)/gi,
    ],
    Wander: [
      /href="(https:\/\/www\.wander\.com\/property\/[^"]+)"/gi,
      /(https:\/\/www\.wander\.com\/property\/[a-z0-9-]+)/gi,
    ],
    Direct: [
      /href="(https:\/\/www\.hipcamp\.com\/[^"]+)"/gi,
      /(https:\/\/www\.hipcamp\.com\/[a-zA-Z0-9\/-]+)/gi,
    ],
  }

  const testPatterns = patterns[platform] || [...(patterns.Airbnb || []), ...(patterns.Direct || [])]

  for (const pattern of testPatterns) {
    const text = html + '\n' + markdown
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const url = match[1] || match[0]
      // Clean URL - remove query params and trailing slashes
      const cleaned = url.split('?')[0].split('#')[0].replace(/\/$/, '')
      if (cleaned) return cleaned
    }
  }

  return null
}

async function findListingUrl(
  title: string,
  location: string,
  platform: string,
  slug: string,
  apiKey: string,
): Promise<{ url: string | null; method: string }> {
  const client = new Firecrawl({ apiKey, apiUrl: 'https://api.firecrawl.dev' })

  // Strategy 1: Direct Google search
  const googleQuery = `${title} ${location}`
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery + ' ' + platform.toLowerCase())}`

  try {
    const result = await client.scrape(googleUrl, { formats: ['markdown', 'html'], timeout: 20000 })
    if (result?.markdown) {
      const url = extractListingUrl(result.html ?? '', result.markdown, platform)
      if (url) return { url, method: 'google' }
    }
  } catch {
    // Google blocked, try direct platform search
  }

  // Strategy 2: Platform-specific search
  const searchUrl = buildSearchUrl(title, location, platform)
  try {
    const result = await client.scrape(searchUrl, { formats: ['markdown', 'html'], timeout: 20000 })
    if (result?.markdown) {
      const url = extractListingUrl(result.html ?? '', result.markdown, platform)
      if (url) return { url, method: 'platform_search' }
    }
  } catch {
    // Platform search failed
  }

  // Strategy 3: For Airbnb, try the direct search with title only
  if (platform === 'Airbnb') {
    try {
      const directUrl = `https://www.airbnb.com/s/homes?query=${encodeURIComponent(title)}`
      const result = await client.scrape(directUrl, { formats: ['markdown', 'html'], timeout: 20000 })
      if (result?.markdown) {
        const url = extractListingUrl(result.html ?? '', result.markdown, platform)
        if (url) return { url, method: 'airbnb_direct' }
      }
    } catch {
      // Direct search failed
    }
  }

  return { url: null, method: 'none' }
}

async function fixStay(payload: Awaited<ReturnType<typeof getPayload>>, id: number, apiKey: string) {
  const stay = await payload.findByID({ collection: 'stays', id, depth: 0 })
  const slug = stay.slug as string
  const title = stay.title as string
  const platform = stay.platform as string
  const location = stay.location as string
  const affiliateUrl = stay.affiliateUrl as string
  const isDead = DEAD_IDS.includes(id)

  console.log(`\n→ [${id}] ${slug} — "${title}" (${platform})`)
  console.log(`  Current URL: ${affiliateUrl}`)
  console.log(`  Category: ${isDead ? 'DEAD' : 'PLACEHOLDER'}`)

  // For dead links, first verify they're actually dead
  if (isDead) {
    try {
      const res = await fetch(affiliateUrl, {
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (res.ok && !res.url.includes('error') && !res.url.includes('not-found')) {
        console.log(`  ✓ URL actually works (HTTP ${res.status}) — skipping`)
        return { id, slug, status: 'skipped', reason: 'URL works' }
      }
      console.log(`  Confirmed dead: HTTP ${res.status} → ${res.url}`)
    } catch (err) {
      console.log(`  Confirmed dead: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Search for the correct URL
  const { url: foundUrl, method } = await findListingUrl(title, location, platform, slug, apiKey)

  if (!foundUrl) {
    console.log(`  ✗ No listing found`)
    return { id, slug, status: 'failed', reason: 'listing not found' }
  }

  console.log(`  Found: ${foundUrl} (via ${method})`)

  // Update the stay
  await payload.update({
    collection: 'stays',
    id,
    data: { affiliateUrl: foundUrl },
  })

  console.log(`  ✓ Updated affiliate URL`)
  return { id, slug, status: 'fixed', newUrl: foundUrl, method }
}

async function main() {
  const payload = await getPayload({ config })
  const apiKey = process.env.FIRECRAWL_API_KEY!

  console.log(`Fixing affiliate URLs for ${ALL_IDS.length} stays...`)

  const results: Array<Record<string, unknown>> = []

  for (const id of ALL_IDS) {
    try {
      const result = await fixStay(payload, id, apiKey)
      results.push(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ✗ Error: ${msg}`)
      const stay = await payload.findByID({ collection: 'stays', id, depth: 0 }).catch(() => null)
      results.push({ id, slug: stay?.slug ?? 'unknown', status: 'error', reason: msg })
    }

    if (id !== ALL_IDS[ALL_IDS.length - 1]) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  const fixed = results.filter(r => r.status === 'fixed')
  const failed = results.filter(r => r.status === 'failed')
  const skipped = results.filter(r => r.status === 'skipped')
  const errors = results.filter(r => r.status === 'error')

  console.log(`Summary: ${fixed.length} fixed | ${failed.length} failed | ${skipped.length} skipped | ${errors.length} errors`)

  if (failed.length > 0) {
    console.log(`\nFailed (no listing found):`)
    failed.forEach(r => console.log(`  ✗ [${r.id}] ${r.slug}`))
  }

  if (errors.length > 0) {
    console.log(`\nErrors:`)
    errors.forEach(r => console.log(`  ! [${r.id}] ${r.slug}: ${r.reason}`))
  }

  await payload.db.pool.end()
  process.exit(failed.length + errors.length > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fix failed:', err)
  process.exit(1)
})
