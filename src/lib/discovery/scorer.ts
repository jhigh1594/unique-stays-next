// LLM novelty scorer for stay candidates
// Scores listings on "experience novelty" — treehouses, domes, caves score high;
// generic cabins and standard vacation rentals score low.
// Uses NVIDIA NIM with OpenRouter failover via shared LLM module.

import { generateWithFailover } from '@/lib/llm'

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
  source?: 'llm' | 'rules'
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

const US_STATES = [
  'Alabama','AL','Alaska','AK','Arizona','AZ','Arkansas','AR','California','CA',
  'Colorado','CO','Connecticut','CT','Delaware','DE','Florida','FL','Georgia','GA',
  'Hawaii','HI','Idaho','ID','Illinois','IL','Indiana','IN','Iowa','IA','Kansas','KS',
  'Kentucky','KY','Louisiana','LA','Maine','ME','Maryland','MD','Massachusetts','MA',
  'Michigan','MI','Minnesota','MN','Mississippi','MS','Missouri','MO','Montana','MT',
  'Nebraska','NE','Nevada','NV','New Hampshire','NH','New Jersey','NJ','New Mexico','NM',
  'New York','NY','North Carolina','NC','North Dakota','ND','Ohio','OH','Oklahoma','OK',
  'Oregon','OR','Pennsylvania','PA','Rhode Island','RI','South Carolina','SC',
  'South Dakota','SD','Tennessee','TN','Texas','TX','Utah','UT','Vermont','VT',
  'Virginia','VA','Washington','WA','West Virginia','WV','Wisconsin','WI','Wyoming','WY',
  'District of Columbia','DC',
]

const NON_US_INDICATORS = [
  'Italy','Spain','Costa Rica','Greece','Australia','Guatemala','Austria',
  'India','France','Mexico','United Kingdom','Tasmania','British Columbia','Ontario',
  'Queensland','Canada','Germany','Portugal','Thailand','Japan','Brazil','Argentina',
  'Chile','Peru','Colombia','Ecuador','Belize','Honduras','Nicaragua','Panama',
  'New Zealand','Ireland','Scotland','Wales','Netherlands','Belgium','Switzerland',
  'Czech Republic','Croatia','Slovenia','Sweden','Norway','Denmark','Finland',
  'Iceland','Poland','Hungary','Romania','Bulgaria','Turkey','Morocco','South Africa',
  'Kenya','Tanzania','Uganda','Philippines','Indonesia','Vietnam','Cambodia',
  'Malaysia','South Korea','China','Taiwan','Singapore',
]

function isUsListing(listing: ScorableListing): boolean {
  const loc = [listing.title, listing.location, listing.description].filter(Boolean).join(' ')
  const hasUsState = US_STATES.some(
    (s) => loc.includes(`, ${s}`) || loc.includes(`, ${s},`) || loc.endsWith(`, ${s}`) || loc === s,
  )
  if (hasUsState) return true
  const hasNonUs = NON_US_INDICATORS.some((ind) => loc.includes(ind))
  if (hasNonUs) return false
  return true
}

const MAX_RETRIES = 5
const RETRY_BASE_MS = 2000

const RULE_PATTERNS: Array<{
  category: string
  score: number
  pattern: RegExp
  reason: string
}> = [
  {
    category: 'treehouse',
    score: 9,
    pattern: /\b(treehouse|tree house|elevated treehouse|canopy stay)\b/i,
    reason: 'Rule-scored: treehouse or elevated structure signal.',
  },
  {
    category: 'dome',
    score: 8,
    pattern: /\b(geodesic dome|bubble dome|stargazing dome|dome cabin)\b/i,
    reason: 'Rule-scored: distinctive dome stay format.',
  },
  {
    category: 'a-frame',
    score: 7,
    pattern: /\b(a-frame|aframe)\b/i,
    reason: 'Rule-scored: distinctive A-frame architecture.',
  },
  {
    category: 'glamping',
    score: 7,
    pattern: /\b(glamp|glamping|safari tent|yurt|canvas tent)\b/i,
    reason: 'Rule-scored: glamping or tented stay format.',
  },
  {
    category: 'converted',
    score: 8,
    pattern: /\b(caboose|train car|silo|barn|church|fire tower|lighthouse|cave|hobbit|shipping container)\b/i,
    reason: 'Rule-scored: converted or unusual structure signal.',
  },
  {
    category: 'architectural',
    score: 7,
    pattern: /\b(architectural retreat|architect-designed|iconic|clifftop|360 views|high desert|black desert|pioneertown|joshua tree|red rocks)\b/i,
    reason: 'Rule-scored: memorable architecture or setting signal.',
  },
  {
    category: 'cabin',
    score: 5,
    pattern: /\b(private creek|creekfront|riverfront|waterfall|stargazing|mountain view|forest view|blue ridge|smoky mountains)\b/i,
    reason: 'Rule-scored: above-average cabin setting or nature feature.',
  },
]

