---
title: "feat: Listing content enrichment pipeline"
type: feat
status: active
date: 2026-05-10
origin: docs/brainstorms/listing-content-enrichment-requirements.md
deepened: 2026-05-10
---

# feat: Listing content enrichment pipeline

## Summary

A CLI batch script that scrapes platform listings via Firecrawl, generates editorial content via an LLM, downloads and uploads gallery images to Vercel Blob, and writes enriched fields back to Payload. Three new schema fields (body, areaGuide, faqs) added to the Stays collection. The detail page updated to render the new content with two new UI sections (area guide card, FAQ definition list) and an expanded editorial card body. Two-tier enrichment: Tier 1 (featured/editor's picks) gets full treatment; Tier 2 gets lighter enrichment. Includes needs-review flagging and a pilot run before scaling.

---

## Problem Frame

All 231 stay detail pages have thin content — a single ~215 char description, zero gallery images, and no editorial metadata. The detail page template already renders these fields but falls back to "—" or first-sentence extracts. This pipeline fills those fields with scraped facts transformed into editorial voice, giving each page enough substance to rank for long-tail queries and engage travelers before they click through to the platform. (see origin: `docs/brainstorms/listing-content-enrichment-requirements.md`)

---

## Requirements

- R1. Scrape platform listing pages via Firecrawl to extract host descriptions, amenities, neighborhood info, and photo URLs (see origin R1)
- R2. Download top N listing photos (5 for Tier 1, 2-3 for Tier 2) and upload to Vercel Blob, storing URLs in the `galleryImages.imageUrl` sub-field (see origin R2, R12)
- R3. Handle scraping failures gracefully — log and continue rather than aborting the batch (see origin R3)
- R4. Generate editorial content in UniqueStaysUSA's brand voice using scraped facts plus stay metadata (see origin R4)
- R5. Tier 1 stays receive: rich body description (2-3 paragraphs), area guide (1-2 paragraphs), 3-5 FAQ pairs, and populated editorial metadata (editorNote, bestFor, bestSeason, vibe) (see origin R5)
- R6. Tier 2 stays receive: extended body description (1-2 paragraphs) and editorial metadata (bestFor, bestSeason, vibe). No area guide or FAQs (see origin R6)
- R7. Flag stays for manual review based on source data quality — stays where scraping failed or returned minimal data are marked `needsReview: true` in the report (see origin R7)
- R8. CLI batch script with incremental execution (skip enriched stays) and `--force` flag (see origin R8)
- R9. Tier assignment automatic: `featured=true OR editorsPick=true` → Tier 1; all others → Tier 2 (see origin R9)
- R10. Console summary report: total processed, successes/failures, per-stay failure list, flagged stays needing review (see origin R10)
- R11. Content writes directly to live Payload fields via local API (no draft layer) (see origin R11)
- R12. Gallery images stored via `galleryImages` array with `imageUrl` text sub-field (see origin R12)
- R13. Three new schema fields added to Stays collection: `body` (textarea), `areaGuide` (textarea), `faqs` (array of {question, answer}) — with migration

**Origin actors:** A1 (Enrichment script), A2 (Admin / Jon)
**Origin flows:** F1 (Pilot enrichment), F2 (Full batch enrichment)
**Origin acceptance examples:** AE1 (Tier 1 vs Tier 2 content depth), AE2 (Scraping failure handling), AE3 (Idempotent re-run)

---

## Scope Boundaries

- No draft/publish review workflow — content writes directly to live fields
- No automated re-enrichment or scheduled re-runs
- No conversion tracking, A/B testing, or analytics integration
- No structured data / JSON-LD schema changes
- No video content, virtual tours, or user-generated content
- No enrichment of blog posts or journal content
- No search index regeneration — deferred to a follow-up task after enrichment lands
- No conversion of gallery images to Payload Media upload relations — using `imageUrl` text sub-field for v1

**Note on detail page changes:** The origin assumed "no changes to detail page layout or components." In practice, the current template does not render `body`, `areaGuide`, or `faqs` fields (they do not exist yet). U6 adds two new UI sections (area guide card, FAQ definition list) and expands the editorial card body rendering — this is required work, not optional, since enriched content would be invisible without it.

### Deferred to Follow-Up Work

- Search index regeneration: update `buildSearchText()` in `generate-search-index.ts` to incorporate `body`, `areaGuide`, and FAQ content, then re-run `pnpm index:search`
- Gallery image upload relation migration: convert `galleryImages.imageUrl` entries to proper Payload Media uploads via the `galleryImages.image` relation field
- JSON-LD FAQ structured data: add server-side JSON-LD generation for FAQ content (reads from the same `faqs` field; HTML structure does not need to be "schema-ready")

---

## Context & Research

### Relevant Code and Patterns

- `scripts/import-stays.ts` — Payload local API pattern for CLI scripts: `getPayload({ config })`, paginated `payload.find()`, upsert via slug lookup, failure tracking
- `scripts/migrate-images.ts` — Image download with retry (`fetchWithRetry`), Vercel Blob upload via `@vercel/blob` `put()`, batch concurrency control (5), progress reporting, Payload update after upload
- `scripts/generate-search-index.ts` — Batch processing pattern: Payload init, paginated fetch, batch API calls, progress counter, file output
- `src/collections/Stays.ts` — Current schema: `galleryImages` array (image upload + imageUrl text), `editorNote`, `bestFor`, `bestSeason`, `vibe` fields already exist. Access control requires `user` for writes — local API bypasses this, but `overrideAccess: true` should be explicit
- `src/collections/Media.ts` — Upload config with image sizes (card 800x600, hero 1600x900, thumb 400x300), uses `@payloadcms/storage-vercel-blob`
- `src/lib/payload-queries.ts` — `normalizeStay()` maps Payload docs to `NormalizedStay`; `getStayBySlug()` used by detail page. Gallery image normalization at lines 39-43 already handles `imageUrl`-only entries — only body/areaGuide/faqs mappings needed
- `src/lib/types.ts` — `NormalizedStay` type shape
- `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx` — Detail page renders `description` at three locations: desktop editorial card (line 439), pull quote fallback (line 84), mobile description (line 618)

### External References

- Firecrawl SDK documentation (for programmatic scraping)
- Vercel AI SDK or Anthropic SDK (for LLM integration)

---

## Key Technical Decisions

- **Gallery images use `imageUrl` text sub-field**: The existing `galleryImages` array has both an `image` upload relation and an `imageUrl` text field. Using `imageUrl` with direct Vercel Blob URLs matches the proven `migrate-images.ts` pattern and avoids the complexity of creating Media records with file uploads from a CLI script. The upload relation can be migrated later.
- **Download-to-Blob is mandatory, not optional**: The `galleryImages.imageUrl` sub-field has a `validateHttpsUrl` validator that enforces `https://` URLs. Scraped CDN URLs (which may be `http://`) cannot be written directly. All images must go through the download-and-reupload-to-Blob pipeline to produce valid `https://` blob URLs.
- **New dependencies added to the project**: Firecrawl SDK (`@mendable/firecrawl-js`) for programmatic scraping and an AI SDK for editorial generation. Neither exists in the current dependencies.
- **Three new schema fields as textareas and arrays**: `body` (textarea — preserves paragraphs without Lexical complexity), `areaGuide` (textarea), `faqs` (array of {question: text, answer: text} — matches the existing `tags` array pattern). Avoids introducing Lexical rich text for AI-generated content.
- **Script follows existing Payload local API pattern**: `getPayload({ config })` with paginated reads and `payload.update()` for writes, matching `import-stays.ts` and `migrate-images.ts`. Initialize Payload once at the top of `main()` and reuse the instance throughout (unlike `migrate-images.ts` which reinitializes per batch).
- **Image content-type validation before Blob upload**: Downloaded images must be validated as actual image files before uploading to Vercel Blob. Use `sharp` (already a project dependency) to attempt processing — it throws on non-images and rejects SVG with embedded JavaScript. This prevents malicious file uploads through the `imageUrl` pipeline which bypasses Payload's Media upload validation.
- **Scraped content sanitized before LLM prompt**: Raw scraped HTML/text is stripped to plain text (HTML tags removed) and truncated before inclusion in the LLM prompt. Defense-in-depth against prompt injection from compromised listing pages.
- **Field constraints on new schema fields**: `body` max 5000 chars, `areaGuide` max 2000 chars, `faqs` max 10 items. Output validation step in the orchestrator checks LLM output against these constraints before writing to Payload.
- **Confidence scoring simplified to per-stay boolean**: Instead of three-level per-field scoring (high/medium/low), the pipeline uses a single `needsReview: true | false` per stay. True when scraping failed or returned minimal data. This collapses the entire confidence apparatus into the one decision it drives: "should I look at this stay?"
- **FAQs rendered as definition list**: Definition list (`<dl>/<dt>/<dd>`) over accordion. Brand principle "motion earns its keep" — collapsing/expanding FAQs hides content without communicating meaning. 3-5 items is few enough to display in full. Accessible by default (no ARIA ceremony). Schema-ready for future JSON-LD via server-side generation.
- **Area guide rendered as secondary editorial card**: Same paper texture and stacked shadow as the editorial card, but replaces the postmark with a compass needle motif, uses "The Neighborhood" section header, and has no ghost quotation mark. Maintains brand coherence while distinguishing from the primary editorial card.
- **Image download uses existing retry and Blob upload patterns**: Reuse the `fetchWithRetry` approach from `migrate-images.ts` and `@vercel/blob` `put()` for uploads.

---

## Open Questions

### Resolved During Planning

- **Gallery image storage**: `imageUrl` text sub-field (not upload relation) — matches existing pattern, avoids Media record complexity
- **New field types**: textarea for body/areaGuide, array for faqs — avoids Lexical overhead for AI-generated content
- **Search reindex**: Deferred to follow-up task, not included in this plan
- **FAQ rendering**: Definition list — aligns with brand principles of editorial restraint and motion that earns its keep
- **Confidence scoring**: Per-stay `needsReview` boolean — drives the single decision (review or skip) without per-field granularity overhead
- **Image content validation**: `sharp` processing before Blob upload — already a project dependency, prevents non-image file uploads
- **Detail page scope**: U6 adds new UI sections (area guide card, FAQ list) — required because current template does not render fields that don't exist yet. Origin's "no changes" assumption was incorrect.

### Deferred to Implementation

- **LLM model selection**: Cost/quality tradeoff across 231 stays — the script should accept a model env var so it can be tuned without code changes
- **Firecrawl rate limits**: May need configurable delays between requests — implementation should add a `--delay` flag or env var
- **Image quality filtering criteria**: What constitutes a "low-quality" image to skip during download — confirm during pilot run
- **Exact prompt structure for editorial generation**: Needs tuning during the pilot run (F1); the plan specifies the prompt's inputs and outputs, not the exact wording

---

## Implementation Units

### U1. Schema additions and migration

**Goal:** Add `body`, `areaGuide`, and `faqs` fields to the Stays collection schema, generate and run the migration, update TypeScript types.

**Requirements:** R5, R6, R13

**Dependencies:** None

**Files:**
- Modify: `src/collections/Stays.ts`
- Modify: `src/lib/types.ts` (NormalizedStay)
- Modify: `src/lib/payload-queries.ts` (normalizeStay — body/areaGuide/faqs only; gallery image normalization already handles `imageUrl`-only entries)
- Generated: new migration file via `pnpm migrate:create`

**Approach:**
- Add `body` (textarea, optional, maxLength 5000) after the existing `description` field — for the rich editorial description
- Add `areaGuide` (textarea, optional, maxLength 2000) after `body` — for the neighborhood/area guide
- Add `faqs` (array, optional, max 10 items) with sub-fields `question` (text, required) and `answer` (text, required) — for AEO FAQ pairs, following the existing `tags` array pattern
- Run `pnpm generate:types` and `pnpm migrate:create`, then `pnpm migrate`
- Update `NormalizedStay` in `types.ts` to include `body?: string`, `areaGuide?: string`, `faqs?: Array<{question: string; answer: string}>`
- Update `normalizeStay()` in `payload-queries.ts` to map the three new fields

**Patterns to follow:**
- `tags` array field in `src/collections/Stays.ts` (array with text sub-field pattern)
- `editorNote` textarea field for the textarea pattern
- Migration `20260509_224747.ts` for the most recent migration adding fields

**Test scenarios:**
- Happy path: new fields accept data via Payload admin — create a stay with body, areaGuide, and 3 FAQs, verify they persist
- Edge case: stay with no new fields populated — existing fields unaffected, detail page renders without errors
- Edge case: body exceeds 5000 chars — Payload validation rejects the write

**Verification:**
- `pnpm generate:types` succeeds with no type errors
- `pnpm migrate` applies the migration successfully
- Payload admin shows the new fields on the Stays edit form

---

### U2. Firecrawl scraping module

**Goal:** Create a module that takes an affiliate URL and returns structured listing data: host description, amenities list, neighborhood info, and photo URLs.

**Requirements:** R1, R3

**Dependencies:** None (can be developed in parallel with U1)

**Files:**
- Create: `scripts/lib/scraper.ts`

**Approach:**
- Accept an affiliate URL and optional Firecrawl API key
- Call Firecrawl's scrape endpoint with the listing URL
- Extract structured data from the scraped content: host-written description, amenity/feature list, neighborhood/area information, photo image URLs
- Return a typed result object with the extracted data and a success/failure status
- On failure (blocked, timeout, insufficient data), return the error with a structured failure object — caller decides how to handle

**Patterns to follow:**
- `scripts/generate-search-index.ts` — API call with error handling pattern
- `scripts/migrate-images.ts` — `fetchWithRetry` pattern for network resilience

**Test scenarios:**
- Happy path: scrape an Airbnb listing URL → returns description, amenities array, neighborhood text, and image URL array
- Happy path: scrape a VRBO listing URL → same structured output
- Error path: URL returns 403/blocked → returns failure object with error details, does not throw
- Error path: URL returns page with minimal content → returns partial data with appropriate failure signals
- Edge case: URL is not Airbnb/VRBO (e.g., Wander, Direct) → handles gracefully, returns what's available

**Verification:**
- Module can be imported and called from a test script
- Successfully scrapes at least one real listing URL

---

### U3. AI editorial generation module

**Goal:** Create a module that takes scraped data + stay metadata and generates editorial content in UniqueStaysUSA's brand voice, with tier-aware depth.

**Requirements:** R4, R5, R6, R7

**Dependencies:** U1 (field types defined)

**Files:**
- Create: `scripts/lib/generator.ts`

**Approach:**
- Accept: stay metadata (title, location, category, tags, description, region, price), scraped data (host description, amenities, neighborhood info), and tier level (1 or 2)
- **Sanitize scraped input before prompt construction**: strip HTML/script tags, extract plain text only, enforce maximum character limit on scraped content. Defense-in-depth against prompt injection from compromised listing pages
- For Tier 1: generate body (2-3 paragraphs), areaGuide (1-2 paragraphs), 3-5 FAQ pairs, editorNote (one-sentence pull-quote), bestFor, bestSeason, vibe
- For Tier 2: generate body (1-2 paragraphs), bestFor, bestSeason, vibe only
- Brand voice: warm, first-person, slightly literary — "The Wanderer's Postcard Collection." Think Kinfolk meets Monocle. The scraped host description provides factual anchoring; the AI transforms it into editorial voice
- **Needs-review flag**: `true` when scraping failed or returned minimal data (no host description, fewer than 3 amenities, no neighborhood info); `false` otherwise. Single boolean per stay, not per-field
- Return a typed result with all generated fields and the needs-review flag

**Patterns to follow:**
- Brand personality from CLAUDE.md: "Wanderer · Editorial · Nostalgic" with terracotta/cream/forest palette

**Test scenarios:**
- Happy path (Tier 1): given full scraped data for a treehouse → generates body with 2+ paragraphs, areaGuide with local attractions, 3-5 FAQs with specific questions ("How do I get there?", "What's nearby?"), and editorial metadata
- Happy path (Tier 2): given full scraped data for a cabin → generates body with 1-2 paragraphs and editorial metadata, no area guide or FAQs
- Edge case: minimal scraped data (no host description, no amenities) → generates content from metadata only, needsReview = true
- Edge case: scraping completely failed → generates content from title + location + category + tags + existing description, needsReview = true
- Security: scraped content contains HTML/script tags → stripped to plain text before prompt construction
- Covers AE1: Tier 1 output has all content types; Tier 2 output has only body + metadata

**Verification:**
- Module generates content for a sample stay that reads naturally (not obviously AI-generated)
- Needs-review flag is true for stays with minimal scraped data and false for stays with rich data
- Scraped HTML is stripped before reaching the LLM prompt

---

### U4. Image download and upload module

**Goal:** Download listing photos, validate as actual images, upload to Vercel Blob, and return gallery image entries ready for Payload.

**Requirements:** R2, R3

**Dependencies:** None (can be developed in parallel with U1-U3)

**Files:**
- Create: `scripts/lib/images.ts`

**Approach:**
- Accept: array of image URLs, stay slug (for blob path naming), and count limit (5 for Tier 1, 3 for Tier 2)
- Download each image with retry logic (reuse `fetchWithRetry` pattern from `migrate-images.ts`)
- **Validate content type before upload**: use `sharp` (already a project dependency) to attempt image processing — this rejects non-image files (SVG with embedded JS, HTML pages, polyglot files) before they reach Blob storage. The `imageUrl` pipeline bypasses Payload's Media upload validation, so this validation gate is mandatory
- Upload to Vercel Blob via `@vercel/blob` `put()` with path `stays/{slug}/gallery-{index}.{ext}`
- Return array of `{ imageUrl: string }` objects ready to set on `galleryImages`
- **Download-to-Blob is architecturally mandatory**: the `galleryImages.imageUrl` sub-field has `validateHttpsUrl` enforcement — scraped CDN URLs (potentially `http://`) cannot be written directly. All images must go through Blob upload
- Filter: skip images that fail to download after retries; skip images under a minimum size threshold (to filter out thumbnails/logos)
- Handle failures: return partial results rather than failing entirely if some images don't download

**Patterns to follow:**
- `scripts/migrate-images.ts` — `fetchWithRetry`, `@vercel/blob` `put()`, batch concurrency, error tracking

**Test scenarios:**
- Happy path: given 8 image URLs → downloads and uploads top 5, returns 5 gallery entries with blob URLs
- Happy path: given 2 image URLs → downloads and uploads both, returns 2 gallery entries
- Error path: 1 of 5 URLs fails → returns 4 successful entries, logs the failure
- Error path: all URLs fail → returns empty array, logs all failures
- Edge case: URL returns a tiny image (< 10KB) → filtered out as likely thumbnail/logo
- Edge case: URL returns 403 → retry with backoff, then skip on final failure
- **Security: URL returns SVG with embedded JavaScript → sharp processing rejects it, file not uploaded to Blob**
- **Security: URL returns an HTML page → sharp processing rejects it, file not uploaded to Blob**

**Verification:**
- Module downloads and uploads at least 3 images for a test stay
- Blob URLs are accessible and return valid images
- Failed downloads don't crash the module
- Non-image files are rejected before Blob upload

---

### U5. Batch pipeline orchestrator

**Goal:** The main CLI script that ties scraping, generation, and image handling together with tier logic, idempotent execution, needs-review flagging, and reporting.

**Requirements:** R8, R9, R10, R11

**Dependencies:** U1 (schema), U2 (scraper), U3 (generator), U4 (images)

**Files:**
- Create: `scripts/enrich-stays.ts`

**Approach:**
- Follow `scripts/import-stays.ts` / `scripts/migrate-images.ts` structure: top comment with run command, env vars, async main, exit codes
- Initialize Payload once at the top of `main()` and reuse the instance throughout (unlike `migrate-images.ts` which reinitializes per batch)
- CLI flags: `--pilot` (takes comma-separated slugs, processes only those), `--force` (re-enrich even if fields populated), `--delay` (ms between scrapes, default 2000)
- All `payload.update()` calls include `overrideAccess: true` — makes the local API bypass explicit and intentional
- Main loop: fetch all stays from Payload → filter by flags → determine tier (featured/editorsPick = Tier 1) → for each stay: scrape → generate → download images → validate output → update Payload
- **Output validation before write**: check LLM output meets field constraints (body ≤ 5000 chars, areaGuide ≤ 2000 chars, faqs ≤ 10 items, no raw HTML) before calling `payload.update()`. Truncate or regenerate if constraints exceeded
- Idempotency: skip stays where `body` is already populated (unless `--force`)
- Per-stay processing: try/catch around the full scrape-generate-upload-write pipeline; log failures, continue to next stay
- Report: console summary matching existing script patterns — totals (processed/succeeded/failed/skipped), per-stay failure list, stays flagged with `needsReview: true`
- Covers F1: `--pilot` flag processes 10 stays for prompt validation
- Covers F2: default run processes all 231 stays with tier logic
- Covers AE2: scraping failure → log error, set needsReview = true, continue
- Covers AE3: second run without `--force` skips all; with `--force` re-processes all

**Patterns to follow:**
- `scripts/import-stays.ts` — upsert pattern, failure tracking, progress reporting, single Payload init
- `scripts/migrate-images.ts` — batch processing, concurrency, error handling

**Test scenarios:**
- Covers AE3: run once → enriches stays; run again without `--force` → all skipped
- Covers AE3: run with `--force` → all stays re-enriched
- Covers AE2: one stay's URL blocked → that stay logged as failed, others continue
- Happy path: `--pilot treehouse-catskills-pine,wander-joshua-tree-starfall` → processes only those 2 stays
- Happy path: full run → processes 231 stays with Tier 1/2 logic, outputs console summary
- Edge case: LLM generates body exceeding 5000 chars → output validation truncates before write

**Verification:**
- Script runs end-to-end for a pilot batch of 2-3 stays
- All enriched fields visible in Payload admin for processed stays
- Console summary accurately reflects processed/failed/skipped counts and needs-review flags

---

### U6. Detail page rendering updates

**Goal:** Update the stay detail page to render the new `body`, `areaGuide`, and `faqs` fields with new UI sections for area guide and FAQs.

**Requirements:** R5, R6

**Dependencies:** U1 (schema fields exist)

**Files:**
- Modify: `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx`
- Modify: `src/lib/types.ts` (if not already updated in U1)
- Modify: `src/lib/payload-queries.ts` (if not already updated in U1)

**Approach:**

**Desktop section order** (right panel, after existing sections):
1. Editorial card (existing) — body replaces description when present
2. Fast facts (existing — bestFor, bestSeason, vibe)
3. Amenity stickers (existing)
4. Spoke details (existing)
5. **Area guide** (new) — secondary editorial card with compass needle motif
6. **FAQs** (new) — definition list
7. Affiliate disclosure (existing)
8. Related stays (existing)

**Editorial card body rendering:**
- Desktop (line 439): `stay.body || stay.description` — body takes precedence when enriched
- Mobile (line 618): same `stay.body || stay.description` swap — currently just a bare `<p>`, no card wrapper
- Pull quote fallback (line 84): update chain to `stay.editorNote || firstSentence(stay.body) || firstSentence(stay.description)` — ensures pull quote derives from the enriched body when editorNote is not yet populated

**Area guide section:**
- Only renders when `stay.areaGuide` is populated
- Secondary editorial card: same paper texture and stacked shadow as the editorial card, but replaces the postmark with a compass needle motif, uses "The Neighborhood" section header, and has no ghost quotation mark
- Consistent with the existing editorial card aesthetic but visually distinct as a secondary element

**FAQ section:**
- Only renders when `stay.faqs` is populated
- Rendered as a definition list (`<dl>/<dt>/<dd>`) — questions as bold labels, answers as body text
- No accordion interaction — 3-5 items display in full. Brand principle: "motion earns its keep" — collapsing content hides it without communicating meaning
- No "schema-ready markup" — future JSON-LD will be generated server-side from the same `faqs` data

**Mobile rendering:**
- Body text replaces description with the same fallback logic on mobile
- Area guide renders as a bordered section with "The Neighborhood" header (simplified from desktop card treatment)
- FAQs render as the same definition list in the mobile column flow, after stickers

**Patterns to follow:**
- Existing editorial card in `StayDetailContent.tsx` — paper texture, postmark, typography (for body and area guide)
- Fast facts section for the structured key-value layout
- Amenity stickers section for the conditionally-rendered section pattern

**Test scenarios:**
- Happy path: enriched Tier 1 stay shows body text (replacing short description), area guide section, and FAQ section
- Happy path: enriched Tier 2 stay shows body text and editorial metadata, no area guide or FAQ sections
- Edge case: unenriched stay (no body) → falls back to existing `description` rendering, no area guide, no FAQs
- Edge case: stay with body but no areaGuide → body renders, area guide section hidden
- Happy path: pull quote derives from `editorNote` first, then first sentence of `body`, then first sentence of `description`
- Responsive: all new sections render correctly on mobile layout with appropriate simplified treatment
- Desktop: sticky ticket stub continues to work with longer page content

**Verification:**
- Enriched stay detail page shows all new content sections
- Unenriched stay detail page looks identical to current behavior
- No layout breakage on desktop or mobile
- Pull quote updates correctly when body is present

---

## System-Wide Impact

- **Interaction graph:** Stays collection `afterChange` hook triggers `revalidateTag` on save — enriched stays will automatically purge their Next.js cache. No changes needed to the hook. Note: for 231 stays, this fires 462 cache-purge HTTP requests (2 per stay). If running against a production database, set `NEXT_PUBLIC_SERVER_URL` to `http://localhost:3000` during the enrichment run to avoid 462 cache purges on the live site.
- **Error propagation:** Pipeline failures are contained within the script — no runtime impact on the website. Partial enrichment (some fields populated, others failed) is acceptable since the detail page conditionally renders each field.
- **State lifecycle risks:** No partial-write concerns — each stay's enrichment is a single `payload.update()` call. If the script crashes mid-batch, previously enriched stays are committed; unprocessed stays are picked up on re-run (idempotent by default).
- **API surface parity:** No other interfaces consume the new fields yet. The `NormalizedStay` type and `normalizeStay` function ensure type safety across the app.
- **Integration coverage:** End-to-end validation requires: run pilot → check Payload admin → visit detail page → verify all sections render with real content.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Firecrawl blocked by Airbnb/VRBO anti-bot | Configurable `--delay` flag; pilot run validates before scaling; fallback to AI-only generation from metadata when scraping fails |
| Platform CDN image URLs expire before download | Scrape and download in the same pass (no separate download step); retry logic handles transient failures |
| LLM generates bland or inaccurate editorial content | Pilot run of 10 stays for prompt tuning; needs-review flagging for weak outputs; Tier 1 stays manually reviewed |
| Rate limiting on 231 sequential Firecrawl calls | Configurable delay between requests; script can be re-run on failures only via `--force` on specific slugs |
| Vercel Blob storage costs for ~700 images | One-time upload of ~700 images at ~200KB avg = ~140MB — within Blob free tier |
| New dependencies (Firecrawl SDK, AI SDK) add bundle weight | Dependencies are script-only, not imported by the Next.js app — no impact on client bundle |
| Platform sends DMCA or legal demand for scraped content | (1) Scraped content is transformed through LLM, not stored verbatim; (2) images use `imageUrl` text fields for easy bulk removal; (3) generated text fields can be bulk-cleared via Payload query |
| 462 revalidation requests during batch run | Set `NEXT_PUBLIC_SERVER_URL` to localhost during enrichment; or accept revalidation traffic as bounded |

---

## Documentation / Operational Notes

- After enrichment: run `pnpm index:search` to regenerate the semantic search index with enriched content (deferred follow-up)
- Required env vars: `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY` (or equivalent for chosen LLM), `BLOB_READ_WRITE_TOKEN` (required for image uploads)
- Add new env vars to `.env.local.example` following existing pattern (`NVIDIA_NIM_API_KEY`, `BROWSERLESS_API_KEY`)
- Script invocation: `node --env-file=.env.local --import tsx/esm scripts/enrich-stays.ts`
- Pilot run: add `--pilot slug1,slug2,...` flag to test on 10 stays before full batch
- Tier 1 review: after full batch, manually review all `featured=true` or `editorsPick=true` stays in Payload admin
- **Security note:** The enrichment script uses Payload's local API with `overrideAccess: true`, which bypasses access control. Only run from a trusted local environment. Never deploy as a serverless function or web-accessible endpoint.
- **Production safety:** During enrichment runs against a production database, set `NEXT_PUBLIC_SERVER_URL=http://localhost:3000` in your env to avoid triggering 462 cache purges on the live site.

---

## Sources & References

- **Origin document:** [docs/brainstorms/listing-content-enrichment-requirements.md](docs/brainstorms/listing-content-enrichment-requirements.md)
- Related scripts: `scripts/import-stays.ts`, `scripts/migrate-images.ts`, `scripts/generate-search-index.ts`
- Schema: `src/collections/Stays.ts`, `src/collections/Media.ts`
- Detail page: `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx`
- Types and queries: `src/lib/types.ts`, `src/lib/payload-queries.ts`
