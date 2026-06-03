# Listing Description Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free listing description generator at `/listing-generator` that scrapes or accepts manual stay details, generates an optimized title + description via Gemini Flash with editorial notes, and captures host emails.

**Architecture:** URL-first flow reuses Unique Score's scraper (`src/lib/unique-score/scraper.ts`). Manual fallback form provides 8-10 fields. Single Gemini Flash call produces a `GenerationResult` (title, description, 3 editorial notes). Results preview shows title with blurred description behind an email gate. Completely free — SEO + email capture only.

**Tech Stack:** Next.js 16 App Router, Vercel AI SDK (`ai` + `@ai-sdk/google`), Zod, Payload CMS, Vitest + React Testing Library, Framer Motion, Tailwind v4 (OKLCH tokens).

---

## File Map

**Create:**
- `src/lib/listing-generator/types.ts` — TypeScript interfaces and constants
- `src/lib/listing-generator/cache.ts` — URL-based result caching (24h TTL)
- `src/lib/listing-generator/prompt.ts` — Editor-in-Chief system prompt builder
- `src/lib/listing-generator/index.ts` — Barrel exports
- `src/app/api/listing-generator/generate/route.ts` — POST: scrape + generate (URL path)
- `src/app/api/listing-generator/generate-manual/route.ts` — POST: generate from form data
- `src/app/api/listing-generator/lead/route.ts` — POST: email capture
- `src/app/(app)/listing-generator/page.tsx` — Server page with SEO metadata
- `src/app/(app)/listing-generator/ListingGeneratorClient.tsx` — Client state machine
- `src/app/(app)/listing-generator/_components/GeneratorHero.tsx` — Hero with URL input + manual toggle
- `src/app/(app)/listing-generator/_components/ManualForm.tsx` — Detailed manual entry form
- `src/app/(app)/listing-generator/_components/LoadingState.tsx` — Typewriter loading animation
- `src/app/(app)/listing-generator/_components/ResultsPreview.tsx` — Title visible, description blurred
- `src/app/(app)/listing-generator/_components/EmailGate.tsx` — Email capture
- `src/app/(app)/listing-generator/_components/FullResults.tsx` — Complete results + copy/share
- `src/app/(app)/listing-generator/_components/EditorialNote.tsx` — Single editorial note card
- `src/app/(app)/listing-generator/_components/UniqueScoreCTA.tsx` — Cross-sell to /unique-score

**Test:**
- `src/lib/listing-generator/__tests__/types.test.ts`
- `src/lib/listing-generator/__tests__/cache.test.ts`
- `src/lib/listing-generator/__tests__/prompt.test.ts`
- `src/app/api/listing-generator/generate/__tests__/route.test.ts`
- `src/app/api/listing-generator/generate-manual/__tests__/route.test.ts`
- `src/app/api/listing-generator/lead/__tests__/route.test.ts`
- `src/app/(app)/listing-generator/_components/__tests__/GeneratorHero.test.tsx`
- `src/app/(app)/listing-generator/_components/__tests__/ManualForm.test.tsx`
- `src/app/(app)/listing-generator/_components/__tests__/FullResults.test.tsx`

**Modify:** None — pure additive.

---

### Task 1: Types and Validation

