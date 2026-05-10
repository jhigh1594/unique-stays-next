---
date: 2026-05-10
topic: listing-content-enrichment
---

# Listing Content Enrichment Pipeline

## Summary

A batch enrichment pipeline that scrapes platform listing data (Airbnb, VRBO) via Firecrawl, generates editorial content in UniqueStaysUSA's voice using an LLM, and writes enriched fields back to Payload. Two-tier model: Tier 1 stays (featured/editor's picks) receive rich descriptions, area guides, FAQs, and 5 gallery images; Tier 2 stays receive extended descriptions and 2-3 gallery images. Includes confidence scoring and a pilot run before scaling to all 231 stays.

---

## Problem Frame

UniqueStaysUSA has 231 listing detail pages that are structurally beautiful but content-thin. Every stay has a short description (~215 characters on average — closer to a tagline than a rich editorial write-up). Zero stays have editor notes, bestFor, bestSeason, vibe, or gallery images populated. The detail page template renders all these fields, but they display fallbacks or "—" instead of meaningful content.

This creates three compounding problems. For SEO, thin pages don't rank for long-tail queries ("treehouse near Joshua Tree restaurants") and provide no structured answers for AI-generated search (AEO/GEO). For users, the detail page can't do its job — a traveler lands from Google, sees a sentence and a single photo, and bounces to the platform listing before the editorial experience has a chance to build trust or differentiate. For conversion, the affiliate click-through happens from a position of information poverty rather than informed enthusiasm.

The data is already half-there: every stay has a title, location, category, tags, platform URL, and a short description. The platform listings themselves contain rich host descriptions, amenity lists, neighborhood info, and dozens of photos. The gap is a pipeline that extracts those facts and transforms them into editorial content matching the brand voice.

---

## Actors

- A1. **Enrichment script**: CLI batch process that orchestrates scraping, generation, and writing for each stay
- A2. **Admin (Jon)**: Reviews pilot output, spot-checks Tier 1 stays after full batch, tunes prompts based on quality

---

## Key Flows

- F1. **Pilot enrichment**
  - **Trigger:** Admin runs the script with a `--pilot` flag and a list of 10 stay slugs
  - **Actors:** A1, A2
  - **Steps:** (1) Script fetches each stay from Payload, (2) scrapes the platform listing via Firecrawl, (3) extracts factual data and images, (4) generates editorial content via LLM, (5) assigns confidence scores per field, (6) writes to Payload and outputs a quality report. Admin reviews the 10 enriched stays in browser, identifies voice/accuracy issues, and tunes the prompt.
  - **Outcome:** Prompt validated, confidence thresholds calibrated, pipeline ready for full batch
  - **Covered by:** R1, R2, R3, R4, R5, R7, R8

- F2. **Full batch enrichment**
  - **Trigger:** Admin runs the script without `--pilot`, targeting all 231 stays
  - **Actors:** A1, A2
  - **Steps:** (1) Script queries all stays from Payload, (2) processes each stay through scrape-generate-write pipeline, (3) applies tier-specific content depth (Tier 1 full, Tier 2 light), (4) flags low-confidence outputs, (5) outputs summary report with per-stay confidence scores. Admin reviews all Tier 1 stays and any flagged Tier 2 stays.
  - **Outcome:** All 231 stays enriched with editorial content and gallery images
  - **Covered by:** R1, R2, R3, R4, R5, R6, R7, R8, R9

---

## Requirements

**Scraping and data extraction**

- R1. For each stay, scrape the platform listing page (via `affiliateUrl`) using Firecrawl to extract: host-written description, full amenity list, neighborhood/area information, and listing photos
- R2. Download the top N listing photos (5 for Tier 1, 2-3 for Tier 2), filtering out low-quality or duplicate images, and upload them to the Payload Media collection
- R3. Handle scraping failures gracefully — if a platform page is unreachable, blocked, or returns insufficient data, log the failure and continue with remaining stays rather than aborting the batch

**Content generation**

- R4. Generate editorial content in UniqueStaysUSA's brand voice (warm, first-person, slightly literary — "The Wanderer's Postcard Collection") using scraped facts plus the stay's existing metadata (title, location, category, tags, description)
- R5. For Tier 1 stays, generate all four content types: rich property description (2-3 paragraphs in a new body field, with the existing short description preserved as summary), area/neighborhood guide (1-2 paragraphs), 3-5 FAQ pairs for AEO, and populate the editorial metadata fields (editorNote, bestFor, bestSeason, vibe)
- R6. For Tier 2 stays, generate an extended property description (1-2 paragraphs in the new body field, existing short description preserved) and populate editorial metadata fields (bestFor, bestSeason, vibe). Area guides and FAQs are not generated for Tier 2
- R7. Assign a confidence score (high/medium/low) to each generated field based on the richness of source data available — stays with minimal scraped data should receive lower confidence scores

**Pipeline execution**

