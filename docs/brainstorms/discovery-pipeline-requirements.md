---
date: 2026-05-14
topic: stay-discovery-pipeline
---

# Stay Discovery Pipeline

## Summary

A nightly automated pipeline that discovers new unique stays across Airbnb, VRBO, and Wander, pre-filters them with LLM novelty scoring, and surfaces 15-20 candidates in a Payload admin review queue for human curation. Approved candidates are promoted to the live `stays` collection and optionally routed through the existing enrichment pipeline for editorial content generation. Email notifications alert the curator when new candidates are ready for review.

---

## Problem Frame

UniqueStaysUSA's value compounds with every quality listing added. Today, discovering and importing new stays is a manual process: Jon searches platforms, evaluates listings one-by-one, and manually creates stay records. This doesn't scale — the collection stays static while competitors with larger catalogs rank for more long-tail queries and serve more traveler intents.

The directory already has an enrichment pipeline (`scripts/enrich-stays.ts`) that takes existing stays and fills in editorial content. What's missing is the upstream discovery step: finding *new* stays worth adding. This pipeline closes that gap by automating discovery, pre-filtering for experience novelty, and presenting a curated queue for nightly human review.

---

## Actors

- A1. **Discovery script**: Scheduled CLI process that crawls platforms, scores candidates, deduplicates, and writes to the candidate queue
- A2. **Curator (Jon)**: Reviews 15-20 candidates per night in Payload admin, approves or rejects each one

---

## Key Flows

- F1. **Nightly discovery run**
  - **Trigger:** Scheduled execution (cron or manual)
  - **Actors:** A1
  - **Steps:** (1) Script crawls configured platform sources, (2) extracts listing data (title, location, description, photos, price, rating, URL), (3) deduplicates against existing stays and pending candidates by platform listing URL, (4) passes each new listing through LLM novelty scoring, (5) ranks by score and selects top 15-20 candidates, (6) writes candidates to `candidate-stays` collection, (7) sends email notification to curator.
  - **Outcome:** 15-20 pre-filtered candidates appear in admin review queue
  - **Covered by:** R1, R2, R3, R4, R5, R6, R7

- F2. **Curation review**
  - **Trigger:** Curator opens admin review queue (prompted by email notification)
  - **Actors:** A2
  - **Steps:** (1) Curator reviews each candidate's photos, description, location, and novelty score, (2) approves candidates that meet the experience-novelty bar, (3) rejects candidates that don't fit the collection, (4) approved candidates are promoted to the `stays` collection with status `draft` or published directly based on curator preference.
  - **Outcome:** New stays added to the directory
  - **Covered by:** R8, R9

- F3. **Post-approval enrichment**
  - **Trigger:** Candidate promoted to `stays` collection
  - **Actors:** A1 (enrichment pipeline, already exists)
  - **Steps:** Existing enrichment pipeline processes the new stay for editorial content, gallery images, and metadata.
  - **Outcome:** Newly approved stay has full editorial content
  - **Covered by:** R10

---

## Requirements

### Discovery and scraping

- R1. The pipeline crawls multiple platform sources on each run: Airbnb (search results for configured queries), VRBO (search results for configured queries), and Wander (explore/catalog pages, treated as a regular recurring crawl source given its large catalog of 1000s of properties)
- R2. For each discovered listing, extract: title, location (city, state), description, platform URL, primary image URL, price, rating, review count, and any available amenity/feature data
- R3. Handle scraping failures gracefully — if a platform page is unreachable, blocked, or returns insufficient data, log the failure and continue. Do not abort the batch for individual failures

### Filtering and scoring

- R4. Deduplicate discovered listings against existing `stays` records and existing `candidate-stays` records by platform listing URL. A listing that already exists in either collection is skipped
- R5. Pass each new listing through an LLM novelty scorer that evaluates "experience novelty" — treehouses, domes, caves, lighthouses, yurts, converted spaces, and architecturally distinctive properties score high; generic cabins and standard vacation rentals score low
- R6. From the scored pool, select the top 15-20 candidates per run. If fewer than 15 novel candidates are found, include only those that pass the novelty threshold (do not pad with low-quality listings)

### Candidate storage and admin queue

- R7. Write selected candidates to a `candidate-stays` Payload collection with fields: platform listing URL, title, location, description, primary image URL, price, rating, review count, novelty score, source platform, discovery date, and status (`pending`, `approved`, `rejected`)
- R8. Provide a Payload admin list view for `candidate-stays` sorted by discovery date (newest first), with inline status badges and batch actions (approve, reject). Each candidate detail view shows the listing image, full description, location, novelty score, and a direct link to the platform listing
- R9. When a curator approves a candidate, promote it to the `stays` collection with all available data mapped to stay fields (title, location, description, price, rating, platform, affiliateUrl, imageUrl, etc.). Category, spokes, and other editorial fields are left for manual assignment or enrichment pipeline processing

### Notification

- R10. After each discovery run completes, send an email notification to the curator via Resend summarizing: number of new candidates, top 3 by novelty score with thumbnail and title, and a direct link to the admin review queue. Only send if new candidates were found (skip notification on zero-result runs)

