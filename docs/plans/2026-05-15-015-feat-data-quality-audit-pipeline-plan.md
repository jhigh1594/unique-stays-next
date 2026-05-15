---
title: "feat: Nightly Data Quality Audit Pipeline"
type: feat
status: active
date: 2026-05-15
---

# feat: Nightly Data Quality Audit Pipeline

## Summary

A nightly Vercel cron that selects 25-50 stays, scrapes their live listing pages via Firecrawl, compares scraped data against Payload records, and writes discrepancy reports to a new `audit-reports` Payload collection with admin review UI and Resend email digest.

---

## Problem Frame

UniqueStaysUSA is an affiliate directory — revenue depends on every listing having a working affiliate link, accurate title, current price, and valid hero image. Today there is no automated check. Dead links silently lose conversions. Stale images/titles erode trust. Wrong prices create complaints. The discovery pipeline (Exa + Firecrawl) finds new stays, but nothing validates that existing stays are still accurate.

Two prior incidents prove this is a real problem: 24 stays had wrong hero images (required `fix-hero-images.ts`), and 22 stays had dead or placeholder affiliate URLs (required `fix-affiliate-urls.ts` + `fix-affiliate-urls-bing.ts`).

---

## Requirements

- R1. Nightly automated check of 25-50 existing stays against their live listing pages on Airbnb, VRBO, and Wander
- R2. Detect dead or redirected affiliate URLs (HTTP status + content check)
- R3. Detect title drift — scraped title significantly different from stored title
- R4. Detect price drift — scraped price significantly different from stored price
- R5. Detect hero image changes — scraped primary image URL different from stored imageUrl
- R6. Detect delisted/unavailable listings — listing page returns 404, removed notice, or redirects to search
- R7. Write results to a `audit-reports` Payload collection with per-stay findings, severity, and comparison details
- R8. Admin UI shows audit report list (newest first) with status badges, severity indicators, and stay link
- R9. Resend email digest summarizing nightly results: total checked, issues found by severity, direct link to admin
- R10. Graceful failure handling — individual scrape failures don't abort the batch; failures are logged in the report

---

## Scope Boundaries

- No auto-fixing — report only
- No re-scraping or updating images, titles, or prices
- No availability calendar or real-time pricing checks
- No SEO ranking or Google index monitoring
- No fix scripts for discovered issues (separate follow-up task)
- No changes to public-facing site components

### Deferred to Follow-Up Work

- Fix scripts for common audit findings (dead URL correction, image refresh) — separate PR after audit pipeline proves stable
- Automated re-enrichment trigger based on audit severity — future iteration

---

## Context & Research

### Relevant Code and Patterns

- `vercel.json` — cron definitions; add alongside existing `/keep-alive` and `/api/discover` entries
- `src/app/api/discover/route.ts` — Vercel cron route handler pattern: `POST`, `maxDuration = 60`, `CRON_SECRET` Bearer auth
- `src/lib/discovery/notify.ts` — Resend notification pattern: lazy import, `RESEND_API_KEY` env, `notifications@uniquestaysusa.com` sender
- `scripts/lib/scraper.ts` — Firecrawl client init and scrape pattern: `new Firecrawl({ apiKey })`, `client.scrape(url, { formats })`, photo URL extraction
- `src/collections/CandidateStays.ts` — Collection pattern: admin UI config, hooks, access control, status select field
- `src/collections/Stays.ts` — `needsReview` + `reviewReason` fields (existing flags, not used by this plan)
- `scripts/fix-hero-images.ts` — Prior image fix pattern with Firecrawl scraping + Vercel Blob upload
- `scripts/fix-affiliate-urls-bing.ts` — Prior URL fix pattern with multi-strategy scraping

### Institutional Learnings

- Hero images must go through Vercel Blob `put()`, not Payload media upload alone (see memory: `project_hero_image_blob_requirement.md`)
- Silent catch blocks hide failures — audit pipeline must log every scrape outcome explicitly (see `docs/solutions/runtime-errors/search-broken-gitignored-index-file-2026-05-14.md`)
- Firecrawl `scrape` (single URL) works for individual listing pages; `search`/`crawl` failed on Airbnb/VRBO search pages
- Airbnb image URLs use `muscache.com` CDN patterns — useful for image validation
- All existing scraping scripts enforce 3-5 second delays between requests and exponential backoff on 429s

