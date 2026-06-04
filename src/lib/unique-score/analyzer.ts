// Unique Score — Gemini Flash multimodal analysis via Vercel AI SDK

import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import type { AnalysisResult, DimensionScore, ListingData } from './types'
import { DIMENSIONS } from './types'
import { buildAnalysisPrompt } from './prompt'

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

// Lazy singleton
let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null

function getGoogleProvider() {
  if (!GOOGLE_API_KEY) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')
  if (!googleProvider) {
    googleProvider = createGoogleGenerativeAI({ apiKey: GOOGLE_API_KEY })
  }
  return googleProvider
}

// Zod schema for structured output
const DimensionSchema = z.object({
  key: z.string(),
  name: z.string(),
  score: z.number().min(0).max(100),
  observations: z.array(z.string()).min(2).max(3),
  suggestion: z.string(),
})

const AnalysisSchema = z.object({
  dimensions: z.array(DimensionSchema).length(5),
  overallSummary: z.string(),
})

export async function analyzeListing(data: ListingData): Promise<AnalysisResult> {
  const provider = getGoogleProvider()
  const model = provider('gemini-2.5-flash')

  const prompt = buildAnalysisPrompt(data)

  // Build message parts — include photo URLs as image parts for multimodal analysis
  // Gemini supports URL-based images via the AI SDK
  const parts: Array<{ type: string; text?: string; image?: string }> = [
    { type: 'text', text: prompt },
  ]

  // Add up to 15 photos as image parts
  const photos = data.photoUrls.slice(0, 15)
  for (const url of photos) {
    parts.push({ type: 'image', image: url })
  }

  const result = await generateObject({
    model,
    schema: AnalysisSchema,
    messages: [
      {
        role: 'user',
        content: parts.map((p) =>
          p.type === 'text'
            ? { type: 'text' as const, text: p.text! }
            : { type: 'image' as const, image: new URL(p.image!) },
        ),
      },
    ],
    maxRetries: 2,
  })

  // Calculate weighted overall score
  const dimensions: DimensionScore[] = result.object.dimensions.map((d) => ({
    name: d.name,
    key: d.key,
    weight: DIMENSIONS.find((dim) => dim.key === d.key)?.weight ?? 0.2,
    score: Math.round(d.score),
    observations: d.observations,
    suggestion: d.suggestion,
  }))

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0),
  )

  return {
    dimensions,
    overallScore,
    summary: result.object.overallSummary,
  }
}
