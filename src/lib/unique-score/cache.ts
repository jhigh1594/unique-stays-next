// Unique Score — Payload-based result caching (24h TTL)

import type { ScoreReport, Platform } from './types'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Simple hash for URL lookup
async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(url.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export interface CacheResult {
  hit: boolean
  report?: ScoreReport
}

export async function getCachedReport(
  listingUrl: string,
  payload: any,
): Promise<CacheResult> {
  const urlHash = await hashUrl(listingUrl)

  try {
    const results = await payload.find({
      collection: 'score-reports',
      where: { urlHash: { equals: urlHash } },
      limit: 1,
    })

    if (results.docs.length === 0) {
      return { hit: false }
    }

    const doc = results.docs[0]
    const age = Date.now() - new Date(doc.createdAt).getTime()

    if (age > CACHE_TTL_MS) {
      return { hit: false }
    }

    return {
      hit: true,
      report: {
        id: doc.id,
        urlHash: doc.urlHash,
        listingUrl: doc.listingUrl,
        platform: doc.platform as Platform,
        overallScore: doc.overallScore,
        dimensions: doc.dimensions,
        listingData: doc.listingData,
        paid: doc.paid,
        createdAt: doc.createdAt,
      },
    }
  } catch {
    return { hit: false }
  }
}

export async function storeReport(
  listingUrl: string,
  platform: Platform,
  overallScore: number,
  dimensions: any[],
  listingData: any,
  payload: any,
): Promise<ScoreReport> {
  const urlHash = await hashUrl(listingUrl)

  // Check for existing (upsert semantics)
  const existing = await payload.find({
    collection: 'score-reports',
    where: { urlHash: { equals: urlHash } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    // Update existing
    const updated = await payload.update({
      collection: 'score-reports',
      id: existing.docs[0].id,
      data: {
        overallScore,
        dimensions,
        listingData,
        platform,
        createdAt: new Date().toISOString(),
      },
    })

    return {
      id: updated.id,
      urlHash: updated.urlHash,
      listingUrl: updated.listingUrl,
      platform: updated.platform as Platform,
      overallScore: updated.overallScore,
      dimensions: updated.dimensions,
      listingData: updated.listingData,
      paid: updated.paid,
      createdAt: updated.createdAt,
    }
  }

  // Create new
  const doc = await payload.create({
    collection: 'score-reports',
    data: {
      urlHash,
      listingUrl,
      platform,
      overallScore,
      dimensions,
      listingData,
      paid: false,
    },
  })

  return {
    id: doc.id,
    urlHash: doc.urlHash,
    listingUrl: doc.listingUrl,
    platform: doc.platform as Platform,
    overallScore: doc.overallScore,
    dimensions: doc.dimensions,
    listingData: doc.listingData,
    paid: doc.paid,
    createdAt: doc.createdAt,
  }
}

export async function getReportById(
  id: number,
  payload: any,
): Promise<ScoreReport | null> {
  try {
    const doc = await payload.findByID({
      collection: 'score-reports',
      id,
    })

    return {
      id: doc.id,
      urlHash: doc.urlHash,
      listingUrl: doc.listingUrl,
      platform: doc.platform as Platform,
      overallScore: doc.overallScore,
      dimensions: doc.dimensions,
      listingData: doc.listingData,
      paid: doc.paid,
      createdAt: doc.createdAt,
    }
  } catch {
    return null
  }
}
