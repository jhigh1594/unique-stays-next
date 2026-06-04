# Listing Description Generator — Design Spec

**Date:** 2026-06-03
**Status:** Approved
**Tool ID:** T7 (from free-tool-strategy.md)
**Route:** `/listing-generator`

---

## Overview

Free SEO tool for unique stay hosts. Paste a listing URL or fill in details manually → AI generates an optimized listing title + description with editorial notes explaining why the changes improve bookings. Completely free — pure SEO + email capture play targeting 15-25K/mo search volume for "airbnb description generator" keywords.

## Target Keywords

- "airbnb description generator"
- "listing description generator"
- "vrbo listing generator"
- "airbnb title generator"
- "unique stay listing description"
- "treehouse listing description"
- "dome listing description"

## UX Flow

### URL Path (Primary)

```
Hero + URL Input → Scrape Animation → Results Preview → Email Gate → Full Results
```

1. **Hero:** URL input with platform detection (Airbnb/VRBO/Wander logos). "Or describe your stay manually" toggle link.
2. **Scrape:** Reuse Unique Score scraper (`src/lib/unique-score/scraper.ts`). Parse raw scrape into unified `ListingData` interface.
3. **Generate:** Single Gemini Flash call with Editor-in-Chief prompt.
4. **Preview:** Generated title visible, description blurred behind glass-morphism. Terracotta lock icon + "Enter email to unlock."
5. **Email gate:** Optional email capture with "Not now" skip. Same pattern as Unique Score.
6. **Full results:** Title, full description, 3 editorial notes, copy buttons, share button, Unique Score CTA.

### Manual Path (Fallback)

Toggle on hero → detailed form with 8-10 fields → same generation → same results flow.

**Manual form fields:**
| Field | Type | Required |
|-------|------|----------|
| Stay type | Dropdown (treehouse/dome/yurt/A-frame/cabin/lighthouse/houseboat/tiny-home/glamping-tent/other) | Yes |
| Property name or location | Text | Yes |
| City + State | Text | Yes |
| Bedrooms | Number | Yes |
| Bathrooms | Number | Yes |
| Sleeps | Number | Yes |
| Top 3 standout features | 3 text inputs | Yes |
| Overall vibe | Dropdown (romantic/adventurous/rustic/luxury/family-friendly/off-grid) | Yes |
| Target guest | Dropdown (couples/families/solo/groups/digital-nomads) | No |
| Current description | Textarea | No |

### State Machine

```
idle → loading → preview → gated → results
                ↘ error (with retry)
```

## Platforms

| Platform | URL Scraping | Notes |
|----------|-------------|-------|
| Airbnb | Yes | Reuse Unique Score scraper |
| VRBO | Yes | May need new scraper logic |
| Wander | Yes | Reuse Unique Score scraper |
| Direct/Other | No | Manual form only |

**Scraping failure fallback:** If URL scraping fails (unsupported platform, blocked, malformed page), redirect user to manual form with a friendly message: "We couldn't read that listing. Describe your stay below and we'll generate from scratch."

## AI Generation — Editor-in-Chief Model

Single Gemini Flash call. Input: structured listing data (from scraper or manual form). Output: JSON.

### Output Schema

```typescript
interface GenerationResult {
  title: string              // Max 50 chars, hook-first
  description: string        // 150-250 words, structured paragraphs
  editorialNotes: EditorialNote[]
  stayTypeAffinity: string   // What makes this stay type special
}

interface EditorialNote {
  category: 'hook' | 'story' | 'conversion'
  note: string               // 1-2 sentences explaining the change
  example?: string           // Before/after snippet if applicable
}
```

### Editorial Note Categories

- **Hook:** First 50 words optimization — why the opening grabs attention
- **Story:** Narrative structure — how the description tells a story vs listing facts
- **Conversion:** Booking psychology — urgency triggers, social proof framing, FOMO elements

### Prompt Engineering

System prompt will be generated via the prompt-engineer skill during implementation. High-level structure:
1. Role: travel editor at a premium unique stays publication
2. Context: stay-type-specific knowledge (treehouse guests care about height/canopy; dome guests care about stargazing/geometry)
3. Input: structured `ListingData` fields
4. Output: enforced JSON matching `GenerationResult` schema

## Component Architecture & File Structure

