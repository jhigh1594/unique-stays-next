// AI editorial generation module
// Transforms scraped data + stay metadata into editorial content in brand voice
// Uses NVIDIA NIM (free, OpenAI-compatible) via @ai-sdk/openai

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const nim = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_NIM_API_KEY,
})

const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct'

export interface StayMetadata {
  title: string
  location: string
  state: string
  region: string
  category: string
  tags: string[]
  description: string
  price: number
}

export interface ScrapedInput {
  description: string
  amenities: string[]
  neighborhood: string
}

export interface GeneratedContent {
  body: string
  areaGuide?: string
  faqs?: Array<{ question: string; answer: string }>
  editorNote?: string
  bestFor: string
  bestSeason: string
  vibe: string
  needsReview: boolean
}

const MAX_SCRAPED_LENGTH = 4000

function sanitizeScrapedText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/<script[\s\S]*?<\/script>/gi, '') // strip script blocks
    .replace(/<!--[\s\S]*?-->/g, '') // strip HTML comments
    .replace(/javascript:/gi, '') // strip javascript: URLs
    .trim()
    .slice(0, MAX_SCRAPED_LENGTH)
}

function buildSystemPrompt(): string {
  return `You are the editorial voice of UniqueStaysUSA — "The Wanderer's Postcard Collection."
A curated travel editorial that treats every listing like a story worth telling.

Voice: Warm, first-person, slightly literary. Think Kinfolk meets Monocle meets a dog-eared travel journal.
You write like a well-traveled friend who just got back and can't stop talking about this place.

Rules:
- Write in second person ("you") or first person plural ("we"), never corporate third person
- Ground every claim in the scraped facts — never invent amenities, attractions, or details
- Use specific, sensory language (not "beautiful views" but "a valley that opens up like a theater curtain")
- Keep paragraphs tight: 2-4 sentences each
- No clichés ("hidden gem", "breathtaking", "nestled", "escape the everyday")
- No exclamation marks
- No sales language or urgency ("book now", "don't miss out")`
}

function buildTier1Prompt(stay: StayMetadata, scraped: ScrapedInput): string {
  const sanitizedDescription = sanitizeScrapedText(scraped.description)
  const sanitizedNeighborhood = sanitizeScrapedText(scraped.neighborhood)

  return `Generate editorial content for this unique stay:

**Stay:** ${stay.title}
**Location:** ${stay.location}, ${stay.state}
**Category:** ${stay.category}
**Tags:** ${stay.tags.join(', ')}
**Price:** $${stay.price}/night
**Existing description:** ${stay.description}

**Scraped host description:**
${sanitizedDescription}

**Scraped amenities:** ${scraped.amenities.join(', ')}

**Scraped neighborhood info:**
${sanitizedNeighborhood}

Generate these fields as a JSON object:

1. "body" — A rich editorial description (2-3 paragraphs, max 5000 chars). Tell the story of staying here: what it feels like to arrive, what the space is like, what makes it special. Use the scraped description for facts but transform them into editorial voice.

2. "areaGuide" — A neighborhood/area guide (1-2 paragraphs, max 2000 chars). What's nearby? What should visitors know about the area? Mention specific attractions, restaurants, or natural features if available in the scraped data.

3. "faqs" — 3-5 FAQ pairs as an array of {question, answer}. Practical questions a traveler would ask: getting there, what to bring, nearby activities, seasonal considerations. Each answer 1-2 sentences.

4. "editorNote" — One sentence pull-quote capturing why this stay is special (max 200 chars). Think magazine cover line.

5. "bestFor" — Who this stay is perfect for (e.g., "Couples seeking solitude")

6. "bestSeason" — Best time to visit with brief reason (e.g., "Fall — the canopy turns gold")

7. "vibe" — The atmosphere in a few words (e.g., "Deep woods, deliberately offline")

Return ONLY valid JSON, no markdown fences.`
}

function buildTier2Prompt(stay: StayMetadata, scraped: ScrapedInput): string {
  const sanitizedDescription = sanitizeScrapedText(scraped.description)

  return `Generate editorial content for this unique stay (lighter treatment):

**Stay:** ${stay.title}
**Location:** ${stay.location}, ${stay.state}
**Category:** ${stay.category}
**Tags:** ${stay.tags.join(', ')}
**Price:** $${stay.price}/night
**Existing description:** ${stay.description}

**Scraped host description:**
${sanitizedDescription}

**Scraped amenities:** ${scraped.amenities.join(', ')}

Generate these fields as a JSON object:

1. "body" — An extended editorial description (1-2 paragraphs, max 5000 chars). Capture what makes this stay worth booking. Use scraped facts but write in editorial voice.

2. "bestFor" — Who this stay is perfect for (e.g., "Families with dogs")

3. "bestSeason" — Best time to visit with brief reason (e.g., "Summer — lake swimming season")

4. "vibe" — The atmosphere in a few words (e.g., "Lakefront, unhurried")

Return ONLY valid JSON, no markdown fences.`
}

export async function generateEditorialContent(
  stay: StayMetadata,
  scraped: ScrapedInput,
  tier: 1 | 2,
  modelId?: string,
): Promise<GeneratedContent> {
  const model = nim(modelId ?? DEFAULT_MODEL)
  const prompt = tier === 1 ? buildTier1Prompt(stay, scraped) : buildTier2Prompt(stay, scraped)

  // Determine needsReview based on input richness
  const hasDescription = scraped.description.length > 50
  const hasMultipleAmenities = scraped.amenities.length >= 3
  const hasNeighborhood = scraped.neighborhood.length > 50
  const needsReview = !hasDescription || !hasMultipleAmenities

  try {
    const result = await generateText({
      model,
      system: buildSystemPrompt(),
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    const parsed = JSON.parse(result.text)

    return {
      body: String(parsed.body ?? '').slice(0, 5000),
      areaGuide: tier === 1 ? String(parsed.areaGuide ?? '').slice(0, 2000) : undefined,
      faqs:
        tier === 1 && Array.isArray(parsed.faqs)
          ? parsed.faqs
              .filter((f: unknown) => typeof f === 'object' && f !== null)
              .slice(0, 10)
              .map((f: Record<string, unknown>) => ({
                question: String(f.question ?? ''),
                answer: String(f.answer ?? ''),
              }))
          : undefined,
      editorNote: tier === 1 ? String(parsed.editorNote ?? '').slice(0, 200) : undefined,
      bestFor: String(parsed.bestFor ?? ''),
      bestSeason: String(parsed.bestSeason ?? ''),
      vibe: String(parsed.vibe ?? ''),
      needsReview,
    }
  } catch (err) {
    // If LLM fails, return minimal content with needsReview flag
    return {
      body: stay.description,
      bestFor: '',
      bestSeason: '',
      vibe: '',
      needsReview: true,
    }
  }
}
