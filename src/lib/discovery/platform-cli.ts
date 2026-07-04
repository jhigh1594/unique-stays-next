import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DiscoveredListing } from './discoverer'
import { extractListingData } from './wander-pp-cli'

const execFileAsync = promisify(execFile)

const AIRBNB_CLI = process.env.AIRBNB_PP_CLI_PATH || 'airbnb-pp-cli'

const STATE_TO_REGION: Record<string, DiscoveredListing['region']> = {
  Alaska: 'West',
  California: 'West',
  Hawaii: 'West',
  Oregon: 'West',
  Washington: 'West',
  Arizona: 'Southwest',
  Colorado: 'Southwest',
  Nevada: 'Southwest',
  'New Mexico': 'Southwest',
  Utah: 'Southwest',
  Arkansas: 'South',
  Kansas: 'South',
  Louisiana: 'South',
  Missouri: 'South',
  Oklahoma: 'South',
  Texas: 'South',
  Illinois: 'Midwest',
  Indiana: 'Midwest',
  Iowa: 'Midwest',
  Michigan: 'Midwest',
  Minnesota: 'Midwest',
  Nebraska: 'Midwest',
  'North Dakota': 'Midwest',
  Ohio: 'Midwest',
  'South Dakota': 'Midwest',
  Wisconsin: 'Midwest',
  Connecticut: 'Northeast',
  Delaware: 'Northeast',
  Maine: 'Northeast',
  Maryland: 'Northeast',
  Massachusetts: 'Northeast',
  'New Hampshire': 'Northeast',
  'New Jersey': 'Northeast',
  'New York': 'Northeast',
  Pennsylvania: 'Northeast',
  'Rhode Island': 'Northeast',
  Vermont: 'Northeast',
  Alabama: 'Southeast',
  Florida: 'Southeast',
  Georgia: 'Southeast',
  Kentucky: 'Southeast',
  Mississippi: 'Southeast',
  'North Carolina': 'Southeast',
  'South Carolina': 'Southeast',
  Tennessee: 'Southeast',
  Virginia: 'Southeast',
  'West Virginia': 'Southeast',
}

type JsonObject = Record<string, any>

async function commandExists(bin: string): Promise<boolean> {
  try {
    await execFileAsync(bin, ['--help'], { timeout: 5000, maxBuffer: 1024 * 1024 })
    return true
  } catch {
    return false
  }
}

async function runJson(bin: string, args: string[]): Promise<JsonObject | null> {
  try {
    const { stdout } = await execFileAsync(bin, args, {
      timeout: 60_000,
      maxBuffer: 20 * 1024 * 1024,
    })
    return JSON.parse(stdout.trim())
  } catch {
    return null
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function firstAirbnbImage(data: JsonObject): string {
  const mediaItems = data.raw_sections?.photo_tour_scrollable_modal?.section?.mediaItems ?? []
  const image = mediaItems.find((item: JsonObject) => item?.__typename === 'Image' && item?.baseUrl)
  return image?.baseUrl ?? ''
}

function airbnbDescription(data: JsonObject): string {
  const html = data.raw_sections?.description_default?.section?.htmlDescription?.htmlText
  if (typeof html === 'string' && html.trim()) return stripHtml(html)
  return typeof data.description === 'string' ? data.description.trim() : ''
}

function airbnbListingId(url: string): string | null {
  return url.match(/airbnb\.com\/rooms\/(\d+)/)?.[1] ?? null
}

async function hydrateAirbnbListing(listing: DiscoveredListing): Promise<DiscoveredListing | null> {
  const id = airbnbListingId(listing.sourceUrl)
  if (!id) return null
  if (!(await commandExists(AIRBNB_CLI))) return null

  const data = await runJson(AIRBNB_CLI, [
    'airbnb-listing',
    'get',
    id,
    '--json',
    '--no-input',
    '--no-color',
    '--yes',
  ])
  if (!data?.id) return null

  const city = typeof data.city === 'string' ? data.city.trim() : ''
  const state = typeof data.region === 'string' ? data.region.trim() : listing.state
  const description = airbnbDescription(data)
  const imageUrl = firstAirbnbImage(data)

  return {
    ...listing,
    location: city && state ? `${city}, ${state}` : listing.location,
    state: state || listing.state,
    region: STATE_TO_REGION[state] ?? listing.region,
    description: description || listing.description,
    imageUrl: imageUrl || listing.imageUrl,
    sourceUrl: typeof data.url === 'string' ? data.url : listing.sourceUrl,
  }
}

async function hydrateWanderListing(listing: DiscoveredListing): Promise<DiscoveredListing | null> {
  const data = await extractListingData(listing.sourceUrl)
  if (!data) return null

  const state = data.state || listing.state
  const imageUrl = data.images[0]?.url ?? ''

  return {
    ...listing,
    title: data.name || listing.title,
    location: data.city && state ? `${data.city}, ${state}` : listing.location,
    state,
    region: STATE_TO_REGION[state] ?? listing.region,
    description: data.description || listing.description,
    imageUrl: imageUrl || listing.imageUrl,
    price: data.nightlyMin && data.nightlyMin > 0 ? Math.round(data.nightlyMin) : listing.price,
    rating: data.rating ?? listing.rating,
    reviewCount: data.reviewCount ?? listing.reviewCount,
    amenities: data.amenities.length > 0 ? data.amenities.slice(0, 15) : listing.amenities,
  }
}

export async function hydrateListingFromPlatformCli(listing: DiscoveredListing): Promise<DiscoveredListing | null> {
  if (listing.platform === 'Airbnb') return hydrateAirbnbListing(listing)
  if (listing.platform === 'Wander') return hydrateWanderListing(listing)
  return listing
}

export async function hydrateListingsFromPlatformCli(listings: DiscoveredListing[]): Promise<DiscoveredListing[]> {
  const hydrated: DiscoveredListing[] = []
  for (const listing of listings) {
    const result = await hydrateListingFromPlatformCli(listing)
    if (result) {
      hydrated.push(result)
    } else {
      process.stdout.write(`  Skipped ${listing.platform} candidate without CLI-backed detail: ${listing.sourceUrl}\n`)
    }
  }
  return hydrated
}
