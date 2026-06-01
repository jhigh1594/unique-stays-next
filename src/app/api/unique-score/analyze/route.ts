// POST /api/unique-score/analyze — scrape + Gemini analysis

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  validateListingUrl,
  scrapeListing,
  analyzeListing,
  getCachedReport,
  storeReport,
} from '@/lib/unique-score'

export const maxDuration = 60

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) {
    return false
  }

  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(req)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a few minutes before analyzing another listing.' },
        { status: 429 },
      )
    }

    // Parse body
    const body = await req.json()
    const { url, email } = body as { url?: string; email?: string }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a listing URL.' }, { status: 400 })
    }

    // Validate URL
    const validation = validateListingUrl(url)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const platform = validation.platform!
    const payload = await getPayload({ config })

    // Check cache
    const cached = await getCachedReport(url, payload)
    if (cached.hit && cached.report) {
      // Optionally save email as lead
      if (email) {
        saveLead(email, url, cached.report.id, payload).catch(() => {})
      }

      return NextResponse.json({
        scoreId: cached.report.id,
        overallScore: cached.report.overallScore,
        dimensions: cached.report.dimensions,
        summary: (cached.report as any).summary || '',
        platform: cached.report.platform,
        listingTitle: cached.report.listingData?.title || null,
        cached: true,
      })
    }

    // Scrape listing
    const scrapeResult = await scrapeListing(url, platform)
    if (!scrapeResult.success || !scrapeResult.data) {
      return NextResponse.json(
        { error: scrapeResult.error || 'Failed to scrape listing.' },
        { status: 422 },
      )
    }

    // Analyze with Gemini
    const analysis = await analyzeListing(scrapeResult.data)

    // Store result
    const report = await storeReport(
      url,
      platform,
      analysis.overallScore,
      analysis.dimensions,
      scrapeResult.data,
      payload,
    )

    // Save email as lead
    if (email) {
      saveLead(email, url, report.id, payload).catch(() => {})
    }

    return NextResponse.json({
      scoreId: report.id,
      overallScore: analysis.overallScore,
      dimensions: analysis.dimensions,
      summary: analysis.summary,
      platform,
      listingTitle: scrapeResult.data.title || null,
      cached: false,
    })
  } catch (err) {
    console.error('[unique-score/analyze] Error:', err)
    const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Get cached report by ID (for shared links)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const scoreId = searchParams.get('id')

    if (!scoreId) {
      return NextResponse.json({ error: 'Missing id parameter.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const { getReportById } = await import('@/lib/unique-score/cache')
    const report = await getReportById(parseInt(scoreId), payload)

    if (!report) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
    }

    return NextResponse.json({
      scoreId: report.id,
      overallScore: report.overallScore,
      dimensions: report.dimensions,
      platform: report.platform,
      listingTitle: report.listingData?.title || null,
      paid: report.paid,
    })
  } catch (err) {
    console.error('[unique-score/analyze] GET Error:', err)
    return NextResponse.json({ error: 'Failed to load report.' }, { status: 500 })
  }
}

// Fire-and-forget lead capture
async function saveLead(email: string, listingUrl: string, scoreId: number, payload: any) {
  try {
    await payload.create({
      collection: 'host-leads',
      data: {
        email: email.toLowerCase().trim(),
        listingUrl,
        scoreId,
        source: 'free',
      },
    })
  } catch {
    // Duplicate email — ignore
  }
}
