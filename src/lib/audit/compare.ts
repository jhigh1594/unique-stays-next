import type { AuditStay, Finding, LivenessResult, ScrapedListing, Severity } from './types'
import { checkImageUrlLiveness, isR2Url } from '../image-validation'

// Title similarity threshold — below this is considered drift
const TITLE_SIMILARITY_THRESHOLD = 0.6
// Price drift percentage threshold
const PRICE_DRIFT_THRESHOLD = 0.3

// Normalize string for comparison: lowercase, trim, strip punctuation, collapse whitespace
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Simple trigram similarity
function trigramSimilarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  if (!na || !nb) return 0

  const trigrams = (s: string): Set<string> => {
    const set = new Set<string>()
    for (let i = 0; i <= s.length - 3; i++) {
      set.add(s.slice(i, i + 3))
    }
    return set
  }

  const ta = trigrams(na)
  const tb = trigrams(nb)
  if (ta.size === 0 && tb.size === 0) return na === nb ? 1 : 0

  let intersection = 0
  for (const t of ta) {
    if (tb.has(t)) intersection++
  }

  return intersection / Math.max(ta.size + tb.size - intersection, 1)
}

export { trigramSimilarity }

// Compare stored stay data against scraped data, including image health
export async function compareData(
  stay: AuditStay,
  liveness: LivenessResult,
  scraped: ScrapedListing | null,
): Promise<Finding[]> {
  const findings: Finding[] = []

  // Liveness findings
  if (!liveness.live) {
    findings.push({
      field: 'affiliateUrl',
      expected: stay.affiliateUrl,
      actual: liveness.redirectUrl ?? liveness.error ?? `HTTP ${liveness.statusCode}`,
      severity: 'critical',
    })
    // If URL is dead, skip content comparison
    return findings
  }

  // ── Image health checks ──────────────────────────────────────────

  // Hero image missing
  if (!stay.imageUrl) {
    findings.push({
      field: 'imageUrl',
      expected: 'valid image URL',
      actual: 'empty',
      severity: 'critical',
    })
  } else {
    // Check hero image liveness
    const heroLiveness = await checkImageUrlLiveness(stay.imageUrl)
    if (!heroLiveness.live) {
      findings.push({
        field: 'imageUrl',
        expected: '200 OK with image content',
        actual: heroLiveness.error ?? `HTTP ${heroLiveness.statusCode}`,
        severity: 'critical',
      })
    } else if (!isR2Url(stay.imageUrl)) {
      // Non-R2 URLs may expire (especially muscache.com)
      findings.push({
        field: 'imageUrl',
        expected: 'R2-hosted URL',
        actual: stay.imageUrl,
        severity: 'warning',
      })
    }
  }

  // Gallery image count drift
  const galleryCount = stay.galleryImages.length
  if (scraped?.imageUrl && galleryCount === 0 && stay.imageUrl) {
    findings.push({
      field: 'galleryImages',
      expected: 'at least 1 gallery image',
      actual: 'empty gallery',
      severity: 'info',
    })
  }

  // ── Content comparison (requires scrape data) ────────────────────

  // No scrape data — cannot compare content
  if (!scraped) {
    return findings
  }

  // Listing not active / unavailable
  if (!scraped.listingActive || !scraped.available) {
    findings.push({
      field: 'listingStatus',
      expected: 'active',
      actual: `listingActive=${scraped.listingActive}, available=${scraped.available}`,
      severity: 'critical',
    })
  }

  // Title drift
  if (scraped.title) {
    const similarity = trigramSimilarity(stay.title, scraped.title)
    if (similarity < TITLE_SIMILARITY_THRESHOLD) {
      findings.push({
        field: 'title',
        expected: stay.title,
        actual: scraped.title,
        severity: similarity < 0.3 ? 'critical' : 'warning',
      })
    }
  }

  // Price drift
  if (scraped.price != null && stay.price > 0) {
    const drift = Math.abs(scraped.price - stay.price) / stay.price
    if (drift > PRICE_DRIFT_THRESHOLD) {
      findings.push({
        field: 'price',
        expected: `$${stay.price}`,
        actual: `$${scraped.price}`,
        severity: drift > 0.5 ? 'critical' : 'warning',
      })
    }
  } else if (scraped.price == null && stay.price > 0) {
    findings.push({
      field: 'price',
      expected: `$${stay.price}`,
      actual: 'not found on listing page',
      severity: 'info',
    })
  }

  // Hero image change (filename comparison)
  if (scraped.imageUrl && stay.imageUrl) {
    const getFilename = (u: string) => {
      try {
        const parsed = new URL(u)
        const segments = parsed.pathname.split('/')
        return segments[segments.length - 1] ?? ''
      } catch {
        return u
      }
    }
    if (getFilename(scraped.imageUrl) !== getFilename(stay.imageUrl)) {
      findings.push({
        field: 'imageUrl',
        expected: stay.imageUrl,
        actual: scraped.imageUrl,
        severity: 'info',
      })
    }
  }

  return findings
}

// Determine overall severity from findings
export function overallSeverity(findings: Finding[]): Severity {
  if (findings.some((f) => f.severity === 'critical')) return 'critical'
  if (findings.some((f) => f.severity === 'warning')) return 'warning'
  if (findings.length > 0) return 'info'
  return 'info'
}
