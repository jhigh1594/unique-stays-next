import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import { getCategories, getAllStays, getAllJournalSlugs } from '@/lib/payload-queries'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  const [categories, stays, journalSlugs] = await Promise.all([
    getCategories(),
    getAllStays(),
    getAllJournalSlugs(),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com'

  const states = [...new Set(stays.map((s) => s.state).filter(Boolean))].sort()
  const spokeSections = SPOKE_SLUGS.map((slug) => {
    const config = SPOKES_CONFIG[slug]
    const count = stays.filter((s) => s.spokes.includes(slug)).length
    return `- ${config.title} (/${slug}): ${count} stays — ${config.seoDescription}`
  }).join('\n')

  const categoryList = categories.map((c) => `- ${c.name} (${c.slug})`).join('\n')

  const body = `# UniqueStaysUSA

> Curated directory of unique vacation rentals across the United States. We list treehouses, geodesic domes, cabins, houseboats, yurts, A-frames, converted barns, lighthouses, and other extraordinary stays sourced from Airbnb, VRBO, Wander, and direct booking sites.

## What we offer

- ${stays.length} curated stays across ${states.length} states and ${categories.length} categories
- Affiliate directory: we link to the original booking platform for each listing
- 5 hub sections (spokes) with programmatic state-level pages
- Journal with travel guides and curated roundups (${journalSlugs.length} published articles)

## Collections (Spokes)

${spokeSections}

## Categories

${categoryList}

## States covered

${states.join(', ')}

## Key pages

- Home: ${baseUrl}
- Collection (all stays): ${baseUrl}/collection
- Journal: ${baseUrl}/journal
- About: ${baseUrl}/about
- Submit a stay: ${baseUrl}/submit

## How stays are organized

Each stay belongs to one or more spokes and one category. Stays are tagged with state and region. Each stay page includes title, location, price, rating, guest capacity, description, amenities, and a direct booking link to the source platform.

## Contact

hello@uniquestaysusa.com
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