**Files:**
- Create: `src/lib/listing-generator/types.ts`
- Test: `src/lib/listing-generator/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/listing-generator/__tests__/types.test.ts
import { describe, it, expect } from 'vitest'
import {
  detectPlatform,
  validateListingUrl,
  validateManualInput,
  STAY_TYPES,
  VIBES,
  GUEST_TYPES,
  type ListingInput,
  type GenerationResult,
  type EditorialNote,
} from '../types'

describe('detectPlatform', () => {
  it('detects Airbnb URLs', () => {
    expect(detectPlatform('https://www.airbnb.com/rooms/12345')).toBe('airbnb')
    expect(detectPlatform('https://airbnb.com/w/12345')).toBe('airbnb')
    expect(detectPlatform('https://www.airbnb.co.uk/rooms/12345')).toBe('airbnb')
  })

  it('detects VRBO URLs', () => {
    expect(detectPlatform('https://www.vrbo.com/12345')).toBe('vrbo')
  })

  it('detects Wander URLs', () => {
    expect(detectPlatform('https://www.wander.com/stays/some-stay')).toBe('wander')
  })

  it('returns null for unsupported URLs', () => {
    expect(detectPlatform('https://www.example.com/listing')).toBeNull()
    expect(detectPlatform('https://www.booking.com/hotel/us/foo')).toBeNull()
  })

  it('handles URLs without protocol', () => {
    expect(detectPlatform('www.airbnb.com/rooms/12345')).toBeNull()
  })
})

describe('validateListingUrl', () => {
  it('accepts valid Airbnb URLs', () => {
    const result = validateListingUrl('https://www.airbnb.com/rooms/12345')
    expect(result.valid).toBe(true)
    expect(result.platform).toBe('airbnb')
  })

  it('accepts valid VRBO URLs', () => {
    const result = validateListingUrl('https://www.vrbo.com/12345')
    expect(result.valid).toBe(true)
    expect(result.platform).toBe('vrbo')
  })

  it('accepts valid Wander URLs', () => {
    const result = validateListingUrl('https://www.wander.com/stays/my-stay')
    expect(result.valid).toBe(true)
    expect(result.platform).toBe('wander')
  })

  it('rejects invalid URLs', () => {
    expect(validateListingUrl('not-a-url').valid).toBe(false)
    expect(validateListingUrl('').valid).toBe(false)
  })

  it('rejects unsupported platforms', () => {
    const result = validateListingUrl('https://www.booking.com/hotel/us/foo')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Airbnb, VRBO, or Wander')
  })
})

describe('validateManualInput', () => {
  const validInput: ListingInput = {
    stayType: 'treehouse',
    propertyName: 'Catskills Pine Treehouse',
    city: 'Woodstock',
    state: 'New York',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    standoutFeatures: ['Stargazing deck', 'Wood-burning stove', 'Canopy views'],
    vibe: 'romantic',
  }

  it('accepts valid input', () => {
    const result = validateManualInput(validInput)
    expect(result.valid).toBe(true)
  })

  it('rejects missing required fields', () => {
    const { stayType, ...missingType } = validInput
    expect(validateManualInput(missingType as ListingInput).valid).toBe(false)
  })

  it('rejects invalid stay type', () => {
    const result = validateManualInput({ ...validInput, stayType: 'skyscraper' })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid vibe', () => {
    const result = validateManualInput({ ...validInput, vibe: 'chaotic' })
    expect(result.valid).toBe(false)
  })

  it('accepts optional fields as undefined', () => {
    const { targetGuest, currentDescription, ...required } = validInput
    expect(validateManualInput(required as ListingInput).valid).toBe(true)
  })
})

describe('constants', () => {
  it('STAY_TYPES has expected entries', () => {
    expect(STAY_TYPES).toContain('treehouse')
    expect(STAY_TYPES).toContain('dome')
    expect(STAY_TYPES).toContain('yurt')
    expect(STAY_TYPES.length).toBe(10)
  })

  it('VIBES has expected entries', () => {
    expect(VIBES).toContain('romantic')
    expect(VIBES).toContain('luxury')
  })

  it('GUEST_TYPES has expected entries', () => {
    expect(GUEST_TYPES).toContain('couples')
    expect(GUEST_TYPES).toContain('digital-nomads')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/listing-generator/__tests__/types.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/listing-generator/types.ts
export type Platform = 'airbnb' | 'vrbo' | 'wander'

export const STAY_TYPES = [
  'treehouse', 'dome', 'yurt', 'a-frame', 'cabin',
  'lighthouse', 'houseboat', 'tiny-home', 'glamping-tent', 'other',
] as const
export type StayType = (typeof STAY_TYPES)[number]

export const VIBES = [
  'romantic', 'adventurous', 'rustic', 'luxury', 'family-friendly', 'off-grid',
] as const
export type Vibe = (typeof VIBES)[number]

export const GUEST_TYPES = [
  'couples', 'families', 'solo', 'groups', 'digital-nomads',
] as const
export type GuestType = (typeof GUEST_TYPES)[number]

export interface ListingInput {
  stayType: StayType
  propertyName: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  sleeps: number
  standoutFeatures: [string, string, string]
  vibe: Vibe
  targetGuest?: GuestType
  currentDescription?: string
}

export interface GenerationResult {
  title: string
  description: string
  editorialNotes: EditorialNote[]
  stayTypeAffinity: string
}

export interface EditorialNote {
  category: 'hook' | 'story' | 'conversion'
  note: string
  example?: string
}

export interface GenerationResponse {
  id: string
  result: GenerationResult
  platform?: Platform
  listingTitle?: string | null
  cached: boolean
}

// URL validation patterns (reuse from unique-score)
export const URL_PATTERNS: Record<Platform, RegExp> = {
  airbnb: /airbnb\.(com|co\.uk|ca|com\.au)\/(?:rooms|w)\/(\d+)/i,
  vrbo: /vrbo\.com\/(\d+)/i,
  wander: /wander\.com\/stays\/([\w-]+)/i,
}

export function detectPlatform(url: string): Platform | null {
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) return platform as Platform
  }
  return null
}

export function validateListingUrl(url: string): { valid: boolean; platform?: Platform; error?: string } {
  try {
    new URL(url)
  } catch {
    return { valid: false, error: 'Please enter a valid URL.' }
  }

  const platform = detectPlatform(url)
  if (!platform) {
    return {
      valid: false,
      error: 'We currently support Airbnb, VRBO, or Wander listings. Use the manual form for other platforms.',
    }
  }

  return { valid: true, platform }
}

export function validateManualInput(input: Partial<ListingInput>): { valid: boolean; error?: string } {
  if (!input.stayType || !(STAY_TYPES as readonly string[]).includes(input.stayType)) {
    return { valid: false, error: 'Please select a valid stay type.' }
  }
  if (!input.propertyName || input.propertyName.trim().length === 0) {
    return { valid: false, error: 'Please enter a property name or location.' }
  }
  if (!input.city || input.city.trim().length === 0) {
    return { valid: false, error: 'Please enter a city.' }
  }
  if (!input.state || input.state.trim().length === 0) {
    return { valid: false, error: 'Please enter a state.' }
  }
  if (!input.bedrooms || input.bedrooms < 0) {
    return { valid: false, error: 'Please enter a valid number of bedrooms.' }
  }
  if (!input.bathrooms || input.bathrooms < 0) {
    return { valid: false, error: 'Please enter a valid number of bathrooms.' }
  }
  if (!input.sleeps || input.sleeps < 1) {
    return { valid: false, error: 'Please enter how many guests the property sleeps.' }
  }
  if (!input.standoutFeatures || input.standoutFeatures.length < 3) {
    return { valid: false, error: 'Please provide 3 standout features.' }
  }
  if (!input.vibe || !(VIBES as readonly string[]).includes(input.vibe)) {
    return { valid: false, error: 'Please select a valid vibe.' }
  }
  return { valid: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/listing-generator/__tests__/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/listing-generator/types.ts src/lib/listing-generator/__tests__/types.test.ts
git commit -m "feat(listing-generator): add types, validation, and constants"
```

---

### Task 2: Cache Module

**Files:**
- Create: `src/lib/listing-generator/cache.ts`
- Test: `src/lib/listing-generator/__tests__/cache.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/listing-generator/__tests__/cache.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ListingGeneratorCache } from '../cache'
import type { GenerationResult } from '../types'

const mockResult: GenerationResult = {
  title: 'Enchanted Treehouse in the Redwoods',
  description: 'Nestled 40 feet up in ancient redwood trees...',
  editorialNotes: [
    { category: 'hook', note: 'Opens with height — most guests scroll past ground-level listings.' },
    { category: 'story', note: 'Narrative arc: arrival → ascent → canopy reveal.' },
    { category: 'conversion', note: 'Urgency trigger: "only 2 dates left this month".' },
  ],
  stayTypeAffinity: 'Treehouses thrive on the sense of elevation and separation from the ground world.',
}

describe('ListingGeneratorCache', () => {
  let cache: ListingGeneratorCache

  beforeEach(() => {
    cache = new ListingGeneratorCache()
  })

  it('returns miss for uncached URL', () => {
    const result = cache.get('https://www.airbnb.com/rooms/12345')
    expect(result.hit).toBe(false)
    expect(result.data).toBeUndefined()
  })

  it('returns hit after storing', () => {
    const url = 'https://www.airbnb.com/rooms/12345'
    cache.set(url, mockResult)
    const result = cache.get(url)
    expect(result.hit).toBe(true)
    expect(result.data).toEqual(mockResult)
  })

  it('normalizes URLs for cache lookup', () => {
    cache.set('https://www.airbnb.com/rooms/12345', mockResult)
    const result = cache.get('https://www.airbnb.com/rooms/12345?check_in=2026-07-01')
    expect(result.hit).toBe(true)
  })

  it('respects TTL — expired entries are misses', () => {
    const shortCache = new ListingGeneratorCache(0) // 0ms TTL = instant expiry
    shortCache.set('https://www.airbnb.com/rooms/12345', mockResult)
    const result = shortCache.get('https://www.airbnb.com/rooms/12345')
    expect(result.hit).toBe(false)
  })

  it('generates consistent hashes for same URL', () => {
    const url = 'https://www.airbnb.com/rooms/12345'
    cache.set(url, mockResult)
    // Different casing should still hit (URLs are case-insensitive for domain)
    const result = cache.get('https://WWW.AIRBNB.COM/rooms/12345')
    expect(result.hit).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/listing-generator/__tests__/cache.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/listing-generator/cache.ts
import type { GenerationResult } from './types'

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

async function hashUrl(url: string): Promise<string> {
  const normalized = new URL(url).toString().toLowerCase()
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

interface CacheEntry {
  data: GenerationResult
  storedAt: number
}

export interface CacheLookup {
  hit: boolean
  data?: GenerationResult
}

export class ListingGeneratorCache {
  private store = new Map<string, CacheEntry>()
  private ttlMs: number

  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs
  }

  async get(url: string): Promise<CacheLookup> {
    const key = await hashUrl(url)
    const entry = this.store.get(key)
    if (!entry) return { hit: false }

    const age = Date.now() - entry.storedAt
    if (age > this.ttlMs) {
      this.store.delete(key)
      return { hit: false }
    }

    return { hit: true, data: entry.data }
  }

  async set(url: string, data: GenerationResult): Promise<void> {
    const key = await hashUrl(url)
    this.store.set(key, { data, storedAt: Date.now() })
  }
}

// Singleton for API route usage
export const generatorCache = new ListingGeneratorCache()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/listing-generator/__tests__/cache.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/listing-generator/cache.ts src/lib/listing-generator/__tests__/cache.test.ts
git commit -m "feat(listing-generator): add in-memory cache with 24h TTL"
```

