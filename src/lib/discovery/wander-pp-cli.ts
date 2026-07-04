import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const CLI_BIN = process.env.WANDER_PP_CLI_PATH || 'wander-pp-cli'

export interface WanderImage {
  url: string
  caption: string
  width?: number
}

export interface WanderListingData {
  id: string
  slug: string
  url: string
  name: string
  description: string
  city: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  bedrooms: number | null
  bathrooms: number | null
  sleeps: number | null
  nightlyMin: number | null
  rating: number | null
  reviewCount: number | null
  amenities: string[]
  images: WanderImage[]
  policies: {
    petsAllowed?: boolean
    smokingAllowed?: boolean
    checkinTime?: string
    checkoutTime?: string
  }
}

type RawWanderListing = Record<string, unknown>

export function extractListingSlug(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const urlMatch = trimmed.match(/wander\.com\/property\/([^/?#]+)/i)
  if (urlMatch) return normalizeSlug(urlMatch[1])

  if (/^[a-z0-9][a-z0-9-]+$/i.test(trimmed)) return normalizeSlug(trimmed)

  return null
}

export async function isAvailable(): Promise<boolean> {
  try {
    await execFileAsync(CLI_BIN, ['--version'], { timeout: 5000, maxBuffer: 1024 * 1024 })
    return true
  } catch {
    try {
      await execFileAsync(CLI_BIN, ['--help'], { timeout: 5000, maxBuffer: 1024 * 1024 })
      return true
    } catch {
      return false
    }
  }
}

export async function extractListingData(input: string): Promise<WanderListingData | null> {
  const slug = extractListingSlug(input)
  if (!slug) return null
  if (!(await isAvailable())) return null

  try {
    const { stdout } = await execFileAsync(CLI_BIN, ['get', slug, '--agent'], {
      timeout: 60_000,
      maxBuffer: 20 * 1024 * 1024,
    })

    return normalizeListing(JSON.parse(stdout.trim()), slug, input)
  } catch {
    return null
  }
}

export async function extractImages(input: string): Promise<WanderImage[] | null> {
  const listing = await extractListingData(input)
  return listing && listing.images.length > 0 ? listing.images : null
}

export function normalizeListing(
  raw: RawWanderListing,
  fallbackSlug = '',
  fallbackUrl = '',
): WanderListingData | null {
  const slug = stringValue(raw.slug) || stringValue(raw.id) || fallbackSlug
  if (!slug) return null

  return {
    id: stringValue(raw.id) || slug,
    slug,
    url: stringValue(raw.url) || canonicalUrl(slug, fallbackUrl),
    name: stringValue(raw.name) || stringValue(raw.title) || titleFromSlug(slug),
    description: stringValue(raw.description),
    city: stringValue(raw.city),
    state: stringValue(raw.state),
    country: stringValue(raw.country) || 'US',
    latitude: numberValue(raw.latitude),
    longitude: numberValue(raw.longitude),
    bedrooms: numberValue(raw.bedrooms),
    bathrooms: numberValue(raw.bathrooms),
    sleeps: numberValue(raw.sleeps),
    nightlyMin: numberValue(raw.nightlyMin ?? raw.nightly_min ?? raw.price),
    rating: numberValue(raw.rating),
    reviewCount: numberValue(raw.reviewCount ?? raw.review_count),
    amenities: normalizeStringArray(raw.amenities).slice(0, 40),
    images: normalizeImages(raw.images),
    policies: normalizePolicies(raw.policies),
  }
}

function normalizeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
}

function canonicalUrl(slug: string, fallbackUrl: string): string {
  if (fallbackUrl.startsWith('https://')) return fallbackUrl
  return `https://www.wander.com/property/${slug}`
}

function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const cleaned = value.replace(/[^0-9.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        return stringValue(record.label) || stringValue(record.name) || stringValue(record.amenity)
      }
      return ''
    })
    .filter((item, index, all) => item.length > 0 && all.indexOf(item) === index)
}

function normalizeImages(value: unknown): WanderImage[] {
  if (!Array.isArray(value)) return []
  const images = value
    .map((item) => {
      if (typeof item === 'string') return { url: item, caption: '' }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const url = stringValue(record.url) || stringValue(record.src)
        if (!url) return null
        return {
          url,
          caption: stringValue(record.caption) || stringValue(record.alt),
          width: numberValue(record.width) ?? undefined,
        }
      }
      return null
    })
    .filter((item): item is WanderImage => Boolean(item?.url))

  return images.filter((image, index, all) => all.findIndex((candidate) => candidate.url === image.url) === index)
}

function normalizePolicies(value: unknown): WanderListingData['policies'] {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  return {
    petsAllowed: booleanValue(record.petsAllowed),
    smokingAllowed: booleanValue(record.smokingAllowed),
    checkinTime: stringValue(record.checkinTime),
    checkoutTime: stringValue(record.checkoutTime),
  }
}

function booleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return undefined
}