### External References

- Firecrawl scrape API with schema extraction: `firecrawl.dev` docs — structured JSON output from any URL
- Firecrawl `--schema` option for extracting specific fields from scraped pages

---

## Key Technical Decisions

- **Separate `audit-reports` collection over `stays.needsReview` flag**: Audit reports need history, trending, and batch tracking. The existing `needsReview` flag is a single boolean per stay with no audit trail. A separate collection preserves the full report timeline.
- **Two-tier checking: HTTP fetch then Firecrawl**: Dead-link detection uses a free lightweight `fetch` (status code + redirect check). Content comparison (title, price, image) uses Firecrawl's `scrape` with schema extraction. This minimizes Firecrawl credit spend — dead links are caught cheaply.
- **Firecrawl schema extraction over regex parsing**: Firecrawl's structured JSON extraction (schema parameter) returns `{title, price, imageUrl, available, listingActive}` directly. More reliable than regex on markdown/HTML, especially across three different platform DOMs.
- **25-50 stays per run (configurable)**: Balances credit spend against coverage. At ~50 credits/night, the pipeline costs negligible Firecrawl credits. Full collection (~250 stays) cycles through every 5-10 days.
- **Selection strategy: oldest-audited-first + random**: Prioritize stays never audited, then longest-since-last-audit, with randomness to avoid predictable scraping patterns.
- **Report-only, no auto-fix**: Auto-fixing data requires human judgment (is the new title better? is the new image appropriate?). The audit flags issues; the curator decides.

---

## Open Questions

### Resolved During Planning

- **Scraping tool**: Firecrawl `scrape` endpoint for individual listing pages. Proven to work for this use case in `scripts/fix-hero-images.ts`.
- **Collection vs flag**: Separate `audit-reports` collection. Rationale: history, trending, batch tracking.
- **Notification**: Resend email digest, same pattern as discovery pipeline.

### Deferred to Implementation

- **Exact title similarity threshold**: What Levenshtein distance or semantic similarity score constitutes "drift" vs minor formatting changes. Tunable after first few runs.
- **Exact price drift threshold**: Percentage difference that triggers a warning. 20%? 30%? Tunable.
- **Firecrawl schema per platform**: Whether Airbnb/VRBO/Wander need different extraction schemas or one unified schema works. Test during implementation.

---

## Implementation Units

### U1. Create `audit-reports` Payload Collection + Migration

**Goal:** Define the `audit-reports` collection schema and create the database migration.

**Requirements:** R7, R8

**Dependencies:** None

**Files:**
- Create: `src/collections/AuditReports.ts`
- Modify: `src/payload.config.ts` (register collection)
- Create: `src/migrations/20260515_015_audit_reports.ts`
- Create: `src/migrations/20260515_015_audit_reports.json`
- Modify: `src/migrations/index.ts` (register migration)
- Test: None (schema + migration — verified by `pnpm generate:types && pnpm migrate`)

**Approach:**
- Collection fields: `runId` (text, groups reports from same cron run), `stay` (relationship to stays), `staySlug`/`stayTitle` (denormalized for admin list view), `status` (select: `pending`/`reviewed`/`resolved`), `severity` (select: `info`/`warning`/`critical`), `findings` (array of typed findings — field, expected, actual, severity), `checkedAt` (date), `resolvedAt` (date), `resolvedBy` (text)
- Admin UI: list view sorted by `checkedAt` desc, filterable by severity and status, searchable by stay title
- Access: admin-only (same pattern as CandidateStays)
- Migration adds the table with indexes on `runId`, `stay`, `severity`, `checkedAt`

**Patterns to follow:**
- `src/collections/CandidateStays.ts` — collection structure, admin config, access control
- Existing migrations in `src/migrations/` — migration file structure

**Test expectation:** none — schema and migration. Verified by `pnpm generate:types` compiling and `pnpm migrate` succeeding.

**Verification:**
- `pnpm generate:types` succeeds with `AuditReport` type in `src/payload-types.ts`
- `pnpm migrate` creates the `audit_reports` table
- Payload admin shows the collection

