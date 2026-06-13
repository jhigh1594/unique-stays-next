// Wrapper for the airbnb-pp-cli binary — primary data source for Airbnb listings.
// Returns structured listing data and captioned images far richer than JSON-LD
// or img-tag scraping. Falls back gracefully when the CLI is unavailable.

import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const CLI_BIN = process.env.AIRBNB_PP_CLI_PATH || 'airbnb-pp-cli'

export interface ImageWithCaption {
  url: string
  caption: string
}

export interface ListingData {
  id: string
  url: string
  city: string
  region: string
  hostName: string
  hostBio: string
  sleepsMax: number | null
  coordinate: { latitude: number; longitude: number } | null
  policies: string[]
  propertyManagementName: string
  images: ImageWithCaption[]
}

/** Extract Airbnb listing ID from an affiliate URL. */
export function extractListingId(affiliateUrl: string): string | null {
  const match = affiliateUrl.match(/airbnb\.com\/rooms\/(\d+)/)
  return match?.[1] ?? null
}

/** Check if airbnb-pp-cli is available on PATH. */
async function isAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(CLI_BIN, ['--version'], { timeout: 5000 })
    return !!stdout.trim()
  } catch {
    return false
  }
}

/** Get listing images via airbnb-pp-cli. Returns null if CLI unavailable or fails. */
export async function extractImages(affiliateUrl: string): Promise<ImageWithCaption[] | null> {
  const listingId = extractListingId(affiliateUrl)
  if (!listingId) return null

  if (!(await isAvailable())) return null

  try {
    const { stdout } = await execFileAsync(
      CLI_BIN,
      ['airbnb-listing', 'get', listingId, '--agent'],
      { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 },
    )

    const data = JSON.parse(stdout.trim())
    const mediaItems =
      data?.raw_sections?.photo_tour_scrollable_modal?.section?.mediaItems ?? []

    const images: ImageWithCaption[] = []
    for (const item of mediaItems) {
      if (item.__typename !== 'Image' || !item.baseUrl) continue
      images.push({
        url: item.baseUrl,
        caption: item.accessibilityLabel || '',
      })
    }

    return images.length > 0 ? images : null
  } catch {
    return null
  }
}

/** Get full listing data via airbnb-pp-cli. Returns null if CLI unavailable or fails. */
export async function extractListingData(affiliateUrl: string): Promise<ListingData | null> {
  const listingId = extractListingId(affiliateUrl)
  if (!listingId) return null

  if (!(await isAvailable())) return null

  try {
    const { stdout } = await execFileAsync(
      CLI_BIN,
      ['airbnb-listing', 'get', listingId, '--agent'],
      { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 },
    )

    const data = JSON.parse(stdout.trim())
    const mediaItems =
      data?.raw_sections?.photo_tour_scrollable_modal?.section?.mediaItems ?? []

    const images: ImageWithCaption[] = []
    for (const item of mediaItems) {
      if (item.__typename !== 'Image' || !item.baseUrl) continue
      images.push({
        url: item.baseUrl,
        caption: item.accessibilityLabel || '',
      })
    }

    return {
      id: data.id ?? listingId,
      url: data.url ?? affiliateUrl,
      city: data.city ?? '',
      region: data.region ?? '',
      hostName: data.host_name ?? '',
      hostBio: data.host_bio ?? '',
      sleepsMax: data.sleeps_max ?? null,
      coordinate: data.coordinate ?? null,
      policies: data.policies ?? [],
      propertyManagementName: data.property_management_name ?? '',
      images,
    }
  } catch {
    return null
  }
}
