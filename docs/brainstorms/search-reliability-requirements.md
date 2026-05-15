---
date: 2026-05-14
topic: search-reliability
---

# Search Reliability Overhaul

## Summary

Replace the broken NVIDIA NIM semantic search pipeline with a zero-cost, client-side fuzzy keyword search powered by Payload CMS data. Search must work instantly on every deploy with no external API dependencies, cover both collection and spoke pages, and never silently fail.

---

## Problem Frame

The site's AI search returns zero results for every query on production. The root cause is architectural: the search index file (`data/search-index.json`) is gitignored and never deploys to Vercel, so the API route's `readFileSync` throws on every request. The catch block returns `{ ids: null }` with no logging, making the failure invisible.

Even if fixed, the NIM pipeline has three independent failure modes (missing index, missing API key, API outage), requires manual index regeneration on every content change, and depends on a free-tier external API with rate limits. For a directory of ~250 stays, this operational fragility is unjustified.

---

## Requirements

**Build-time index generation**

- R1. A build-time step generates a client-side search index from all published stays via Payload CMS, containing searchable text fields (title, location, state, category, tags, description, region, spoke labels).
- R2. The index regenerates automatically on every deploy (no manual `pnpm index:search` step).
- R3. The index is small enough to embed in the page without impacting load performance.

**Client-side search**

- R4. Search executes entirely client-side with no API calls — results are instant.
- R5. Search supports fuzzy matching that tolerates typos and partial words (e.g., "trehouse" matches "treehouse").
- R6. Search matches across all relevant stay fields: title, location, state, category label, tag names, and description.
- R7. Search works identically on the collection page and all spoke pages (currently spoke pages use basic `.includes()` with no fuzzy matching).

**Reliability and error handling**

- R8. Search has zero external API dependencies at runtime. No network call can fail.
- R9. If the search index fails to load or initialize, the UI shows a clear message rather than silently returning no results.
- R10. Search degrades gracefully — keyword filtering via the existing FilterEngine (categories, regions, price range) continues to work even if fuzzy search is unavailable.

**NIM pipeline removal**

- R11. The NVIDIA NIM search pipeline is fully removed: `scripts/generate-search-index.ts`, `src/app/api/search/route.ts`, `data/search-index.json`, the `NVIDIA_NIM_API_KEY` env var dependency, and the `index:search` npm script.
- R12. The `isNaturalLanguage()` routing logic in FilterEngine is removed — all queries go through the same unified search path.

---

## Acceptance Examples

- AE1. **Covers R1, R4, R5.** Given the collection page is loaded, when a user types "trehouse calfornia", results for treehouses in California appear within 100ms with no network request.
- AE2. **Covers R7.** Given the user is on the `/pet-friendly` spoke page, when they type "cabin vermnt", matching pet-friendly cabins in Vermont appear.
- AE3. **Covers R8, R9.** Given the search index fails to initialize, the filter bar displays an inline message like "Search unavailable — use filters below" and category/region/price filters still work.
- AE4. **Covers R11.** Given the NIM pipeline is removed, a grep for "NVIDIA_NIM" across the codebase returns zero results in `src/` and `scripts/`.

---

## Success Criteria

- Searching "treehouses in California" on production returns relevant results.
- Every query type (short keywords, typos, multi-word phrases) returns results or a clear "no matches" state — never a silent empty return.
- No external API key is needed for search to work.
- The search index is always current with published stays (no manual regeneration step).

---

## Scope Boundaries

- No server-side semantic or embedding-based search (NIM, OpenAI, pgvector).
- No managed search services (Algolia, Typesense, Meilisearch).
- No search across blog posts or journal content (stays only).
- No search analytics, query tracking, or "did you mean" suggestions.
- No AI-powered query rewriting or natural language understanding.

---

## Key Decisions

- **Client-side over server-side search:** For ~250-500 stays, client-side fuzzy search eliminates all runtime failure modes and delivers instant results. The data size is small enough that no server round-trip is justified.
- **Remove NIM entirely rather than fix it:** The NIM pipeline has three independent failure modes that all fail silently. Even fixed, it requires manual maintenance and an external API key. The operational cost exceeds the value of semantic matching for a small directory.
- **Unified search path for all pages:** Currently the collection page and spoke pages use different search implementations. Unifying on one approach reduces maintenance and ensures consistent behavior.

---

## Dependencies / Assumptions

- The stay count remains under ~1000 for the foreseeable future. If it grows significantly, client-side search may need revisiting.
- Payload CMS data is available at build time for index generation (already true — the collection page fetches all stays server-side).
- The existing FilterEngine's filter pipeline (categories, regions, price, spoke-specific filters) continues to layer on top of search results unchanged.
