export type ParsedCapacity = {
  bedrooms?: number
  bathrooms?: number
  sleeps?: number
}

const MAX_BEDROOMS = 20
const MAX_BATHROOMS = 20
const MAX_SLEEPS = 50

function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}

function parseCount(match: RegExpMatchArray | null, index = 1): number | undefined {
  if (!match) return undefined
  const value = Number(match[index])
  return inRange(value, 0, MAX_SLEEPS) ? value : undefined
}

/**
 * Extract bedroom/bathroom/sleeps counts from crawled listing text.
 * Many VRBO imports stored 0bd / 1 sleep when scrape missed structured fields.
 */
export function parseCapacityFromText(text: string): ParsedCapacity {
  if (!text.trim()) return {}

  const src = text.slice(0, 8000)

  const triple = src.match(
    /(\d+)\s*bedrooms?\s*(\d+)\s*\+?\s*bath(?:room)?s?\s*sleeps?\s*(\d+)/i,
  )
  if (triple) {
    const bedrooms = parseCount(triple, 1)
    const bathrooms = parseCount(triple, 2)
    const sleeps = parseCount(triple, 3)
    if (
      bedrooms !== undefined &&
      bathrooms !== undefined &&
      sleeps !== undefined &&
      inRange(sleeps, 1, MAX_SLEEPS)
    ) {
      return { bedrooms, bathrooms, sleeps }
    }
  }

  const result: ParsedCapacity = {}

  const bedroomMatch =
    src.match(/(\d+)\s*bedrooms?/i) ??
    src.match(/(\d+)[-\s]bed(?:room)?s?\b/i) ??
    src.match(/^\s*\d+\.\s*(\d+)\s*bedrooms?/im)
  const bedrooms = parseCount(bedroomMatch)
  if (bedrooms !== undefined && inRange(bedrooms, 0, MAX_BEDROOMS)) {
    result.bedrooms = bedrooms
  }

  const bathroomMatch =
    src.match(/(\d+(?:\.\d+)?)\s*\+\s*bath(?:room)?s?/i) ??
    src.match(/(\d+(?:\.\d+)?)\s*bath(?:room)?s?/i) ??
    src.match(/^\s*\d+\.\s*(\d+)\s*baths?/im)
  if (bathroomMatch) {
    const bathrooms = Number(bathroomMatch[1])
    if (inRange(bathrooms, 0, MAX_BATHROOMS)) {
      result.bathrooms = Math.trunc(bathrooms) === bathrooms ? bathrooms : bathrooms
    }
  }

  // VRBO glues sleeps to sq ft: "Sleeps 61000 sq ft" → 6 guests + 1000 sq ft
  const sleepsWithSqFt = src.match(/sleeps?\s*(\d{1,2}?)(?=\d+\s*sq\s*ft)/i)
  const sleepsMatch =
    sleepsWithSqFt ??
    src.match(/sleeps?\s*(\d+)/i) ??
    src.match(/^\s*\d+\.\s*(\d+)\s*guests?/im) ??
    src.match(/(\d+)\s*guests?/i)
  const sleeps = parseCount(sleepsMatch)
  if (sleeps !== undefined && inRange(sleeps, 1, MAX_SLEEPS)) {
    result.sleeps = sleeps
  }

  const airbnbLine = src.match(/(\d+)\s*bedrooms?\s*[·•]\s*[^·•\n]*[·•]\s*(\d+)\s*baths?/i)
  if (airbnbLine) {
    const airbnbBedrooms = parseCount(airbnbLine, 1)
    const airbnbBathrooms = parseCount(airbnbLine, 2)
    if (airbnbBedrooms !== undefined) result.bedrooms = airbnbBedrooms
    if (airbnbBathrooms !== undefined) result.bathrooms = airbnbBathrooms
  }

  return result
}

export function resolveStayCapacity(input: {
  bedrooms: number
  bathrooms: number
  sleeps: number
  description?: string
  body?: string
  subtitle?: string
}): { bedrooms: number; bathrooms: number; sleeps: number } {
  const text = [input.description, input.body, input.subtitle].filter(Boolean).join('\n')
  const parsed = parseCapacityFromText(text)

  let bedrooms = input.bedrooms
  let bathrooms = input.bathrooms
  let sleeps = input.sleeps

  if (bedrooms === 0 && parsed.bedrooms !== undefined) {
    bedrooms = parsed.bedrooms
  }

  if (parsed.sleeps !== undefined && (sleeps === 1 || sleeps < parsed.sleeps)) {
    sleeps = parsed.sleeps
  }

  if (
    parsed.bathrooms !== undefined &&
    input.bedrooms === 0 &&
    bathrooms === 1 &&
    parsed.bathrooms !== bathrooms
  ) {
    bathrooms = parsed.bathrooms
  }

  return { bedrooms, bathrooms, sleeps }
}

export function formatCapacitySummary(bedrooms: number, bathrooms: number, sleeps: number): string {
  const parts: string[] = []
  if (bedrooms > 0) parts.push(`${bedrooms}bd`)
  if (bathrooms > 0) parts.push(`${bathrooms}ba`)
  parts.push(`Sleeps ${sleeps}`)
  return parts.join(' · ')
}