export function scoreNoveltyWithRules(listing: ScorableListing): NoveltyScore {
  if (!isUsListing(listing)) {
    return { score: 0, reason: 'Non-US listing', category: 'filtered', source: 'rules' }
  }

  const content = [
    listing.title,
    listing.location,
    listing.description,
    listing.amenities?.join(' '),
  ].filter(Boolean).join('\n')

  let best: NoveltyScore = {
    score: 3,
    reason: 'Rule-scored: nice property but no strong structural novelty signal found.',
    category: 'generic',
    source: 'rules',
  }

  for (const rule of RULE_PATTERNS) {
    if (rule.pattern.test(content) && rule.score > best.score) {
      best = {
        score: rule.score,
        reason: rule.reason,
        category: rule.category,
        source: 'rules',
      }
    }
  }

  const amenityBoost = /\b(hot tub|sauna|ev charger|desk|workstation|fiber|pool|fire pit)\b/i.test(content) ? 0.5 : 0
  const settingBoost = /\b(private|secluded|remote|national park|desert|mountain|forest|lake)\b/i.test(content) ? 0.5 : 0
  const luxuryPenalty = best.score <= 5 && /\b(luxury vacation rental|luxury home|estate)\b/i.test(content) ? 0.5 : 0

  const score = Math.max(0, Math.min(10, Math.round((best.score + amenityBoost + settingBoost - luxuryPenalty) * 10) / 10))

  return {
    ...best,
    score,
    reason: `${best.reason} Needs editorial review when LLM scoring is unavailable.`,
  }
}

export async function scoreNovelty(
  listing: ScorableListing,
  modelId?: string,
): Promise<NoveltyScore> {
  if (!isUsListing(listing)) {
    return { score: 0, reason: 'Non-US listing', category: 'filtered' }
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { text: rawText, provider } = await generateWithFailover({
        system: SYSTEM_PROMPT,
        prompt: buildScoringPrompt(listing),
        maxOutputTokens: 200,
        temperature: 0.3,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'novelty-scorer',
          metadata: {
            listing_platform: listing.platform,
          },
        },
      }, 'discover', modelId)

    let text = rawText.trim()
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (fenceMatch) text = fenceMatch[1].trim()

    // Extract first JSON object with "score" key from possibly noisy text
    const jsonMatch = text.match(/\{[\s\S]*?"score"[\s\S]*?\}/)
    if (jsonMatch) text = jsonMatch[0]

    // Fix single-quoted JSON
    text = text.replace(/'/g, '"')

    const parsed = JSON.parse(text)

    return {
      score: Math.max(0, Math.min(10, Number(parsed.score ?? 0))),
      reason: String(parsed.reason ?? '').slice(0, 500),
      category: String(parsed.category ?? 'generic').slice(0, 50),
      source: 'llm',
    }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('Too Many Requests') && attempt < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * attempt
        process.stdout.write(`  Rate limited, retrying in ${backoff}ms (attempt ${attempt}/${MAX_RETRIES})\n`)
        await new Promise((r) => setTimeout(r, backoff))
        continue
      }
      process.stdout.write(`  LLM scoring unavailable for "${listing.title}"; using rule score: ${message}\n`)
      return scoreNoveltyWithRules(listing)
    }
  }
  return scoreNoveltyWithRules(listing)
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