### Integration with existing enrichment

- R11. Approved candidates promoted to `stays` are eligible for the existing enrichment pipeline (`scripts/enrich-stays.ts`). The enrichment pipeline's incremental mode (`--force` not set) naturally picks up new stays that haven't been enriched yet

---

## Acceptance Examples

- AE1. **Covers R1, R5, R6.** Given a nightly run crawling Airbnb searches for "treehouse Vermont" and "dome Arizona," plus Wander's explore pages, the script discovers 40 listings, deduplicates 12 that already exist, scores the remaining 28 for novelty, and writes the top 18 candidates to the review queue. The LLM scorer assigns high novelty to a treehouse with a stargazing deck and low novelty to a standard ski condo.

- AE2. **Covers R3, R4.** Given a run where VRBO returns a rate-limit error on the third search query, the script logs the failure, continues with remaining sources, and still produces candidates from Airbnb and Wander. Any listing whose URL already appears in the `stays` collection is silently skipped.

- AE3. **Covers R8, R9.** Given 15 candidates in the admin queue, Jon opens the `candidate-stays` list view, reviews each with image and description visible, approves 8 and rejects 7. The 8 approved candidates are created as new `stays` records with title, location, description, price, platform, and affiliateUrl populated. Category and spokes are unset, ready for manual assignment or enrichment.

- AE4. **Covers R10.** After the nightly run produces 18 candidates, Resend delivers an email to Jon showing "18 new stay candidates" with thumbnails of the top 3 and a link to the admin queue. On a night where no new candidates pass the novelty threshold, no email is sent.

---

## Success Criteria

- The pipeline reliably discovers 15-20 novel stay candidates per night across all three platforms
- Jon spends 10-15 minutes per night on curation (review + approve/reject), not manual searching
- Approved candidates flow into `stays` with enough data to render on the directory immediately after enrichment
- The collection grows by 5-10 net new stays per week (accounting for rejection rate)
- Zero duplicate stays created (dedup by platform URL is reliable)

---

## Scope Boundaries

- No automated publishing — curator approval is always required before a candidate becomes a live stay
- No re-enrichment or content updates for existing stays — that's the enrichment pipeline's job
- No price monitoring, availability tracking, or listing change detection for existing stays
- No user-facing review queue or community submissions — this is admin-only
- No scraping of booking availability calendars or real-time pricing
- No changes to the public-facing site layout or components

---

## Key Decisions

- **Scheduled crawl over reactive ingestion:** The pipeline runs on a schedule rather than monitoring for new listings in real-time. Vacation rental inventory changes slowly enough that nightly discovery is sufficient, and scheduled crawls are simpler to build, debug, and rate-limit.
- **LLM pre-filter over raw dump:** Surfacing 15-20 pre-scored candidates is better than dumping 100+ unfiltered listings for Jon to sort through. The LLM novelty scorer acts as a first pass, reducing curator cognitive load while keeping the final curation decision human.
- **Admin UI queue over email-only review:** Experience novelty curation requires seeing photos, descriptions, and location context — richer than email can convey well. The admin queue also provides persistence, batch actions, and status tracking that email replies can't. Email serves as notification only.
- **Separate collection over status flag:** A dedicated `candidate-stays` collection keeps the review queue isolated from the live `stays` collection. No risk of unreviewed candidates appearing on the public site. Dedup can check both collections independently.
- **Wander as regular source:** Wander has 1000s of properties across many states, making it a substantial ongoing discovery source — not a one-time sync. The pipeline crawls Wander's explore/catalog pages on each run alongside Airbnb and VRBO.

---

## Dependencies / Assumptions

- Firecrawl can scrape Airbnb search results, VRBO search results, and Wander explore pages. If any platform blocks scraping, that source degrades gracefully (other sources continue).
- The LLM novelty scorer can consistently distinguish "experience novel" properties (treehouses, domes, caves, lighthouses) from "nice but standard" properties (well-designed cabins, upscale condos) based on listing title, description, and photos.
- Resend is integrated for email notifications. The project does not currently use Resend — this is a new dependency.
- The Payload REST API supports creating a new `candidate-stays` collection with custom admin views. This requires a schema change and migration.
- Wander's explore pages expose enough listing data (title, location, image, price) through scraping to populate candidate records. If Wander has an API, that's preferable to scraping.
- The existing enrichment pipeline can process newly promoted stays without modification — its incremental mode picks up un-enriched stays by default.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R1][Technical] Exact crawl strategy per platform — which Airbnb/VRBO search queries, how to paginate Wander's catalog, configurable vs hardcoded
- [Affects R5][Technical] LLM model selection and prompt design for novelty scoring — cost/quality/latency tradeoff across 40-100 listings per run
- [Affects R8][Technical] `candidate-stays` collection schema and admin view customization in Payload
- [Affects R10][Technical] Resend integration pattern — API key management, email template, error handling
- [Affects R9][Technical] Field mapping from candidate to stay — which fields carry over, which need manual input, how category/spoke assignment works post-approval