```
src/app/(app)/listing-generator/
├── page.tsx                          # Server: SEO metadata + JSON-LD
├── ListingGeneratorClient.tsx        # Client: state machine + layout
└── _components/
    ├── GeneratorHero.tsx             # Hero section with URL input + manual toggle
    ├── ManualForm.tsx                # Detailed manual entry form
    ├── ScrapeAnimation.tsx           # Loading state during URL scraping
    ├── GenerateAnimation.tsx         # Loading state during AI generation
    ├── ResultsPreview.tsx            # Title visible, description blurred
    ├── EmailGate.tsx                 # Email capture to unlock full results
    ├── FullResults.tsx               # Complete results with copy/share
    ├── EditorialNote.tsx             # Single editorial note card
    └── UniqueScoreCTA.tsx            # Cross-sell to /unique-score

src/app/api/listing-generator/
├── generate/
│   └── route.ts                      # POST: scrape + generate (URL path)
├── generate-manual/
│   └── route.ts                      # POST: generate from form data (manual path)
└── lead/
    └── route.ts                      # POST: email capture

src/lib/listing-generator/
├── types.ts                          # TypeScript interfaces
├── prompt.ts                         # System prompt (via prompt-engineer skill)
├── cache.ts                          # URL-based result caching (24h TTL)
└── index.ts                          # Public exports
```

Two API routes (URL vs manual) because URL path needs scraper + cache layer, manual doesn't. Both routes share the same Gemini generation function from `src/lib/listing-generator/`.

No new Payload collections — leads go to existing `host-leads` collection.

## Design & Visual Treatment

Matches `.impeccable.md` design system:

- **Typography:** Fraunces for headlines, Jakarta Sans for body/UI, Newsreader for generated description text
- **Colors:** Cream backgrounds, terracotta CTAs, forest green secondary, warm-white cards
- **Corners:** `rounded-[3px]` throughout (subtle, not fully rounded)
- **Shadows:** Warm charcoal shadows `shadow-[10px_18px_50px_oklch(0.22_0.01_60_/_0.10)]`
- **Buttons:** `min-h-11` height, terracotta primary, forest secondary

### Hero Section
- Fraunces headline: "Listing Description Generator"
- Jakarta Sans subtitle: "AI-crafted descriptions that capture what makes your unique stay unforgettable"
- URL input with platform detection icons
- "Or describe your stay manually" toggle link

### Loading Animation
- Typewriter effect: "Your editor is crafting the perfect listing..." with animated ellipsis
- Progress stages: "Scraping listing..." → "Analyzing stay type..." → "Writing description..."

### Results Preview (Blurred)
- Glass-morphism blur on description (`backdrop-blur-md`)
- Title visible and sharp above blur
- Terracotta lock icon + "Enter email to unlock your description"

### Full Results
- Title in Fraunces, description in Newsreader
- Editorial notes in terracotta-bordered cards with pen icon
- Copy buttons (title, description, all)
- Share button (native share API → clipboard fallback)
- "Grade your listing with Unique Score" CTA in forest green

### Email Gate
- Same pattern as Unique Score — optional with "Not now" skip
- Forest/cream styling, non-aggressive

## Caching

- Cache generated results keyed by listing URL hash
- 24-hour TTL — same URL returns cached result
- Same pattern as Unique Score cache (`src/lib/unique-score/cache.ts`)

## Rate Limiting

- 5 generations/hour per IP
- Same in-memory pattern as existing tools
- 429 response with friendly message on limit

## Testing Strategy (TDD)

### Unit Tests (Vitest)
- Schema validation for `GenerationResult`
- Cache module: hit/miss/expiry
- Manual form field validation (required fields, URL format)
- Platform detection from URL string

### Component Tests (React Testing Library)
- `GeneratorHero`: renders URL input, toggles manual mode
- `ManualForm`: validates required fields, submits data
- `EmailGate`: captures email, allows skip
- `FullResults`: renders title, description, editorial notes, copy buttons
- State transitions: idle → loading → preview → gated → results

### API Integration Tests (Vitest + mocked Gemini)
- `POST /api/listing-generator/generate`: rate limiting, validation, error handling
- `POST /api/listing-generator/generate-manual`: form data validation
- `POST /api/listing-generator/lead`: email capture, duplicate handling
- Mocked Gemini responses for deterministic tests

### TDD Workflow
1. Write types → write schema validation tests → make pass
2. Write cache module → write cache tests → make pass
3. Write API routes with mocked Gemini → write API tests → make pass
4. Write components → write component tests → make pass
5. Wire full flow → integration test → make pass

### E2E
Manual QA pass before deploy — not automated in this phase.

## Monetization

Completely free. No paid tier. Pure SEO + email capture.

Cross-sell CTA on results page: "Grade your listing with Unique Score" links to `/unique-score`.

## Dependencies

- Gemini Flash via Vercel AI SDK (already configured)
- Unique Score scraper (`src/lib/unique-score/scraper.ts`) — imported, not copied
- Existing `host-leads` Payload collection for email capture
- Framer Motion for animations (already installed)
