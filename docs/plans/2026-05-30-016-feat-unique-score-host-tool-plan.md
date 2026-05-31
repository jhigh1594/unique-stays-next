---
title: "feat: Unique Score — Host-Focused Multimodal Listing Grader"
type: feat
status: active
date: 2026-05-30
origin: docs/brainstorms/unique-score-requirements.md
---

# Unique Score — Host-Focused Multimodal Listing Grader

## Summary

Build a free tool at `/unique-score` where unique stay hosts paste an Airbnb, VRBO, or Wander listing URL and receive an instant "Unique Score" — a multimodal AI evaluation of their listing's quality, feel, and guest experience using Gemini Flash via the Vercel AI SDK. Free tier reveals Visual Story and Standout Factor scores with observations. $19 one-time Stripe payment unlocks all 5 dimensions with specific improvement recommendations. Results are shareable via OG image cards. Host emails captured as leads.

---

## Problem Frame

Unique stay hosts have no way to benchmark their listing quality. The closest tool (Beyond Pricing's Listing Lens) is discontinued. Generic STR tools focus on property management, not listing quality. Nobody uses multimodal AI to evaluate listings the way a guest actually experiences them — looking at photos, reading copy, assessing whether the listing creates desire or indifference. This tool fills that gap and captures host emails as a supply-side acquisition channel.

---

## Requirements

- R1. Accept listing URLs from Airbnb, VRBO, and Wander. Validate URL format before processing. Reject invalid or unsupported URLs with a clear error message. (origin R1)
- R2. Scrape listing page to extract: all photo URLs, listing title, description, amenity list, review snippets (if available), host-visible metadata (rating, review count, property type). Graceful degradation when reviews unavailable. (origin R2)
- R3. Scrape timeout of 30 seconds. Total turnaround from URL paste to score display under 60 seconds. Show loading state with progress indication. (origin R3)
- R4. Feed all extracted data to Gemini Flash via `@ai-sdk/google` in a single structured prompt. Model returns structured JSON with scores and observations for all 5 dimensions simultaneously. (origin R4)
- R5. Five scoring dimensions with specified weights: Visual Story (25%), Standout Factor (20%), Written Story (20%), Guest Confidence (20%), Experience Depth (15%). Each dimension: 0-100 score, 2-3 observations, 1 concrete improvement suggestion. (origin R5)
- R6. Free tier reveals Visual Story score, Standout Factor score, observations and suggestions for both. Overall score blurred. Remaining 3 dimensions shown as locked cards. (origin R6)
- R7. Email capture positioned between free results and paid upsell. Labeled "Send me my free scores." Optional, not required. (origin R7)
- R8. $19 one-time Stripe payment unlocks all 5 dimension scores with full observations and recommendations, overall score, benchmarking context, and email delivery. (origin R8)
- R9. "Share My Score" generates OG image card with overall score badge and free dimension scores. Share link goes to results page. Results shareable via URL parameters but not publicly indexable. (origin R9)
- R10. Tool landing page (`/unique-score`) is indexable by Google. Targets keywords: "airbnb listing grader," "unique stay score," "listing quality checker." (origin R10)

**Origin actors:** A1 (Host — unique stay host wanting to improve listing), A2 (Traveler — indirect beneficiary)
**Origin flows:** F1 (Free Score Flow), F2 (Paid Report Flow), F3 (Share Flow)
**Origin acceptance examples:** AE1 (valid Airbnb URL scrapes within 30s), AE2 (unsupported URL shows clear error), AE3 (no reviews adjusts Guest Confidence), AE4 (free tier shows 2 dimensions, overall blurred, email optional), AE5 (paid report shows all 5 + email delivery)

---

## Scope Boundaries

### Deferred for later

- Listing rewrite generation (AI-generated copy alternatives)
- Photo editing or enhancement suggestions
- Ongoing monitoring or scheduled re-scoring
- Host dashboard or portal

### Outside this product's identity

- Pricing comparison / competitive pricing analysis
- Booking widget or affiliate link on the score page
- Mobile app
- Direct booking site support (unstructured page formats)

### Deferred to Follow-Up Work

- Automated email follow-up sequence for host leads (separate from this build)
- A/B testing on free vs. paid dimension selection (needs traffic data first)

---

## Context & Research

### Relevant Code and Patterns

- `src/lib/llm.ts` — existing LLM module with NVIDIA NIM → OpenRouter failover via Vercel AI SDK (`ai` + `@ai-sdk/openai`). New Gemini integration should follow the same pattern shape (lazy singleton, structured output) but as a separate module since it uses a different provider and purpose (multimodal analysis vs. text generation).
- `src/lib/posthog-server.ts` — server-side PostHog client pattern for event tracking.
- `src/lib/posthog-lazy.ts` — client-side PostHog lazy init pattern.
- `scripts/lib/scraper.ts` — existing scraping module using Firecrawl with fetch fallback. Pattern: `ScrapeResult { success, data?, error? }` with graceful degradation.
- `scripts/enrich-prices-browser.js` — Browserless integration pattern: POST to `https://chrome.browserless.io/content?token=...` with `{ url }` body, returns full rendered HTML.
- `src/app/api/vacation-quiz/route.ts` — API route pattern: validate input, process, return JSON. Uses `maxDuration = 30` for Vercel serverless.
- `src/app/api/vacation-quiz/lead/route.ts` — lead capture pattern: IP rate limiting, email normalization, Payload create, Beehiiv subscribe in parallel.
- `src/app/(app)/vacation-quiz/page.tsx` — page pattern: server component with metadata, client component wrapper.
- `src/app/(app)/vacation-quiz/VacationQuizClient.tsx` — client state management pattern: loading, error, results, URL params for sharing.
- `src/components/VacationQuiz.tsx` — step-by-step UI with framer-motion animations, emoji options, Tailwind styling.
- `src/components/QuizResults.tsx` — results display component pattern.
- `src/collections/QuizLeads.ts` — Payload collection for lead storage with IP rate limiting.
- `src/app/(app)/layout.tsx` — fonts: Fraunces (display), Plus Jakarta Sans (body), Caveat (hand). oklch() colors in globals.css.
- `next.config.ts` — remote image patterns already include `**.muscache.com` (Airbnb), `**.vrboassets.com` (VRBO), `**.wander.com` (Wander).

### Institutional Learnings

- Airbnb prices render client-side via React hydration — not available in static HTML. However, title, description, photos, rating, review count, location, and amenities ARE in server-rendered HTML.
- Browserless free tier: 1 concurrent session, 1K req/mo. Must be budgeted carefully.
- Payload auth header format: `Authorization: users API-Key <key>` — uses `useAPIKey: true` in Users collection.
- Vercel build uses Turbopack (Next.js 16.2.6) — strict about client/server module boundaries.

### External References

- Vercel AI SDK Google provider: `@ai-sdk/google` — supports `generateText()` and `generateObject()` with Gemini models including Flash.
- Stripe Checkout: server-side session creation, client-side redirect. No need for Stripe Elements — one-time payment is simplest with Checkout.
- Browserless `/content` endpoint: returns fully rendered HTML after JS execution. 30s timeout.

---

## Key Technical Decisions

- **Vercel AI SDK with `@ai-sdk/google` for Gemini Flash:** The codebase already uses `ai` + `@ai-sdk/openai`. Adding `@ai-sdk/google` keeps everything in the same SDK pattern — `generateObject()` for structured output, consistent error handling, same streaming interface. No standalone Google SDK needed. (Jon confirmed.)
- **Local scraping module over Firecrawl:** The codebase has `scripts/lib/scraper.ts` using Firecrawl, but Firecrawl costs credits and we already have Browserless (free tier). Build a lean `src/lib/unique-score/scraper.ts` that uses Browserless `/content` for JS-rendered pages with a plain-fetch fallback. Three platform-specific URL parsers (Airbnb, VRBO, Wander) share a common extraction interface.
- **Result caching in Payload:** Store completed analyses in a `score-reports` Payload collection keyed by listing URL hash. Cache for 24 hours — saves Gemini costs and speeds up repeat visits and share links. Cache bust on explicit re-analysis request.
- **Stripe Checkout for payments:** Simplest integration for one-time $19 payment. Server creates Checkout session → client redirects → webhook verifies payment → report unlocked. No need for Stripe Elements or customer portal.
- **OG image generation via `@vercel/og`:** Dynamic OG images using Svelte-like JSX templates. Follows the existing Vercel deployment. One API route generates the card from result data.
- **Shared analysis prompt, tiered display:** Gemini Flash analyzes all 5 dimensions in one call regardless of free/paid tier. The API response includes all scores. The client-side tier gating controls what's displayed, not what's computed. This avoids re-running the model for paid upgrades.

---

## Open Questions

### Resolved During Planning

- **Which multimodal model?** Gemini Flash via Vercel AI SDK. (Jon confirmed.)
- **Stripe setup?** Jon will provide `STRIPE_SECRET_KEY`. Setup is included in U1. (Jon confirmed.)
- **Caching strategy?** 24h cache per listing URL via Payload collection. Re-analysis available on demand.
- **Which dimensions free vs paid?** Visual Story + Standout Factor free; Written Story, Guest Confidence, Experience Depth paid. (Brainstorm confirmed.)

### Deferred to Implementation

- **Exact Gemini Flash prompt engineering:** The structured prompt that produces consistent, calibrated scores needs iteration against real listings. Test with 5-10 known-good and known-bad listings during implementation.
- **Exact DOM selectors for each platform:** Airbnb/VRBO/Wander HTML structure varies. Selectors need discovery during scraping module implementation. May need periodic maintenance as platforms update.
- **Stripe webhook endpoint URL:** Depends on production domain and Vercel deployment config.

---

## Output Structure

```
src/
  app/
    (app)/
      unique-score/
        page.tsx                          # Server component with metadata (SEO)
        UniqueScoreClient.tsx             # Client component: URL input, loading, results
        _components/
          ScoreHero.tsx                   # Landing hero with URL input
          ScoreResults.tsx                # Results display with free/locked dimensions
          DimensionCard.tsx               # Individual dimension score card
          LockedDimensionCard.tsx         # Locked dimension placeholder
          EmailCapture.tsx                # Optional email input
          PaymentCTA.tsx                  # $19 unlock CTA
          ShareButton.tsx                 # OG card share trigger
    api/
      unique-score/
        analyze/route.ts                  # POST: scrape + Gemini analysis
        report/route.ts                   # POST: Stripe checkout session
        webhook/stripe/route.ts           # POST: Stripe webhook handler
        og-image/route.ts                 # GET: dynamic OG image generation
  lib/
    unique-score/
      scraper.ts                         # Browserless + fetch scraping with platform parsers
      analyzer.ts                        # Gemini Flash multimodal analysis via AI SDK
      types.ts                           # ScoreResult, DimensionScore, AnalysisRequest types
      prompt.ts                          # Structured prompt template for Gemini
      cache.ts                           # Payload-based result caching (24h TTL)
  collections/
    ScoreReports.ts                      # Payload collection: cached analyses + payment state
    HostLeads.ts                         # Payload collection: host emails (free + paid)
```

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
┌──────────────┐     POST /api/unique-score/analyze     ┌─────────────────┐
│  Host Client │ ──────────────────────────────────────► │  Analyze Route  │
│  (React)     │                                         │                 │
│              │ ◄────────────────────────────────────── │  1. Validate URL│
│              │     JSON: { scoreId, dimensions, ...}   │  2. Check cache │
└──────┬───────┘                                         │  3. Scrape HTML  │
       │                                                 │  4. Extract data │
       │ Share link                                      │  5. Call Gemini  │
       │ /unique-score?r=<scoreId>                       │  6. Store result │
       │                                                 └─────────────────┘
       │
       │                                         ┌─────────────────┐
       │ Email (optional) ──────────────────────►│  HostLeads      │
       │                                         │  (Payload)      │
       │                                         └─────────────────┘
       │
       │ POST /api/unique-score/report           ┌─────────────────┐
       │ ─────────────────────────────────────►  │  Report Route   │
       │                                         │                 │
       │ ◄──── Stripe Checkout URL ───────────── │  Create session │
       │                                         └────────┬────────┘
       │                                                  │
       │                                        ┌─────────▼────────┐
       │ Stripe redirect back to results page    │  Stripe Webhook  │
       │ with ?session_id=                       │  Marks report    │
       │                                         │  as paid in DB   │
       │                                         └──────────────────┘
```

**Data flow for analysis:**
1. Client validates URL format (Airbnb/VRBO/Wander regex)
2. Server checks `score-reports` cache by URL hash → if hit and < 24h old, return cached result
3. If miss: Browserless `/content` fetches fully rendered HTML (30s timeout)
4. Platform-specific parser extracts: title, description, photo URLs (up to 20), amenities, rating, review count, review snippets
5. All extracted data + photos passed to `generateObject()` with structured Gemini Flash prompt
6. Result stored in `score-reports` collection with URL hash, all 5 dimension scores, and timestamp
7. Client receives full result, displays tiered view (2 free + 3 locked)

**Payment flow:**
1. Host clicks "Unlock Full Report — $19"
2. Server creates Stripe Checkout session with `scoreId` as metadata
3. Host completes payment on Stripe
4. Webhook updates `score-reports` record to `paid: true`
5. Results page checks payment status and unlocks all dimensions

---

## Implementation Units

### U1. Project Setup — Dependencies, Env Vars, Payload Collections

**Goal:** Install required packages, configure environment variables, create Payload collections for score reports and host leads.

**Requirements:** R8 (Stripe), R4 (Gemini Flash), R6 (email capture infrastructure)

**Dependencies:** None

**Files:**
- Create: `src/collections/ScoreReports.ts`
- Create: `src/collections/HostLeads.ts`
- Modify: `src/payload.config.ts` (register new collections)
- Modify: `package.json` (add `@ai-sdk/google`, `stripe`, `@stripe/stripe-js`, `@vercel/og`)

**Approach:**
- Install `@ai-sdk/google` for Gemini Flash, `stripe` + `@stripe/stripe-js` for payments, `@vercel/og` for OG image generation
- Create `ScoreReports` collection: fields for urlHash (unique index), listingUrl, platform, all 5 dimension scores (JSON), overall score, paid (boolean), email, createdAt. TTL via application logic (24h cache check).
- Create `HostLeads` collection: email, listingUrl, scoreId, source (free|paid), createdAt. Reuse `QuizLeads.ts` pattern with IP rate limiting.
- Register both in `payload.config.ts`
- Jon provides `GOOGLE_GENERATIVE_AI_API_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_PRICE_ID` as env vars

**Patterns to follow:**
- `src/collections/QuizLeads.ts` — field structure, access control, admin columns
- `src/payload.config.ts` — collection registration

**Test scenarios:**
- Happy path: both collections registered and queryable via Payload admin
- Edge case: duplicate URL hash insert returns existing record (upsert semantics)
- Happy path: env vars present and validated at build time

**Verification:**
- `pnpm build` succeeds with new collections registered
- Payload admin shows both new collections

---

### U2. Scraping Module — Platform-Aware Listing Extraction

**Goal:** Build a scraping module that accepts Airbnb, VRBO, or Wander URLs and returns structured listing data (photos, title, description, amenities, reviews, metadata).

**Requirements:** R1 (URL validation), R2 (scrape extraction), R3 (30s timeout)

**Dependencies:** U1 (collections for caching)

**Files:**
- Create: `src/lib/unique-score/scraper.ts`
- Create: `src/lib/unique-score/types.ts`
- Test: `src/lib/unique-score/__tests__/scraper.test.ts`

**Approach:**
- Define `ListingData` type: title, description, photoUrls (string[]), amenities (string[]), rating, reviewCount, reviewSnippets (string[]), propertyType, platform
- URL validation: regex patterns for Airbnb (`airbnb.com/rooms/(\d+)`), VRBO (`vrbo.com/\d+`), Wander (`wander.com/stays/[\w-]+`). Return clear error for unsupported platforms.
- Primary scraper: Browserless `/content` endpoint with 30s timeout. Returns fully rendered HTML.
- Fallback scraper: plain `fetch()` with browser User-Agent. May miss JS-rendered content but faster.
- Platform-specific parsers: one function per platform that takes raw HTML and returns `ListingData`. Uses regex + DOM-style parsing to extract structured data.
- Photo URL extraction: find all `<img>` src attributes from listing gallery (Airbnb: `muscache.com`, VRBO: `vrboassets.com`, Wander: `wander.com` or CDN). Cap at 20 photos for Gemini context window management.
- Error handling: timeout → "Listing took too long to load", 404 → "Listing not found", blocked → "Unable to access this listing"

**Patterns to follow:**
- `scripts/lib/scraper.ts` — `ScrapeResult { success, data?, error? }` interface
- `scripts/enrich-prices-browser.js` — Browserless `/content` integration pattern
- `src/app/api/vacation-quiz/route.ts` — `maxDuration = 30` pattern

**Test scenarios:**
- Happy path (Airbnb): valid Airbnb room URL returns structured listing data with photos, title, description
- Happy path (VRBO): valid VRBO URL returns structured data
- Happy path (Wander): valid Wander URL returns structured data
- Edge case: URL with no reviews returns empty reviewSnippets array, not an error
- Error path: unsupported URL (e.g., Booking.com) returns clear error message
- Error path: Browserless timeout returns graceful error
- Error path: 404 listing returns "Listing not found" error
- Edge case: listing with >20 photos returns first 20 only

**Verification:**
- Unit tests pass for URL validation (all 3 platforms)
- Manual test: scrape a real Airbnb URL and verify extracted data completeness

---

### U3. Multimodal Analysis Module — Gemini Flash Integration

**Goal:** Build the Gemini Flash analysis module that takes extracted listing data and returns structured scores across all 5 dimensions.

**Requirements:** R4 (Gemini Flash structured analysis), R5 (5 dimensions with weights, scores, observations, suggestions)

**Dependencies:** U2 (ListingData type), U1 (@ai-sdk/google installed)

**Files:**
- Create: `src/lib/unique-score/analyzer.ts`
- Create: `src/lib/unique-score/prompt.ts`
- Create: `src/lib/unique-score/cache.ts`
- Test: `src/lib/unique-score/__tests__/analyzer.test.ts`

**Approach:**
- Use `@ai-sdk/google` provider with `google('gemini-2.0-flash')` model
- Use `generateObject()` with a Zod schema defining the output structure: `{ dimensions: [{ name, score (0-100), observations (string[2-3]), suggestion }], overallScore }`
- The prompt (in `prompt.ts`) instructs Gemini to act as a discerning traveler evaluating the listing for uniqueness and experience quality. Includes all 5 dimension definitions and evaluation criteria from origin R5.
- Photo handling: pass photo URLs as image parts in the multimodal prompt (Gemini Flash supports image inputs). Limit to 15 photos to stay within context window.
- Cache module: check `score-reports` collection by URL hash. If cached result exists and < 24h old, return it. Otherwise run analysis and store result.
- Lazy singleton for Google provider (follow `src/lib/llm.ts` pattern)

**Patterns to follow:**
- `src/lib/llm.ts` — lazy provider singleton, `generateText()` pattern (adapt to `generateObject()`)
- `src/app/api/vacation-quiz/route.ts` — result processing pattern

**Test scenarios:**
- Happy path: valid listing data returns all 5 dimension scores in 0-100 range with observations and suggestions
- Edge case: listing with no photos skips Visual Story photo analysis, relies on description only (score adjusts lower)
- Edge case: listing with sparse description produces lower Written Story score
- Edge case: listing with no reviews adjusts Guest Confidence to rely on amenities + info completeness
- Error path: Gemini API failure returns structured error
- Edge case: cached result returned without calling Gemini when < 24h old
- Edge case: cached result expired → re-analysis triggered

**Verification:**
- Unit tests pass for cache hit/miss logic
- Manual test: analyze a real listing and verify all 5 dimensions scored with coherent observations

---

### U4. API Routes — Analyze, Payment, Webhook

**Goal:** Create the server-side API routes for analysis, Stripe checkout, and webhook handling.

**Requirements:** R1 (validate + process), R3 (under 60s total), R8 ($19 Stripe payment), R6/R7 (email capture)

**Dependencies:** U2 (scraper), U3 (analyzer), U1 (collections)

**Files:**
- Create: `src/app/api/unique-score/analyze/route.ts`
- Create: `src/app/api/unique-score/report/route.ts`
- Create: `src/app/api/unique-score/webhook/stripe/route.ts`
- Test: `src/app/api/unique-score/__tests__/analyze.test.ts`

**Approach:**

**Analyze route (POST):**
- Accept `{ url, email? }` in request body
- Validate URL against Airbnb/VRBO/Wander patterns
- IP rate limit (reuse QuizLeads pattern: 5 per IP per hour)
- Check cache → return cached if hit
- Run scraper → run analyzer → store result in `score-reports`
- Save email to `host-leads` if provided (fire-and-forget, don't block response)
- Return `{ scoreId, dimensions: [...], overallScore, cached: boolean }`
- Set `maxDuration = 60` for Vercel serverless (analysis can take 30-50s)

**Report route (POST):**
- Accept `{ scoreId, email }` in request body
- Create Stripe Checkout session with `scoreId` and `email` in metadata
- Return `{ checkoutUrl }` for client redirect

**Stripe webhook (POST):**
- Verify webhook signature
- On `checkout.session.completed`: update `score-reports` record to `paid: true`, trigger email delivery with full report
- Email delivery: use PostHog to capture event, send via Beehiiv or simple Resend email

**Patterns to follow:**
- `src/app/api/vacation-quiz/route.ts` — validate, process, return JSON
- `src/app/api/vacation-quiz/lead/route.ts` — IP rate limiting, email normalization, Payload create

**Test scenarios:**
- Happy path (analyze): valid Airbnb URL returns scoreId and dimension data within 60s. Covers AE1.
- Error path (analyze): unsupported URL returns 400 with clear message. Covers AE2.
- Error path (analyze): missing URL returns 400
- Edge case (analyze): cached result returned without re-scraping
- Happy path (report): valid scoreId creates Stripe Checkout session and returns URL
- Error path (report): invalid scoreId returns 404
- Happy path (webhook): valid signature + completed session marks report as paid
- Error path (webhook): invalid signature returns 400
- Integration: full flow from analyze → checkout → webhook → paid report. Covers F1, F2.

**Verification:**
- API routes respond correctly to all test scenarios
- Stripe Checkout session creates successfully with test keys
- Webhook processes payment completion

---

### U5. Client UI — Landing Page, Results Display, Payment Flow

**Goal:** Build the `/unique-score` page with URL input, loading state, tiered results display, email capture, and payment CTA.

**Requirements:** R6 (free tier display), R7 (optional email), R8 (payment CTA), R10 (SEO landing page)

**Dependencies:** U4 (API routes)

**Files:**
- Create: `src/app/(app)/unique-score/page.tsx`
- Create: `src/app/(app)/unique-score/UniqueScoreClient.tsx`
- Create: `src/app/(app)/unique-score/_components/ScoreHero.tsx`
- Create: `src/app/(app)/unique-score/_components/ScoreResults.tsx`
- Create: `src/app/(app)/unique-score/_components/DimensionCard.tsx`
- Create: `src/app/(app)/unique-score/_components/LockedDimensionCard.tsx`
- Create: `src/app/(app)/unique-score/_components/EmailCapture.tsx`
- Create: `src/app/(app)/unique-score/_components/PaymentCTA.tsx`
- Create: `src/app/(app)/unique-score/_components/ShareButton.tsx`

**Approach:**

**Server page (`page.tsx`):** Metadata for SEO — title, description, OG tags targeting "airbnb listing grader" / "unique stay score" / "listing quality checker" keywords. JSON-LD structured data for the tool.

**Client component (`UniqueScoreClient.tsx`):** State machine with phases: `idle` → `loading` → `results`. On mount, check URL params for `r=<scoreId>` (shared results). If present, fetch cached result.

**ScoreHero:** Large hero section with headline, subtext, and URL input field. "What's your Unique Score?" branding. Platform logos (Airbnb, VRBO, Wander). Mobile-first responsive design.

**ScoreResults:** Displays overall score (blurred if unpaid). Shows Visual Story and Standout Factor as full `DimensionCard` components with score, observations, and suggestions. Shows Written Story, Guest Confidence, Experience Depth as `LockedDimensionCard` components with lock icon and dimension name.

**DimensionCard:** Score gauge/bar (0-100), dimension name and weight, 2-3 observation bullets, 1 improvement suggestion. Uses Fraunces for display, Plus Jakarta Sans for body.

**LockedDimensionCard:** Blurred/locked appearance with lock icon, dimension name, "Unlock with full report" text.

**EmailCapture:** Positioned after free results. Single email input with "Send me my free scores" CTA. Optional — results visible without entering email. Fires on submit and on "skip."

**PaymentCTA:** "$19 Unlock Full Report" button with Stripe redirect. Shown after email capture (or in its place if email skipped).

**ShareButton:** Generates shareable link with scoreId as URL param. Copies to clipboard + shows native share sheet on mobile.

**Patterns to follow:**
- `src/app/(app)/vacation-quiz/page.tsx` — server page with metadata + client wrapper
- `src/app/(app)/vacation-quiz/VacationQuizClient.tsx` — state machine pattern (idle → loading → results)
- `src/components/VacationQuiz.tsx` — step-by-step UI with framer-motion, Tailwind, emoji options
- `src/components/QuizResults.tsx` — results display component
- `src/app/(app)/layout.tsx` — font variables (Fraunces, Plus Jakarta Sans, Caveat)

**Test scenarios:**
- Happy path: URL input → loading spinner → results display with 2 free + 3 locked dimensions. Covers AE4.
- Happy path: shared link (`?r=<scoreId>`) loads cached results directly
- Edge case: skip email → results still visible → payment CTA still shown
- Happy path: email entered → saved to host-leads → payment CTA shown
- Happy path: payment CTA click → redirect to Stripe → return to unlocked results. Covers AE5.
- Error path: invalid URL shows inline error message
- Edge case: mobile viewport renders correctly (mobile-first design)

**Verification:**
- Page loads and renders all states (idle, loading, results, paid results)
- SEO metadata present and correct
- Mobile layout works at 375px viewport width

---

### U6. OG Image Generation + Share Flow

**Goal:** Build dynamic OG image generation for share cards and wire up the share flow.

**Requirements:** R9 (shareable OG card with scores, share link to results page)

**Dependencies:** U5 (client UI with ShareButton)

**Files:**
- Create: `src/app/api/unique-score/og-image/route.ts`

**Approach:**
- Use `@vercel/og` (`ImageResponse`) to generate dynamic OG images
- Template: dark background with Unique Stays branding, overall score as large number, Visual Story and Standout Factor scores as smaller badges, "Get your Unique Score" CTA text
- Route accepts `?id=<scoreId>` query param, fetches cached result from Payload, generates image
- Content-Type: `image/png`, caching headers: 1 hour
- The `page.tsx` metadata dynamically sets OG image URL when `r=<scoreId>` param is present
- ShareButton generates the OG image URL and the shareable results URL

**Patterns to follow:**
- `@vercel/og` documentation for `ImageResponse`
- `src/app/(app)/layout.tsx` — existing OG image pattern in metadata

**Test scenarios:**
- Happy path: valid scoreId generates PNG image with scores
- Edge case: invalid scoreId returns 404 or placeholder image
- Edge case: image dimensions fit OG standards (1200x630)

**Verification:**
- OG image renders correctly for a sample score
- Twitter Card Validator / Facebook Debugger picks up the image

---

### U7. Integration Testing + Prompt Calibration

**Goal:** End-to-end testing of the full flow with real listings. Calibrate the Gemini Flash prompt for consistent, useful scores.

**Requirements:** All (R1-R10)

**Dependencies:** U1, U2, U3, U4, U5, U6

**Files:**
- Modify: `src/lib/unique-score/prompt.ts` (calibration adjustments)
- Test: `src/lib/unique-score/__tests__/integration.test.ts`

**Approach:**
- Test against 5-10 real listings across all 3 platforms (Airbnb, VRBO, Wander)
- Include: a clearly excellent listing (expect high scores), a clearly mediocre listing (expect low scores), a unique stay, a generic rental, a listing with no reviews
- Verify score distribution: scores should spread across 30-90 range, not cluster at 50-60
- Verify observation quality: each observation should be specific and actionable, not generic ("good photos" → "hero shot captures the treehouse from below with dramatic lighting")
- Verify suggestion quality: each suggestion should be concrete ("add a photo showing the outdoor shower at golden hour")
- Adjust prompt weighting, instructions, and examples based on results
- Run full payment flow with Stripe test mode: analyze → email → pay → unlock → share

**Test scenarios:**
- Integration: full free flow — URL paste → scrape → analyze → display 2 free + 3 locked dimensions. Covers F1, AE1.
- Integration: full paid flow — free results → email → Stripe checkout → webhook → unlocked results. Covers F2, AE5.
- Integration: share flow — results → share → new visitor loads shared link → sees same results. Covers F3.
- Edge case: unsupported platform URL shows clear error. Covers AE2.
- Edge case: listing with no reviews scores Guest Confidence on amenities only. Covers AE3.
- Calibration: known-excellent listing scores ≥70 across dimensions
- Calibration: known-mediocre listing scores ≤50 in at least 2 dimensions
- Calibration: scores are consistent (±5) on re-analysis of same listing

**Verification:**
- All integration tests pass
- Prompt produces calibrated scores across test set
- Full payment flow works in Stripe test mode
- Share links load correctly for new visitors

---

## System-Wide Impact

- **Interaction graph:** New API routes under `/api/unique-score/` — no modifications to existing routes. New Payload collections (`score-reports`, `host-leads`) — no changes to existing collections. New page at `/unique-score` — no changes to existing pages.
- **Error propagation:** Scraping failures → user-facing error messages. Gemini API failures → "Analysis unavailable, try again" with retry. Stripe failures → payment CTA disabled with message. All errors logged to PostHog.
- **State lifecycle risks:** Cached results in `score-reports` must be cleaned up periodically (24h TTL). Consider a Vercel cron or Payload hook for cleanup. Payment state (paid: false → true) must be atomic — Stripe webhook is the single source of truth.
- **API surface parity:** No existing API surface affected. New surface follows established patterns.
- **Integration coverage:** Full end-to-end flow (scrape → analyze → display → pay → unlock) needs integration testing. Individual modules testable in isolation.
- **Unchanged invariants:** Existing Stays collection, vacation quiz, newsletter subscription, and all public pages remain untouched. Browserless usage increases — monitor concurrent session limit (1 at a time on free tier).

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Browserless free tier exhausted (1K req/mo, 1 concurrent) | Medium | High — scraping fails entirely | Cache aggressively (24h). Monitor usage. Upgrade plan if tool gains traction. |
| Airbnb/VRBO DOM structure changes break parser | Medium | Medium — extraction fails for that platform | Platform parsers are isolated. One platform failure doesn't break others. Version-check parsers during cron. |
| Gemini Flash produces inconsistent scores | Medium | Medium — user trust erodes if scores vary widely | Calibrate prompt with test set. Cache results per URL. Log score variance. |
| Stripe webhook delivery delayed | Low | Low — user sees locked results briefly after paying | Client polls payment status as fallback. Show "processing payment" state. |
| Gemini Flash rate limits on viral traffic spike | Low | Medium — analysis fails during peak | Queue requests. Return cached results when available. Show "analyzing, check back in 5 min" for uncached. |
| Photo URLs expire or are hotlink-protected | Medium | Medium — Gemini can't analyze photos | Store photo URLs at scrape time. Pass immediately to Gemini. Don't persist photo URLs long-term. |

## Documentation / Operational Notes

- **Env vars needed:** `GOOGLE_GENERATIVE_AI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `BROWSERLESS_TOKEN` (already exists), `NEXT_PUBLIC_SERVER_URL` (already exists)
- **Stripe setup:** Jon creates account, gets API keys, creates $19 product/price, configures webhook endpoint pointing to `/api/unique-score/webhook/stripe`
- **Monitoring:** PostHog events to track: `unique_score_analyzed`, `unique_score_paid`, `unique_score_shared`, `unique_score_email_captured`
- **SEO:** Landing page targets "airbnb listing grader," "unique stay score," "listing quality checker." Add JSON-LD `WebApplication` schema.
- **Rate limiting:** 5 analyses per IP per hour (reuse QuizLeads pattern). Prevents abuse of Browserless and Gemini quotas.

## Sources & References

- **Origin document:** [docs/brainstorms/unique-score-requirements.md](docs/brainstorms/unique-score-requirements.md)
- Related code: `src/lib/llm.ts` (AI SDK pattern), `scripts/lib/scraper.ts` (scraping pattern), `src/app/api/vacation-quiz/` (API route pattern)
- Related plan (superseded): `docs/plans/free-tool-unique-score.md`
- Vercel AI SDK Google provider: https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai
- Stripe Checkout: https://docs.stripe.com/checkout/quickstart
- @vercel/og: https://vercel.com/docs/functions/og-image-generation