---

### U2. Build Audit Engine Core

**Goal:** Create the audit logic that selects stays, scrapes listing pages, compares data, and produces findings.

**Requirements:** R1, R2, R3, R4, R5, R6, R10

**Dependencies:** U1

**Files:**
- Create: `src/lib/audit/select-stays.ts` — stay selection strategy
- Create: `src/lib/audit/check-liveness.ts` — HTTP fetch dead-link detection
- Create: `src/lib/audit/scrape-listing.ts` — Firecrawl scrape with schema extraction
- Create: `src/lib/audit/compare.ts` — comparison logic (title, price, image, availability)
- Create: `src/lib/audit/types.ts` — shared types for findings, audit results
- Create: `src/lib/audit/run-audit.ts` — orchestrator: select → check → scrape → compare → write reports
- Test: `src/lib/audit/__tests__/compare.test.ts`

**Approach:**

1. **`select-stays.ts`**: Query Payload for stays, prioritizing never-audited then oldest-audited. Accept `limit` param (default 40). Track last-audited date via a query on `audit-reports` collection.

2. **`check-liveness.ts`**: `fetch(affiliateUrl, { method: 'HEAD', redirect: 'follow' })`. Check status code, detect redirects to search pages (Airbnb redirects removed listings to `/search`). Return `LivenessResult` with status and redirect URL.

3. **`scrape-listing.ts`**: Firecrawl `scrape` with schema extraction. Schema: `{ title: string, price: number, imageUrl: string, available: boolean, listingActive: boolean }`. Enforce 3-5 second delay between requests. Retry on 429 with exponential backoff. Return `ScrapedData` or error.

4. **`compare.ts`**: Pure functions comparing stored vs scraped data:
   - Title: normalized string comparison (lowercase, trimmed, punctuation-stripped). Flag if similarity < threshold.
   - Price: percentage difference. Flag if > configurable threshold.
   - Image: URL string comparison. Flag if different (info severity — image changes are normal).
   - Availability: flag if `listingActive === false` or `available === false` (critical).
   Returns array of `Finding` objects with field, expected, actual, severity.

5. **`run-audit.ts`**: Orchestrator. Selects stays → runs liveness check → if live, runs Firecrawl scrape → runs comparison → writes `audit-report` records via Payload Local API → returns summary.

**Patterns to follow:**
- `src/lib/discovery/discoverer.ts` — Exa search + Firecrawl orchestration pattern
- `scripts/lib/scraper.ts` — Firecrawl client init, delay/backoff patterns
- `src/lib/discovery/notify.ts` — error handling pattern (return result objects, no thrown errors)

**Test scenarios:**
- Happy path: matching title and price produces empty findings array
- Happy path: matching data with minor formatting difference (extra space, different case) produces no findings
- Edge case: empty scraped data (Firecrawl returned nothing) produces critical findings for all fields
- Edge case: null/undefined stored price produces info finding (cannot compare)
- Error path: price string "$285/night" parsed to number 285 — handles non-numeric price formats
- Integration: full compare pipeline with mocked scraped data produces correct severity assignments

**Verification:**
- Unit tests pass for comparison logic
- `run-audit.ts` can be imported without errors
- Types compile cleanly

---

### U3. Create API Route + Vercel Cron

**Goal:** Wire the audit engine to a nightly Vercel cron job.

**Requirements:** R1, R10

**Dependencies:** U1, U2

**Files:**
- Create: `src/app/api/audit/route.ts`
- Modify: `vercel.json` (add cron entry)

**Approach:**
- `POST` handler, `maxDuration = 60`
- Auth: `CRON_SECRET` Bearer token (same pattern as `/api/discover`)
- Initialize Payload via `getPayload({ config })`
- Call `runAudit(payload, { limit: 40 })` from `src/lib/audit/run-audit.ts`
- Return JSON summary: `{ checked: N, issues: M, critical: K, reportId: string }`
- Cron schedule: `0 6 * * *` (6 AM UTC, after discovery pipeline at 5:03 AM)
- Accept optional `limit` query param and `force` param (for manual triggering)

**Patterns to follow:**
- `src/app/api/discover/route.ts` — identical cron route handler structure