---

### Task 3: Prompt Builder

**Files:**
- Create: `src/lib/listing-generator/prompt.ts`
- Test: `src/lib/listing-generator/__tests__/prompt.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/listing-generator/__tests__/prompt.test.ts
import { describe, it, expect } from 'vitest'
import { buildGenerationPrompt } from '../prompt'
import type { ListingInput } from '../types'

describe('buildGenerationPrompt', () => {
  it('includes stay type in prompt', () => {
    const input: ListingInput = {
      stayType: 'treehouse',
      propertyName: 'Catskills Pine Treehouse',
      city: 'Woodstock',
      state: 'New York',
      bedrooms: 2,
      bathrooms: 1,
      sleeps: 4,
      standoutFeatures: ['Stargazing deck', 'Wood-burning stove', 'Canopy views'],
      vibe: 'romantic',
    }
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('treehouse')
    expect(prompt).toContain('Catskills Pine Treehouse')
    expect(prompt).toContain('Woodstock')
    expect(prompt).toContain('romantic')
    expect(prompt).toContain('Stargazing deck')
  })

  it('includes current description when provided', () => {
    const input: ListingInput = {
      stayType: 'dome',
      propertyName: 'Desert Dome',
      city: 'Joshua Tree',
      state: 'California',
      bedrooms: 1,
      bathrooms: 1,
      sleeps: 2,
      standoutFeatures: ['Stargazing skylight', 'Hot tub', 'Fire pit'],
      vibe: 'adventurous',
      currentDescription: 'A nice dome in the desert. Come stay here.',
    }
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('A nice dome in the desert')
    expect(prompt).toContain('ORIGINAL LISTING COPY')
  })

  it('includes target guest when provided', () => {
    const input: ListingInput = {
      stayType: 'cabin',
      propertyName: 'Mountain Retreat',
      city: 'Asheville',
      state: 'North Carolina',
      bedrooms: 3,
      bathrooms: 2,
      sleeps: 6,
      standoutFeatures: ['Hot tub', 'Mountain views', 'Game room'],
      vibe: 'family-friendly',
      targetGuest: 'families',
    }
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('families')
  })

  it('includes JSON output format instruction', () => {
    const input: ListingInput = {
      stayType: 'yurt',
      propertyName: 'Yurt in the Woods',
      city: 'Bend',
      state: 'Oregon',
      bedrooms: 1,
      bathrooms: 1,
      sleeps: 2,
      standoutFeatures: ['Wood stove', 'Forest views', 'Outdoor shower'],
      vibe: 'rustic',
    }
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('title')
    expect(prompt).toContain('description')
    expect(prompt).toContain('editorialNotes')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/listing-generator/__tests__/prompt.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/listing-generator/prompt.ts
import type { ListingInput } from './types'

export function buildGenerationPrompt(input: ListingInput): string {
  const stayType = input.stayType
  const location = `${input.city}, ${input.state}`

  const featuresBlock = input.standoutFeatures
    .map((f, i) => `  ${i + 1}. ${f}`)
    .join('\n')

  const targetGuestBlock = input.targetGuest
    ? `\n**Target guests:** ${input.targetGuest}`
    : ''

  const originalCopyBlock = input.currentDescription
    ? `\n## ORIGINAL LISTING COPY (rewrite this)\n${input.currentDescription}`
    : ''

  return `You are a travel editor at a premium unique stays publication. You rewrite vacation rental listing descriptions to maximize bookings while capturing what makes each property unforgettable. You specialize in unique stays — treehouses, domes, yurts, A-frames, cabins, lighthouses, houseboats, tiny homes, and glamping tents.

## Stay Details

**Stay type:** ${stayType}
**Property name/location:** ${input.propertyName}
**City, State:** ${location}
**Bedrooms:** ${input.bedrooms} | **Bathrooms:** ${input.bathrooms} | **Sleeps:** ${input.sleeps}
**Vibe:** ${input.vibe}${targetGuestBlock}

**Standout features:**
${featuresBlock}
${originalCopyBlock}

## What makes ${stayType}s special

Write copy that highlights what ${stayType} guests actually care about. Generic "cozy retreat" language doesn't work for unique stays. Be specific, sensory, and experience-driven.

## Task

Generate a listing title and description that:
1. Opens with a hook in the first 50 words that makes someone stop scrolling
2. Tells a story — not a spec sheet. Use sensory language ("morning light filters through the skylight" not "has skylight")
3. Weaves in the standout features naturally, not as a bullet list
4. Creates urgency without being pushy
5. Matches the "${input.vibe}" vibe throughout

**Title rules:**
- Maximum 50 characters
- Lead with the most compelling detail, not the location
- No exclamation marks

**Description rules:**
- 150–250 words
- 3–4 short paragraphs
- No bullet points or lists
- Write in second person ("you'll wake up to..." not "guests will enjoy...")
- Include at least one specific sensory detail per paragraph

## Response Format

Return ONLY valid JSON matching this exact structure:
{
  "title": "string (max 50 chars)",
  "description": "string (150-250 words)",
  "editorialNotes": [
    {
      "category": "hook",
      "note": "string (1-2 sentences explaining why the opening works)",
      "example": "string (optional before/after snippet)"
    },
    {
      "category": "story",
      "note": "string (1-2 sentences explaining the narrative structure)",
      "example": "string (optional before/after snippet)"
    },
    {
      "category": "conversion",
      "note": "string (1-2 sentences explaining the booking psychology)",
      "example": "string (optional before/after snippet)"
    }
  ],
  "stayTypeAffinity": "string (1 sentence: what makes this stay type special for personalization)"
}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/listing-generator/__tests__/prompt.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/listing-generator/prompt.ts src/lib/listing-generator/__tests__/prompt.test.ts
git commit -m "feat(listing-generator): add Editor-in-Chief prompt builder"
```

---

### Task 4: Barrel Exports

**Files:**
- Create: `src/lib/listing-generator/index.ts`

- [ ] **Step 1: Write the barrel export**

```typescript
// src/lib/listing-generator/index.ts
export { validateListingUrl, validateManualInput, detectPlatform, STAY_TYPES, VIBES, GUEST_TYPES } from './types'
export type { ListingInput, GenerationResult, GenerationResponse, EditorialNote, Platform, StayType, Vibe, GuestType } from './types'
export { ListingGeneratorCache, generatorCache } from './cache'
export { buildGenerationPrompt } from './prompt'
```

- [ ] **Step 2: Verify no import errors**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/listing-generator/index.ts
git commit -m "feat(listing-generator): add barrel exports"
```

---

### Task 5: API Route — Generate from URL

**Files:**
- Create: `src/app/api/listing-generator/generate/route.ts`
- Test: `src/app/api/listing-generator/generate/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/api/listing-generator/generate/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

