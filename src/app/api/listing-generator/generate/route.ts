import { NextRequest, NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { recordSpanError, withSpan } from '@superlog/otel-helpers'
import { z } from 'zod'
import { scrapeListing } from '@/lib/unique-score/scraper'
import { validateListingUrl } from '@/lib/listing-generator/types'
import { buildGenerationPrompt } from '@/lib/listing-generator/prompt'
import { runGeminiListingGeneration } from '@/lib/listing-generator/run-gemini-generation'
import { generatorCache } from '@/lib/listing-generator/cache'
import { listingDescriptionGenerated, tracer } from '@/lib/telemetry'
import type { ListingInput, GenerationResult } from '@/lib/listing-generator/types'

export const maxDuration = 60

// Rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60 * 60 * 1000

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
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Zod schema for structured output
const EditorialNoteSchema = z.object({
  category: z.enum(['hook', 'story', 'conversion']),
  note: z.string(),
  example: z.string().optional(),
})

const GenerationSchema = z.object({
  title: z.string().max(60),
  description: z.string(),
  editorialNotes: z.array(EditorialNoteSchema).length(3),
  stayTypeAffinity: z.string(),
})

// Lazy Gemini provider
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null

function getGoogleProvider() {
  if (!GOOGLE_API_KEY) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')
  if (!googleProvider) googleProvider = createGoogleGenerativeAI({ apiKey: GOOGLE_API_KEY })
  return googleProvider
}

export async function POST(req: NextRequest) {
  return withSpan('listing.description.generate', async (span) => {
    try {
      const ip = getClientIp(req)
      span.setAttribute('client.ip_hash', ip === 'unknown' ? 'unknown' : 'present')

      if (!checkRateLimit(ip)) {
        listingDescriptionGenerated.add(1, { outcome: 'rate_limited', source: 'url' })
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a few minutes before generating another description.' },
          { status: 429 },
        )
      }

      const body = await req.json()
      const { url } = body as { url?: string }

      if (!url || typeof url !== 'string') {
        listingDescriptionGenerated.add(1, { outcome: 'invalid_request', source: 'url' })
        return NextResponse.json({ error: 'Please provide a listing URL.' }, { status: 400 })
      }

      const validation = validateListingUrl(url)
      if (!validation.valid) {
        listingDescriptionGenerated.add(1, { outcome: 'invalid_request', source: 'url' })
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      span.setAttribute('listing.platform', validation.platform ?? 'unknown')

      const cached = await generatorCache.get(url)
      if (cached.hit && cached.data) {
        listingDescriptionGenerated.add(1, { outcome: 'cache_hit', source: 'url' })
        return NextResponse.json({
          id: crypto.randomUUID(),
          result: cached.data,
          platform: validation.platform,
          cached: true,
        })
      }

      const scrapeResult = await scrapeListing(url, validation.platform!)
      if (!scrapeResult.success || !scrapeResult.data) {
        listingDescriptionGenerated.add(1, { outcome: 'scrape_failed', source: 'url' })
        return NextResponse.json(
          { error: scrapeResult.error || 'Failed to read that listing. Try the manual form instead.' },
          { status: 422 },
        )
      }

      const listingData = scrapeResult.data

      const input: ListingInput = {
        stayType: inferStayType(listingData.propertyType, listingData.title),
        propertyName: listingData.title || 'Unique Stay',
        city: listingData.location?.split(',')[0]?.trim() || '',
        state: listingData.location?.split(',')?.[1]?.trim() || '',
        bedrooms: 1,
        bathrooms: 1,
        sleeps: 2,
        standoutFeatures: inferFeatures(listingData),
        vibe: 'romantic',
        currentDescription: listingData.description || undefined,
      }

      const provider = getGoogleProvider()
      const model = provider('gemini-2.5-flash')
      const prompt = buildGenerationPrompt(input)

      const result = await runGeminiListingGeneration({
        model,
        schema: GenerationSchema,
        prompt,
        callSite: 'api.listing-generator.generate',
      })

      const generationResult: GenerationResult = {
        title: result.object.title,
        description: result.object.description,
        editorialNotes: result.object.editorialNotes,
        stayTypeAffinity: result.object.stayTypeAffinity,
      }

      await generatorCache.set(url, generationResult)
      listingDescriptionGenerated.add(1, { outcome: 'success', source: 'url' })

      return NextResponse.json({
        id: crypto.randomUUID(),
        result: generationResult,
        platform: validation.platform,
        listingTitle: listingData.title || null,
        cached: false,
      })
    } catch (err) {
      recordSpanError(span, err)
      listingDescriptionGenerated.add(1, { outcome: 'error', source: 'url' })
      const message = err instanceof Error ? err.message : 'Generation failed. Please try again.'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }, { tracer })
}

function inferStayType(propertyType: string | null, title: string): ListingInput['stayType'] {
  const text = `${propertyType || ''} ${title}`.toLowerCase()
  if (text.includes('treehouse')) return 'treehouse'
  if (text.includes('dome')) return 'dome'
  if (text.includes('yurt')) return 'yurt'
  if (text.includes('a-frame') || text.includes('aframe')) return 'a-frame'
  if (text.includes('lighthouse')) return 'lighthouse'
  if (text.includes('houseboat') || text.includes('boat')) return 'houseboat'
  if (text.includes('tiny')) return 'tiny-home'
  if (text.includes('glamping') || text.includes('tent')) return 'glamping-tent'
  if (text.includes('cabin')) return 'cabin'
  return 'other'
}

function inferFeatures(data: { amenities: string[]; description: string }): [string, string, string] {
  const features: string[] = []
  const notable = data.amenities.filter(a =>
    /hot tub|pool|fireplace|stove|deck|view|wifi|kitchen|parking|pet/i.test(a),
  )
  features.push(...notable.slice(0, 3))
  while (features.length < 3) {
    features.push(['Unique architecture', 'Scenic location', 'Memorable experience'][features.length])
  }
  return features.slice(0, 3) as [string, string, string]
}
