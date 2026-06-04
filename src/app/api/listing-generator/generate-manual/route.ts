import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { validateManualInput } from '@/lib/listing-generator/types'
import { buildGenerationPrompt } from '@/lib/listing-generator/prompt'
import type { ListingInput, GenerationResult } from '@/lib/listing-generator/types'

export const maxDuration = 60

const RATE_LIMIT = 5
const RATE_WINDOW = 60 * 60 * 1000
const rateLimits = new Map<string, { count: number; resetAt: number }>()

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

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null

function getGoogleProvider() {
  if (!GOOGLE_API_KEY) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')
  if (!googleProvider) googleProvider = createGoogleGenerativeAI({ apiKey: GOOGLE_API_KEY })
  return googleProvider
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a few minutes.' },
        { status: 429 },
      )
    }

    const body = await req.json()
    const validation = validateManualInput(body)

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const input = body as ListingInput

    const provider = getGoogleProvider()
    const model = provider('gemini-2.5-flash')
    const prompt = buildGenerationPrompt(input)

    const result = await generateObject({
      model,
      schema: GenerationSchema,
      messages: [{ role: 'user', content: prompt }],
      maxRetries: 2,
    })

    const generationResult: GenerationResult = {
      title: result.object.title,
      description: result.object.description,
      editorialNotes: result.object.editorialNotes,
      stayTypeAffinity: result.object.stayTypeAffinity,
    }

    return NextResponse.json({
      id: crypto.randomUUID(),
      result: generationResult,
      cached: false,
    })
  } catch (err) {
    console.error('[listing-generator/generate-manual] Error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