// Mock the scraper
vi.mock('@/lib/unique-score/scraper', () => ({
  scrapeListing: vi.fn(),
}))

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => () => 'mock-model',
}))

// Mock payload
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    create: vi.fn(),
    find: vi.fn().mockResolvedValue({ docs: [] }),
  }),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { scrapeListing } from '@/lib/unique-score/scraper'
import { generateObject } from 'ai'

const mockScrapeListing = vi.mocked(scrapeListing)
const mockGenerateObject = vi.mocked(generateObject)

function mockRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/listing-generator/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/listing-generator/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when URL is missing', async () => {
    const req = mockRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 400 for unsupported platform', async () => {
    const req = mockRequest({ url: 'https://www.booking.com/hotel/us/foo' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Airbnb, VRBO, or Wander')
  })

  it('returns 422 when scraping fails', async () => {
    mockScrapeListing.mockResolvedValueOnce({
      success: false,
      error: 'Could not extract listing data.',
    })

    const req = mockRequest({ url: 'https://www.airbnb.com/rooms/12345' })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns generated result on success', async () => {
    mockScrapeListing.mockResolvedValueOnce({
      success: true,
      data: {
        title: 'Test Treehouse',
        description: 'A treehouse in the woods',
        photoUrls: [],
        amenities: ['WiFi'],
        rating: 4.9,
        reviewCount: 100,
        reviewSnippets: [],
        propertyType: 'Treehouse',
        hostName: 'John',
        location: 'Woodstock, NY',
        platform: 'airbnb',
      },
    })

    mockGenerateObject.mockResolvedValueOnce({
      object: {
        title: 'Enchanted Canopy Treehouse',
        description: 'Nestled 40 feet up in ancient oaks, this handcrafted treehouse offers an unforgettable escape from the everyday. Morning light filters through cathedral windows as the forest wakes beneath you. The wood-burning stove crackles on cool evenings while the stargazing deck transforms the night sky into your private planetarium. Two thoughtfully designed bedrooms float among the branches, each with views that make early risers grateful. The wraparound deck is where most guests spend their entire day — reading, napping, or simply watching the canopy sway. This is not a hotel room in the trees. It is a treehouse that happens to have a hotel-quality bed.',
        editorialNotes: [
          { category: 'hook', note: 'Opens with height (40 feet) which is the single most compelling detail for treehouse seekers.' },
          { category: 'story', note: 'Narrative arc: arrival/morning → evening/cozy → night/stars → practical details.' },
          { category: 'conversion', note: '"Not a hotel room in the trees" reframe creates distinction from competitors.' },
        ],
        stayTypeAffinity: 'Treehouses thrive on elevation, separation from the ground world, and the creaking intimacy of living among branches.',
      },
    } as any)

    const req = mockRequest({ url: 'https://www.airbnb.com/rooms/12345' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.result.title).toBeDefined()
    expect(data.result.description).toBeDefined()
    expect(data.result.editorialNotes).toHaveLength(3)
    expect(data.cached).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/listing-generator/generate/__tests__/route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/app/api/listing-generator/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { scrapeListing } from '@/lib/unique-score/scraper'
import { validateListingUrl } from '@/lib/listing-generator/types'
import { buildGenerationPrompt } from '@/lib/listing-generator/prompt'
import { generatorCache } from '@/lib/listing-generator/cache'
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
  title: z.string().max(50),
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
  try {
    // Rate limit
    const ip = getClientIp(req)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a few minutes before generating another description.' },
        { status: 429 },
      )
    }

    // Parse body
    const body = await req.json()
    const { url } = body as { url?: string }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a listing URL.' }, { status: 400 })
    }

    // Validate URL
    const validation = validateListingUrl(url)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check cache
    const cached = await generatorCache.get(url)
    if (cached.hit && cached.data) {
      return NextResponse.json({
        id: crypto.randomUUID(),
        result: cached.data,
        platform: validation.platform,
        cached: true,
      })
    }

    // Scrape listing
    const scrapeResult = await scrapeListing(url, validation.platform!)
    if (!scrapeResult.success || !scrapeResult.data) {
      return NextResponse.json(
        { error: scrapeResult.error || 'Failed to read that listing. Try the manual form instead.' },
        { status: 422 },
      )
    }

    const listingData = scrapeResult.data

    // Build ListingInput from scraped data
    const input: ListingInput = {
      stayType: inferStayType(listingData.propertyType, listingData.title),
      propertyName: listingData.title || 'Unique Stay',
      city: listingData.location?.split(',')[0]?.trim() || '',
      state: listingData.location?.split(',')?.[1]?.trim() || '',
      bedrooms: 1, // Scraper doesn't reliably extract these
      bathrooms: 1,
      sleeps: 2,
      standoutFeatures: inferFeatures(listingData),
      vibe: 'romantic', // Default
      currentDescription: listingData.description || undefined,
    }

    // Generate with Gemini
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

    // Cache result
    await generatorCache.set(url, generationResult)

    return NextResponse.json({
      id: crypto.randomUUID(),
      result: generationResult,
      platform: validation.platform,
      listingTitle: listingData.title || null,
      cached: false,
    })
  } catch (err) {
    console.error('[listing-generator/generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function inferStayType(propertyType: string | null, title: string): ListingInput['stayType'] {
  const text = `${propertyType || ''} ${title}`.toLowerCase()
  if (text.includes('treehouse')) return 'treehouse'
  if (text.includes('dome')) return 'dome'
  if (text.includes('yurt')) return 'yurt'
  if (text.includes('a-frame') || text.includes('aframe')) return 'a-frame'
  if (text.includes('lighthouse')) return 'lighthouse'
  if (text.includes('houseboat') || text.includes('boat')) return 'houseboat'
  if (text.includes('tiny') || text.includes('tiny home')) return 'tiny-home'
  if (text.includes('glamping') || text.includes('tent')) return 'glamping-tent'
  if (text.includes('cabin')) return 'cabin'
  return 'other'
}

function inferFeatures(data: { amenities: string[]; description: string }): [string, string, string] {
  const features: string[] = []

  // Pick top amenities as features
  const notable = data.amenities.filter(a =>
    /hot tub|pool|fireplace|stove|deck|view|wifi|kitchen|parking|pet/i.test(a)
  )
  features.push(...notable.slice(0, 3))

  // Pad with generic features if needed
  while (features.length < 3) {
    features.push(['Unique architecture', 'Scenic location', 'Memorable experience'][features.length])
  }

  return features.slice(0, 3) as [string, string, string]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/listing-generator/generate/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/listing-generator/generate/route.ts src/app/api/listing-generator/generate/__tests__/route.test.ts
git commit -m "feat(listing-generator): add URL-based generation API route"
```

---

### Task 6: API Route — Generate from Manual Input

**Files:**
- Create: `src/app/api/listing-generator/generate-manual/route.ts`
- Test: `src/app/api/listing-generator/generate-manual/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/api/listing-generator/generate-manual/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => () => 'mock-model',
}))

import { generateObject } from 'ai'
const mockGenerateObject = vi.mocked(generateObject)

function mockRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/listing-generator/generate-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/listing-generator/generate-manual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when required fields are missing', async () => {
    const req = mockRequest({ stayType: 'treehouse' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid stay type', async () => {
    const req = mockRequest({
      stayType: 'skyscraper',
      propertyName: 'Test',
      city: 'Test',
      state: 'Test',
      bedrooms: 1,
      bathrooms: 1,
      sleeps: 2,
      standoutFeatures: ['A', 'B', 'C'],
      vibe: 'romantic',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns generated result on valid input', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        title: 'Romantic Treehouse Escape',
        description: 'Wake up in the canopy...',
        editorialNotes: [
          { category: 'hook', note: 'Test hook note' },
          { category: 'story', note: 'Test story note' },
          { category: 'conversion', note: 'Test conversion note' },
        ],
        stayTypeAffinity: 'Treehouses offer unmatched seclusion.',
      },
    } as any)

    const req = mockRequest({
      stayType: 'treehouse',
      propertyName: 'Catskills Pine Treehouse',
      city: 'Woodstock',
      state: 'New York',
      bedrooms: 2,
      bathrooms: 1,
      sleeps: 4,
      standoutFeatures: ['Stargazing deck', 'Wood-burning stove', 'Canopy views'],
      vibe: 'romantic',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.result.title).toBeDefined()
    expect(data.cached).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/listing-generator/generate-manual/__tests__/route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/app/api/listing-generator/generate-manual/route.ts
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
  title: z.string().max(50),
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/listing-generator/generate-manual/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/listing-generator/generate-manual/route.ts src/app/api/listing-generator/generate-manual/__tests__/route.test.ts
git commit -m "feat(listing-generator): add manual generation API route"
```

---

### Task 7: API Route — Lead Capture

**Files:**
- Create: `src/app/api/listing-generator/lead/route.ts`
- Test: `src/app/api/listing-generator/lead/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/api/listing-generator/lead/__tests__/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from '../route'

const mockCreate = vi.fn()
const mockFind = vi.fn().mockResolvedValue({ docs: [] })

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    create: mockCreate,
    find: mockFind,
  }),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

function mockRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/listing-generator/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/listing-generator/lead', () => {
  it('returns ok:true for valid email', async () => {
    const req = mockRequest({ email: 'test@example.com' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('returns ok:true even for empty email', async () => {
    const req = mockRequest({ email: '' })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns ok:true for missing email', async () => {
    const req = mockRequest({})
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('never returns error — always ok:true', async () => {
    mockFind.mockRejectedValueOnce(new Error('DB down'))
    const req = mockRequest({ email: 'test@example.com' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/listing-generator/lead/__tests__/route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/app/api/listing-generator/lead/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { email, generationId } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: true })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ ok: true })
    }

    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'host-leads',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ ok: true })
    }

    await payload.create({
      collection: 'host-leads',
      data: {
        email: normalizedEmail,
        listingUrl: '',
        scoreId: null,
        source: 'listing-generator',
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/listing-generator/lead/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/listing-generator/lead/route.ts src/app/api/listing-generator/lead/__tests__/route.test.ts
git commit -m "feat(listing-generator): add lead capture API route"
```

---

### Task 8: Server Page

**Files:**
- Create: `src/app/(app)/listing-generator/page.tsx`

- [ ] **Step 1: Write the server page**

```typescript
// src/app/(app)/listing-generator/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import ListingGeneratorClient from './ListingGeneratorClient'

export const metadata: Metadata = {
  title: 'Free Airbnb Description Generator for Unique Stays',
  description:
    'Generate an AI-crafted listing description for your treehouse, dome, yurt, cabin, or unique stay. Optimized for Airbnb, VRBO, and Wander. Free — no login required.',
  keywords: [
    'airbnb description generator',
    'listing description generator',
    'vrbo listing generator',
    'airbnb title generator',
    'unique stay listing description',
    'treehouse listing description',
    'dome listing description',
  ],
  openGraph: {
    title: 'Free Airbnb Description Generator for Unique Stays',
    description:
      'AI-crafted listing descriptions that capture what makes your unique stay unforgettable. Paste your URL or describe your property.',
    type: 'website',
    url: '/listing-generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Airbnb Description Generator for Unique Stays',
    description:
      'AI-crafted listing descriptions for treehouses, domes, yurts, and unique stays. Free — no login required.',
  },
  alternates: { canonical: '/listing-generator' },
}

export default function ListingGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Listing Description Generator',
            description:
              'AI-powered listing description generator for unique vacation rentals. Free tool for Airbnb, VRBO, and Wander hosts.',
            url: 'https://www.uniquestaysusa.com/listing-generator',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free listing description generation',
            },
          }),
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <ListingGeneratorClient />
      </Suspense>
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-cream">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-terracotta" />
    </div>
  )
}
```

- [ ] **Step 2: Verify no build errors**

Run: `pnpm tsc --noEmit`
Expected: No errors (ListingGeneratorClient doesn't exist yet — will be created next task)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/listing-generator/page.tsx
git commit -m "feat(listing-generator): add server page with SEO metadata"
```

---

### Task 9: Client State Machine + Components

**Files:**
- Create: `src/app/(app)/listing-generator/ListingGeneratorClient.tsx`
- Create: `src/app/(app)/listing-generator/_components/GeneratorHero.tsx`
- Create: `src/app/(app)/listing-generator/_components/ManualForm.tsx`
- Create: `src/app/(app)/listing-generator/_components/LoadingState.tsx`
- Create: `src/app/(app)/listing-generator/_components/ResultsPreview.tsx`
- Create: `src/app/(app)/listing-generator/_components/EmailGate.tsx`
- Create: `src/app/(app)/listing-generator/_components/FullResults.tsx`
- Create: `src/app/(app)/listing-generator/_components/EditorialNote.tsx`
- Create: `src/app/(app)/listing-generator/_components/UniqueScoreCTA.tsx`

This is the largest task. Components follow the exact patterns from Unique Score (same Tailwind classes, same state management, same design tokens). Each component is self-contained.

- [ ] **Step 1: Write ListingGeneratorClient (state machine)**