- R8. The pipeline runs as a CLI batch script that can be executed incrementally (skip stays already enriched) or with a `--force` flag to re-enrich
- R9. Tier assignment is automatic: any stay with `featured=true` or `editorsPick=true` is Tier 1; all others are Tier 2
- R10. The script outputs a structured report summarizing: total stays processed, successes/failures, per-stay confidence scores, and any stays flagged for manual review

**Data writing**

- R11. Generated content writes directly to the live Payload stay record (no draft layer) via the existing REST API upsert pattern
- R12. Gallery images are stored using the existing `galleryImages` array field on the Stays collection, with images uploaded as Media records

---

## Acceptance Examples

- AE1. **Covers R5, R6.** Given a Tier 1 stay (featured treehouse in Joshua Tree), when the script processes it, the stay record is updated with a 2-3 paragraph description, a neighborhood guide referencing nearby attractions, 5 FAQ pairs, populated editorNote/bestFor/bestSeason/vibe fields, and 5 gallery images. Given a Tier 2 stay (non-featured cabin in Vermont), the script generates a 1-2 paragraph description and editorial metadata but no area guide or FAQs, with 3 gallery images.

- AE2. **Covers R3, R7.** Given a stay whose VRBO listing page is blocked by anti-bot protection, the script logs the failure with the stay slug and error details, assigns "low" confidence to all fields, and continues processing the next stay. The stay is included in the report as "failed — flagged for manual review."

- AE3. **Covers R8, R9.** Given the script is run a second time without `--force`, all 231 stays are skipped because enrichment fields are already populated. Given the script is run with `--force`, all stays are re-enriched regardless of existing content.

---

## Success Criteria

- All 231 stays have populated editorial fields (editorNote, bestFor, bestSeason, vibe) and at least one gallery image after the pipeline runs
- Tier 1 stays have rich descriptions, area guides, and FAQs that read as natural editorial content consistent with the brand voice — not obviously AI-generated
- A Google search for a sample Tier 1 stay's title returns the detail page with FAQ content eligible for featured snippets
- The pipeline is re-runnable without side effects (idempotent on re-run, or controllable via flags)
- Admin can identify quality issues from the confidence report without reviewing every stay individually

---

## Scope Boundaries

- No draft/publish review workflow or admin UI — content writes directly to live fields
- No automated re-enrichment or scheduled re-runs — this is a one-time batch with manual re-run capability
- No conversion tracking, A/B testing, or analytics integration for measuring enrichment impact
- No structured data / JSON-LD schema changes — separate SEO work
- No changes to the detail page layout or components — the current template already renders all target fields
- No video content, virtual tours, or user-generated content
- No enrichment of blog posts or journal content — only Stays collection

---

## Key Decisions

- **Hybrid over pure-AI:** Scraping platform listings for factual data produces more accurate, specific content than asking an LLM to invent details from a title and location alone. The editorial voice transformation ensures brand consistency over raw scraped text.
- **Two tiers over uniform treatment:** Featured and editor's pick stays are the shop window — they justify deeper investment. The long tail still benefits from better descriptions and a few images without requiring area guides and FAQs for every listing.
- **Direct write over draft layer:** A draft/publish workflow would add schema complexity and admin UI work disproportionate to the team size (solo). The confidence scoring + pilot run provides sufficient quality control.
- **Scrape and host images:** Accepting the TOS risk in exchange for a better user experience (fast-loading, controlled images). If a platform flags this in the future, images can be removed or replaced without affecting the text pipeline.
- **Short + long description architecture:** The existing `description` field (avg ~215 chars) is preserved as the summary/meta description for cards, social sharing, and SEO meta. A new rich text field holds the generated editorial body content for detail pages. This avoids losing the well-sized summaries while adding the depth needed for ranking and engagement.

---

## Dependencies / Assumptions

- Firecrawl can successfully scrape Airbnb and VRBO listing pages at scale (231 pages). If rate-limited, the script needs configurable delays between requests.
- Platform CDN image URLs are stable enough to download during the script run. If URLs expire quickly, the scrape-and-download must happen in the same pass.
- The Payload REST API key auth pattern documented in AGENTS.md is functional for batch writes.
- The existing `galleryImages` array field (with `image` upload and `imageUrl` text sub-fields) is sufficient for storing enriched images without schema changes.
- Tier 1 is defined as `featured=true OR editorsPick=true`. If the user wants different criteria, this can be parameterized.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R4][Technical] Which LLM model and prompt structure to use for editorial generation — needs research into cost/quality tradeoff across 231 stays
- [Affects R2][Technical] Image quality filtering criteria — what constitutes a "low-quality" image to filter out during download
- [Affects R1][Needs research] Firecrawl rate limits and optimal delay configuration for scraping 231 Airbnb/VRBO pages without triggering blocks
- [Affects R11][Technical] Whether new schema fields are needed for `areaGuide` and `faqs`, or if existing rich text fields can be repurposed
