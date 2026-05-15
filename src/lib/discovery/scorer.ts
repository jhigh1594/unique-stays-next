// LLM novelty scorer for stay candidates
// Scores listings on "experience novelty" — treehouses, domes, caves score high;
// generic cabins and standard vacation rentals score low.
// Uses NVIDIA NIM (free, OpenAI-compatible) via @ai-sdk/openai

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const nim = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: (process.env.NVIDIA_NIM_API_KEY || '').replace(/^["']|["']$/g, ''),
})

const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct'

export interface ScorableListing {
  title: string
  location: string
  description: string
  platform: string
  price: number | null
  imageUrl?: string
  amenities?: string[]
}

export interface NoveltyScore {
  score: number // 0-10
  reason: string
  category: string // e.g. "treehouse", "dome", "cabin", "generic"
}

const SYSTEM_PROMPT = `You are an expert curator for UniqueStaysUSA, a directory of unique vacation rentals.

Your job is to score listings on "experience novelty" — how distinctive and memorable the STAY EXPERIENCE is, not just how nice the property is.

Scoring guide:
- 9-10: Extraordinary structures (treehouses, caves, lighthouses, planes, trains, igloos, hobbit holes, converted churches/silos/firehouses)
- 7-8: Distinctive architecture (geodesic domes, yurts, glamping tents, A-frames with unique features, tiny homes with creative design)
- 5-6: Above-average uniqueness (cabins with unusual features like stargazing decks, hot springs access, private waterfalls)
- 3-4: Nice but common (well-designed cabins, nice lake houses, standard tiny homes without unique features)
- 0-2: Generic (standard condos, apartments, typical vacation rentals, hotel-like properties)

Key factors:
- Structure type matters more than amenities
- A treehouse with basic amenities scores higher than a luxury condo with every amenity
- Location uniqueness helps (private island, volcano adjacent, desert isolated) but doesn't override generic structure
- "Luxury" and "beautiful" do NOT mean novel
- Renovated/vintage properties score higher if the renovation preserves unique character

You MUST respond with ONLY valid JSON — no markdown fences, no commentary.`

function buildScoringPrompt(listing: ScorableListing): string {
  const parts = [
    `Title: ${listing.title}`,
    `Location: ${listing.location}`,
    `Platform: ${listing.platform}`,
  ]
  if (listing.price) parts.push(`Price: $${listing.price}/night`)
  if (listing.description) parts.push(`Description: ${listing.description.slice(0, 1000)}`)
  if (listing.amenities?.length) parts.push(`Amenities: ${listing.amenities.join(', ')}`)

  return `${parts.join('\n')}

Score this listing on experience novelty (0-10). Return JSON:
{
  "score": <number 0-10>,
  "reason": "<1-2 sentences explaining the score>",
  "category": "<property type: treehouse|dome|yurt|cave|lighthouse|cabin|tiny-home|castle|silo|converted|glamping|generic>"
}`
}

const MAX_RETRIES = 5
const RETRY_BASE_MS = 2000

export async function scoreNovelty(
  listing: ScorableListing,
  modelId?: string,
): Promise<NoveltyScore> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await generateText({
        model: nim.chat(modelId ?? DEFAULT_MODEL),
        system: SYSTEM_PROMPT,
        prompt: buildScoringPrompt(listing),
        maxOutputTokens: 200,
        temperature: 0.3,
      })

    let text = result.text.trim()
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (fenceMatch) text = fenceMatch[1].trim()

    const parsed = JSON.parse(text)

    return {
      score: Math.max(0, Math.min(10, Number(parsed.score ?? 0))),
      reason: String(parsed.reason ?? '').slice(0, 500),
      category: String(parsed.category ?? 'generic').slice(0, 50),
    }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('Too Many Requests') && attempt < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * attempt
        process.stdout.write(`  Rate limited, retrying in ${backoff}ms (attempt ${attempt}/${MAX_RETRIES})\n`)
        await new Promise((r) => setTimeout(r, backoff))
        continue
      }
      process.stdout.write(`  Scoring failed for "${listing.title}": ${message}\n`)
      return { score: 0, reason: 'Scoring failed', category: 'unknown' }
    }
  }
  return { score: 0, reason: 'Scoring failed', category: 'unknown' }
}

export async function scoreBatch(
  listings: ScorableListing[],
  modelId?: string,
  delayMs = 1000,
): Promise<Array<ScorableListing & { novelty: NoveltyScore }>> {
  const scored: Array<ScorableListing & { novelty: NoveltyScore }> = []

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i]
    const novelty = await scoreNovelty(listing, modelId)
    scored.push({ ...listing, novelty })

    if (delayMs > 0 && i < listings.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return scored
}