```typescript
// src/app/(app)/listing-generator/ListingGeneratorClient.tsx
'use client'

import { useState, useCallback } from 'react'
import GeneratorHero from './_components/GeneratorHero'
import LoadingState from './_components/LoadingState'
import ResultsPreview from './_components/ResultsPreview'
import FullResults from './_components/FullResults'
import type { GenerationResponse } from '@/lib/listing-generator/types'

type Phase = 'idle' | 'loading' | 'preview' | 'results' | 'error'

export default function ListingGeneratorClient() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<GenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('')

  const handleUrlSubmit = useCallback(async (url: string) => {
    setPhase('loading')
    setError(null)
    setLoadingMessage('Reading your listing...')

    try {
      const res = await fetch('/api/listing-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data: GenerationResponse & { error?: string } = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'We could not read that listing. Try the manual form instead.')
        setPhase('error')
        return
      }

      setResult(data)
      setPhase('preview')
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
      setPhase('error')
    }
  }, [])

  const handleManualSubmit = useCallback(async (formData: Record<string, unknown>) => {
    setPhase('loading')
    setError(null)
    setLoadingMessage('Your editor is crafting the perfect listing...')

    try {
      const res = await fetch('/api/listing-generator/generate-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data: GenerationResponse & { error?: string } = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Generation failed. Please try again.')
        setPhase('error')
        return
      }

      setResult(data)
      setPhase('preview')
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
      setPhase('error')
    }
  }, [])

  const handleEmailComplete = useCallback(() => {
    setPhase('results')
  }, [])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setResult(null)
    setError(null)
  }, [])

  return (
    <main className="bg-cream text-charcoal">
      {phase === 'idle' && (
        <GeneratorHero onUrlSubmit={handleUrlSubmit} onManualSubmit={handleManualSubmit} />
      )}
      {phase === 'loading' && <LoadingState message={loadingMessage} />}
      {phase === 'preview' && result && (
        <ResultsPreview result={result} onEmailComplete={handleEmailComplete} />
      )}
      {phase === 'results' && result && (
        <FullResults result={result} onReset={handleReset} />
      )}
      {phase === 'error' && <ErrorState error={error} onReset={handleReset} />}
    </main>
  )
}

function ErrorState({ error, onReset }: { error: string | null; onReset: () => void }) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10">
          <svg className="h-6 w-6 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-charcoal">
          Something went wrong
        </h2>
        <p className="mt-3 font-body text-base text-muted-foreground">
          {error || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={onReset}
          className="mt-6 min-h-11 rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light"
        >
          Try Again
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Write GeneratorHero**

```typescript
// src/app/(app)/listing-generator/_components/GeneratorHero.tsx
'use client'

import { useState } from 'react'
import { Compass, PenLine } from 'lucide-react'
import { validateListingUrl } from '@/lib/listing-generator/types'
import ManualForm from './ManualForm'

interface GeneratorHeroProps {
  onUrlSubmit: (url: string) => void
  onManualSubmit: (formData: Record<string, unknown>) => void
}

const PLATFORMS = [
  { name: 'Airbnb', domain: 'airbnb.com' },
  { name: 'VRBO', domain: 'vrbo.com' },
  { name: 'Wander', domain: 'wander.com' },
]