**Test expectation:** none — API route wiring. Verified by manual cron trigger and Payload admin results.

**Verification:**
- `curl -X POST http://localhost:3000/api/audit -H "Authorization: Bearer $CRON_SECRET"` returns audit summary
- `audit-reports` collection populated with findings
- Vercel cron config valid (`vercel.json` parses)

---

### U4. Email Notification Digest

**Goal:** Send a nightly Resend email summarizing audit results.

**Requirements:** R9

**Dependencies:** U2

**Files:**
- Create: `src/lib/audit/notify.ts`
- Modify: `src/lib/audit/run-audit.ts` (call notify after audit completes)

**Approach:**
- Same pattern as `src/lib/discovery/notify.ts`: lazy Resend import, `notifications@uniquestaysusa.com` sender, `NOTIFICATION_EMAIL` env recipient
- Email content: "Data Quality Audit — {date}" subject, summary stats (checked, issues by severity), top critical findings with stay title + issue, direct link to admin audit reports filtered by run
- Only send if issues found — skip email on clean runs
- Called from `run-audit.ts` after all reports written

**Patterns to follow:**
- `src/lib/discovery/notify.ts` — Resend integration, error handling, email template structure

**Test expectation:** none — email notification. Verified by manual trigger and inbox check.

**Verification:**
- Manual cron trigger with at least one finding produces email in inbox
- Clean run (no findings) produces no email

---

## System-Wide Impact

- **Interaction graph:** New cron adds a third scheduled job alongside `/keep-alive` and `/api/discover`. No interaction with existing crons — runs after discovery completes.
- **Error propagation:** Individual scrape failures are logged per-stay in the audit report; the batch continues. Total failure (Payload init error) returns 500 from the route handler.
- **State lifecycle:** Each cron run creates a batch of `audit-report` records grouped by `runId`. No partial-write concern — each stay's report is independent. No cache invalidation needed (admin-only collection, no public routes).
- **API surface parity:** No public API changes. New collection is admin-only.
- **Integration coverage:** Cron trigger → Payload init → stay selection → HTTP fetch → Firecrawl scrape → comparison → report write → email. End-to-end verified by manual trigger.
- **Unchanged invariants:** `stays` collection is read-only during audit. No mutations to stay records. The `needsReview` flag on stays is NOT set by this pipeline.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Firecrawl blocked by Airbnb/VRBO on listing pages | Proven to work in `fix-hero-images.ts` (individual pages, not search). If blocked, fall back to liveness-only check and flag for manual review. |
| Firecrawl credit spend | 40 pages/night at ~1 credit each = negligible. Two-tier check (HTTP fetch first) reduces Firecrawl calls for dead links. |
| Scraping rate limits | 3-5 second delays between requests, exponential backoff on 429s. Same pattern as all existing scrapers. |
| Schema extraction accuracy across platforms | Schema may need per-platform tuning. Start with unified schema, iterate based on first few runs. Deferred to implementation. |
| False positives (minor title formatting differences) | Comparison uses normalized strings and configurable thresholds. Tunable after initial runs. |
| Vercel serverless timeout (60s) | 40 stays × ~4s average (including delay) = ~160s. May need to reduce batch size or increase delays. Monitor first run. |

---

## Documentation / Operational Notes

- Add `FIRECRAWL_API_KEY` to Vercel env vars if not already present (already used by discovery pipeline)
- `CRON_SECRET` already configured
- `RESEND_API_KEY` and `NOTIFICATION_EMAIL` already configured (used by discovery pipeline notifications)
- First run should be manual (`curl` trigger) with small `limit=5` to validate before enabling nightly cron
- After first successful nightly run, tune comparison thresholds based on false positive rate

---

## Sources & References

- Related code: `src/lib/discovery/` (discovery pipeline patterns)
- Related code: `scripts/fix-hero-images.ts` (image validation pattern)
- Related code: `scripts/fix-affiliate-urls-bing.ts` (URL validation pattern)
- Prior incident: `docs/solutions/runtime-errors/search-broken-gitignored-index-file-2026-05-14.md` (silent failure lesson)
- Origin brainstorm: `docs/brainstorms/discovery-pipeline-requirements.md` (related but distinct — discovery vs audit)