export default function GeneratorHero({ onUrlSubmit, onManualSubmit }: GeneratorHeroProps) {
  const [url, setUrl] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      setLocalError('Please enter a listing URL.')
      return
    }

    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const validation = validateListingUrl(fullUrl)

    if (!validation.valid) {
      setLocalError(validation.error || 'Invalid URL')
      return
    }

    setLocalError(null)
    onUrlSubmit(fullUrl)
  }

  if (showManual) {
    return <ManualForm onSubmit={onManualSubmit} onBack={() => setShowManual(false)} />
  }

  return (
    <section className="grain-overlay relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-[2px] border border-terracotta/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Listing Description Generator
          </div>

          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] text-charcoal sm:text-6xl lg:text-7xl">
            A description that does your stay justice.
          </h1>

          <p className="mt-6 max-w-2xl font-body text-base leading-7 text-muted-foreground sm:text-lg">
            Paste your Airbnb, VRBO, or Wander URL. Our AI reads your listing like a travel editor and rewrites it for maximum bookings — with notes explaining why each change works.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl" noValidate>
            <label htmlFor="listing-url" className="mb-2 block font-body text-sm font-bold text-charcoal">
              Listing URL
            </label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="listing-url"
                name="listing-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setLocalError(null) }}
                placeholder="https://www.airbnb.com/rooms/..."
                aria-invalid={Boolean(localError)}
                aria-describedby={localError ? 'url-error' : undefined}
                className="min-h-12 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-base text-charcoal shadow-[0_1px_0_oklch(0.22_0.01_60_/_0.04)] transition-colors placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                autoFocus
              />
              <button
                type="submit"
                className="min-h-12 rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
              >
                Generate
              </button>
            </div>

            {localError && (
              <p id="url-error" className="mt-3 font-body text-sm font-semibold text-terracotta" role="alert">
                {localError}
              </p>
            )}
          </form>

          <div className="mt-7 flex flex-wrap items-center gap-3 font-body text-sm text-muted-foreground">
            <span className="font-bold text-charcoal">Supported sources</span>
            {PLATFORMS.map((p) => (
              <span key={p.name} className="rounded-[2px] border border-sand bg-warm-white px-3 py-1.5 font-semibold text-charcoal">
                {p.name}
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowManual(true)}
            className="mt-5 font-body text-sm font-semibold text-terracotta underline decoration-terracotta/40 underline-offset-4 transition-colors hover:text-terracotta-light"
          >
            Or describe your stay manually
          </button>
        </div>

        <aside
          className="relative rounded-[3px] border border-sand bg-warm-white p-6 shadow-[10px_18px_50px_oklch(0.22_0.01_60_/_0.10)] lg:rotate-[-1deg]"
          aria-label="What the generator produces"
        >
          <div className="mb-4 flex items-center gap-2">
            <Compass className="h-5 w-5 text-terracotta" aria-hidden="true" />
            <span className="font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
              What you get
            </span>
          </div>
          <ul className="space-y-3 font-body text-sm text-charcoal">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
              A hook-first title that stops the scroll
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
              A 150–250 word description written for your stay type
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
              3 editorial notes explaining why each change works
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-forest" />
              Free — no login, no credit card
            </li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Write ManualForm**

```typescript
// src/app/(app)/listing-generator/_components/ManualForm.tsx
'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { STAY_TYPES, VIBES, GUEST_TYPES, type StayType, type Vibe, type GuestType } from '@/lib/listing-generator/types'

interface ManualFormProps {
  onSubmit: (formData: Record<string, unknown>) => void
  onBack: () => void
}

export default function ManualForm({ onSubmit, onBack }: ManualFormProps) {
  const [stayType, setStayType] = useState<StayType | ''>('')
  const [propertyName, setPropertyName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [sleeps, setSleeps] = useState('')
  const [feature1, setFeature1] = useState('')
  const [feature2, setFeature2] = useState('')
  const [feature3, setFeature3] = useState('')
  const [vibe, setVibe] = useState<Vibe | ''>('')
  const [targetGuest, setTargetGuest] = useState<GuestType | ''>('')
  const [currentDescription, setCurrentDescription] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: string[] = []

    if (!stayType) newErrors.push('Stay type is required')
    if (!propertyName.trim()) newErrors.push('Property name is required')
    if (!city.trim()) newErrors.push('City is required')
    if (!state.trim()) newErrors.push('State is required')
    if (!bedrooms || Number(bedrooms) < 0) newErrors.push('Bedrooms is required')
    if (!bathrooms || Number(bathrooms) < 0) newErrors.push('Bathrooms is required')
    if (!sleeps || Number(sleeps) < 1) newErrors.push('Sleeps is required')
    if (!feature1.trim() || !feature2.trim() || !feature3.trim()) newErrors.push('All 3 standout features are required')
    if (!vibe) newErrors.push('Vibe is required')

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      stayType,
      propertyName: propertyName.trim(),
      city: city.trim(),
      state: state.trim(),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      sleeps: Number(sleeps),
      standoutFeatures: [feature1.trim(), feature2.trim(), feature3.trim()],
      vibe,
      targetGuest: targetGuest || undefined,
      currentDescription: currentDescription.trim() || undefined,
    })
  }

  return (
    <section className="grain-overlay relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={onBack}
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-[3px] px-2 py-2 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to URL input
        </button>

        <h1 className="font-display text-4xl font-semibold text-charcoal sm:text-5xl">
          Describe your stay
        </h1>
        <p className="mt-3 font-body text-base text-muted-foreground">
          Fill in the details and our AI will craft a listing description that does your property justice.
        </p>

        {errors.length > 0 && (
          <div className="mt-6 rounded-[3px] border border-terracotta/25 bg-terracotta/5 p-4" role="alert">
            <ul className="space-y-1 font-body text-sm text-terracotta">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Stay type */}
          <div>
            <label htmlFor="stayType" className="mb-2 block font-body text-sm font-bold text-charcoal">
              Stay type *
            </label>
            <select
              id="stayType"
              value={stayType}
              onChange={(e) => setStayType(e.target.value as StayType)}
              className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              <option value="">Select stay type...</option>
              {STAY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>)}
            </select>
          </div>

          {/* Property name */}
          <div>
            <label htmlFor="propertyName" className="mb-2 block font-body text-sm font-bold text-charcoal">
              Property name or location *
            </label>
            <input
              id="propertyName"
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g. Catskills Pine Treehouse"
              className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal transition-colors placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
          </div>

          {/* City + State */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-2 block font-body text-sm font-bold text-charcoal">City *</label>
              <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Woodstock" className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta" />
            </div>
            <div>
              <label htmlFor="state" className="mb-2 block font-body text-sm font-bold text-charcoal">State *</label>
              <input id="state" type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="New York" className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta" />
            </div>
          </div>

          {/* Beds / Baths / Sleeps */}
          <div className="grid gap-4 grid-cols-3">
            <div>
              <label htmlFor="bedrooms" className="mb-2 block font-body text-sm font-bold text-charcoal">Bedrooms *</label>
              <input id="bedrooms" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta" />
            </div>
            <div>
              <label htmlFor="bathrooms" className="mb-2 block font-body text-sm font-bold text-charcoal">Bathrooms *</label>
              <input id="bathrooms" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta" />
            </div>
            <div>
              <label htmlFor="sleeps" className="mb-2 block font-body text-sm font-bold text-charcoal">Sleeps *</label>
              <input id="sleeps" type="number" min="1" value={sleeps} onChange={(e) => setSleeps(e.target.value)} className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta" />
            </div>
          </div>

          {/* Standout features */}
          <div>
            <span className="mb-2 block font-body text-sm font-bold text-charcoal">Top 3 standout features *</span>
            <div className="space-y-3">
              {[feature1, feature2, feature3].map((val, i) => {
                const setters = [setFeature1, setFeature2, setFeature3]
                return (
                  <input
                    key={i}
                    type="text"
                    value={val}
                    onChange={(e) => setters[i](e.target.value)}
                    placeholder={`Feature ${i + 1} (e.g. ${['Stargazing deck', 'Wood-burning stove', 'Hot tub'][i]})`}
                    className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  />
                )
              })}
            </div>
          </div>

          {/* Vibe */}
          <div>
            <label htmlFor="vibe" className="mb-2 block font-body text-sm font-bold text-charcoal">Overall vibe *</label>
            <select id="vibe" value={vibe} onChange={(e) => setVibe(e.target.value as Vibe)} className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta">
              <option value="">Select vibe...</option>
              {VIBES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
            </select>
          </div>

          {/* Target guest */}
          <div>
            <label htmlFor="targetGuest" className="mb-2 block font-body text-sm font-bold text-charcoal">Target guest</label>
            <select id="targetGuest" value={targetGuest} onChange={(e) => setTargetGuest(e.target.value as GuestType)} className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta">
              <option value="">Select target guest...</option>
              {GUEST_TYPES.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}</option>)}
            </select>
          </div>

          {/* Current description */}
          <div>
            <label htmlFor="currentDescription" className="mb-2 block font-body text-sm font-bold text-charcoal">
              Current description (optional)
            </label>
            <textarea
              id="currentDescription"
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              rows={4}
              placeholder="Paste your existing listing description if you have one..."
              className="w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
          </div>

          <button
            type="submit"
            className="min-h-12 w-full rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
          >
            Generate Description
          </button>
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Write LoadingState**

```typescript
// src/app/(app)/listing-generator/_components/LoadingState.tsx
'use client'

import { useState, useEffect } from 'react'

interface LoadingStateProps {
  message: string
}

const STAGES = [
  'Reading your listing...',
  'Analyzing stay type...',
  'Crafting the hook...',
  'Writing the description...',
  'Polishing editorial notes...',
]

export default function LoadingState({ message }: LoadingStateProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-sand border-t-terracotta" />
        <p className="font-display text-2xl font-semibold text-charcoal">
          {STAGES[stage]}
        </p>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          This takes about 15 seconds.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Write ResultsPreview (blurred description)**

```typescript
// src/app/(app)/listing-generator/_components/ResultsPreview.tsx
'use client'

import { Lock } from 'lucide-react'
import EmailGate from './EmailGate'
import type { GenerationResponse } from '@/lib/listing-generator/types'

interface ResultsPreviewProps {
  result: GenerationResponse
  onEmailComplete: () => void
}

export default function ResultsPreview({ result, onEmailComplete }: ResultsPreviewProps) {
  return (
    <section className="grain-overlay px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-[2px] border border-forest/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-forest">
          Generated Description
        </div>

        {/* Title — fully visible */}
        <h2 className="font-display text-4xl font-semibold text-charcoal sm:text-5xl">
          {result.result.title}
        </h2>

        {/* Description — blurred */}
        <div className="relative mt-8">
          <div className="rounded-[3px] border border-sand bg-warm-white p-6">
            <div className="relative">
              <div
                className="font-body text-base leading-7 text-charcoal blur-md select-none"
                aria-hidden="true"
              >
                {result.result.description}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-warm-white/40 backdrop-blur-[2px]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10">
                  <Lock className="h-5 w-5 text-terracotta" aria-hidden="true" />
                </div>
                <p className="font-display text-lg font-semibold text-charcoal">
                  Enter your email to unlock
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">
                  See the full description + editorial notes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Editorial note previews */}
        <div className="mt-6 space-y-3">
          {result.result.editorialNotes.map((note, i) => (
            <div key={i} className="rounded-[3px] border border-sand/50 bg-warm-white/60 p-4">
              <span className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
                {note.category === 'hook' ? 'Hook' : note.category === 'story' ? 'Story' : 'Conversion'}
              </span>
              <div className="mt-2 h-3 w-3/4 rounded bg-sand/60" />
            </div>
          ))}
        </div>

        {/* Email gate */}
        <div className="mt-8">
          <EmailGate onComplete={onEmailComplete} />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Write EmailGate**

```typescript
// src/app/(app)/listing-generator/_components/EmailGate.tsx
'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

interface EmailGateProps {
  onComplete: () => void
}

export default function EmailGate({ onComplete }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      onComplete()
      return
    }

    setLoading(true)

    try {
      await fetch('/api/listing-generator/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      onComplete()
    } catch {
      setError('Could not save email. The description is still yours.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-[3px] border border-forest/25 bg-forest/5 p-5" aria-labelledby="email-gate-title">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[2px] bg-forest text-warm-white">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </div>
          <h3 id="email-gate-title" className="font-display text-2xl font-semibold text-charcoal">
            Unlock your description.
          </h3>
          <p className="mt-2 font-body text-sm leading-6 text-muted-foreground">
            Send yourself the full description and editorial notes. No booking spam.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]" noValidate>
          <div>
            <label htmlFor="gate-email" className="sr-only">Email address</label>
            <input
              id="gate-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="you@example.com"
              aria-describedby={error ? 'gate-email-error' : undefined}
              className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal transition-colors placeholder:text-muted-foreground focus-visible:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            />
            {error && (
              <p id="gate-email-error" className="mt-2 font-body text-xs font-semibold text-terracotta" role="alert">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-11 rounded-[3px] bg-forest px-5 py-3 font-body text-xs font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-forest-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? 'Saving' : 'Unlock'}
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-11 rounded-[3px] px-3 py-3 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            Not now
          </button>
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Write FullResults**

```typescript
// src/app/(app)/listing-generator/_components/FullResults.tsx
'use client'

import { useState } from 'react'
import { ArrowLeft, Check, ClipboardList, Copy } from 'lucide-react'
import EditorialNote from './EditorialNote'
import UniqueScoreCTA from './UniqueScoreCTA'
import type { GenerationResponse } from '@/lib/listing-generator/types'

interface FullResultsProps {
  result: GenerationResponse
  onReset: () => void
}

export default function FullResults({ result, onReset }: FullResultsProps) {
  const [copied, setCopied] = useState<'title' | 'description' | 'all' | null>(null)

  const copyToClipboard = async (text: string, type: 'title' | 'description' | 'all') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const allText = `${result.result.title}\n\n${result.result.description}`

  return (
    <section className="grain-overlay px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={onReset}
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-[3px] px-2 py-2 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Generate another
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-[2px] border border-terracotta/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Your Generated Listing
        </div>

        {/* Title */}
        <div className="rounded-[3px] border border-sand bg-warm-white p-6 shadow-[0_1px_0_oklch(0.22_0.01_60_/_0.04)]">
          <p className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
            Title
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
            {result.result.title}
          </h2>
          <button
            onClick={() => copyToClipboard(result.result.title, 'title')}
            className="mt-3 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-terracotta transition-colors hover:text-terracotta-light"
            aria-label="Copy title"
          >
            {copied === 'title' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === 'title' ? 'Copied' : 'Copy title'}
          </button>
        </div>

        {/* Description */}
        <div className="mt-5 rounded-[3px] border border-sand bg-warm-white p-6">
          <p className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
            Description
          </p>
          <div className="mt-3 font-body text-base leading-7 text-charcoal whitespace-pre-wrap">
            {result.result.description}
          </div>
          <button
            onClick={() => copyToClipboard(result.result.description, 'description')}
            className="mt-4 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-terracotta transition-colors hover:text-terracotta-light"
            aria-label="Copy description"
          >
            {copied === 'description' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === 'description' ? 'Copied' : 'Copy description'}
          </button>
        </div>

        {/* Copy all */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => copyToClipboard(allText, 'all')}
            className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-terracotta bg-warm-white px-5 py-3 font-body text-xs font-extrabold uppercase tracking-[0.08em] text-terracotta transition-colors hover:bg-terracotta hover:text-warm-white"
          >
            {copied === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === 'all' ? 'All Copied' : 'Copy All'}
          </button>
        </div>

        {/* Editorial notes */}
        <div className="mt-10">
          <p className="font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
            Editor&apos;s notes
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-charcoal">
            Why this description works
          </h3>
          <div className="mt-5 space-y-4">
            {result.result.editorialNotes.map((note, i) => (
              <EditorialNote key={i} note={note} />
            ))}
          </div>
        </div>

        {/* Stay type affinity */}
        {result.result.stayTypeAffinity && (
          <div className="mt-8 rounded-[2px] border border-forest/25 bg-forest/5 p-4">
            <p className="font-body text-sm text-charcoal">
              <span className="font-extrabold text-forest">Stay insight: </span>
              {result.result.stayTypeAffinity}
            </p>
          </div>
        )}

        <UniqueScoreCTA />
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Write EditorialNote**

```typescript
// src/app/(app)/listing-generator/_components/EditorialNote.tsx
'use client'

import { Lightbulb } from 'lucide-react'
import type { EditorialNote as EditorialNoteType } from '@/lib/listing-generator/types'

interface EditorialNoteProps {
  note: EditorialNoteType
}

const CATEGORY_LABELS: Record<EditorialNoteType['category'], string> = {
  hook: 'Hook',
  story: 'Story',
  conversion: 'Conversion',
}

export default function EditorialNote({ note }: EditorialNoteProps) {
  return (
    <article className="rounded-[3px] border border-terracotta/20 bg-warm-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[2px] bg-terracotta/10">
          <Lightbulb className="h-4 w-4 text-terracotta" aria-hidden="true" />
        </div>
        <div>
          <span className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
            {CATEGORY_LABELS[note.category]}
          </span>
          <p className="mt-1 font-body text-sm leading-6 text-charcoal">
            {note.note}
          </p>
          {note.example && (
            <p className="mt-2 rounded-[2px] bg-cream-dark p-3 font-body text-xs italic text-muted-foreground">
              {note.example}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 9: Write UniqueScoreCTA**

```typescript
// src/app/(app)/listing-generator/_components/UniqueScoreCTA.tsx
'use client'

import { ArrowRight, BarChart3 } from 'lucide-react'

export default function UniqueScoreCTA() {
  return (
    <div className="mt-10 rounded-[3px] border border-forest/25 bg-forest/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[2px] bg-forest text-warm-white">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-charcoal">
            Grade your listing
          </h3>
          <p className="mt-1 font-body text-sm leading-6 text-muted-foreground">
            Now that you have a great description, see how your full listing scores across visual story, written story, and guest confidence.
          </p>
          <a
            href="/unique-score"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-forest px-5 py-3 font-body text-xs font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-forest-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            Get Your Unique Score
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Verify the build compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add src/app/\(app\)/listing-generator/
git commit -m "feat(listing-generator): add client state machine and all UI components"
```

---

### Task 10: Run All Tests

- [ ] **Step 1: Run the full test suite**

Run: `pnpm vitest run`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -A && git commit -m "fix(listing-generator): resolve test/type issues"
```

---

### Task 11: Smoke Test with Dev Server

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Verify page loads**

Open: `http://localhost:3000/listing-generator`
Expected: Hero section renders with URL input, platform badges, manual form link

- [ ] **Step 3: Test URL flow**

Paste an Airbnb URL → click Generate → loading animation → preview with blurred description → email gate → full results

- [ ] **Step 4: Test manual flow**

Click "Or describe your stay manually" → fill form → submit → loading → preview → results

- [ ] **Step 5: Verify copy buttons work**

Click "Copy title", "Copy description", "Copy All" → verify clipboard content

- [ ] **Step 6: Verify SEO metadata**

View page source → check `<title>`, `<meta description>`, JSON-LD script tag
