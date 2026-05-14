---
title: "feat: Unified FilterEngine — best-in-class stay discovery UX"
type: feat
status: active
date: 2026-05-12
---

# feat: Unified FilterEngine — best-in-class stay discovery UX

## Summary

Replace two diverged filter implementations (`DirectoryContent.tsx` and `SpokeFilterBar.tsx`) with a single shared `FilterEngine` client component. The new component exposes price range, guest count, state drill-down, amenity tags, and Editor's Pick / New quick toggles — all always visible, all synced to URL query params. A slide-up mobile drawer replaces the cramped expand-in-place pattern. Active-filter chips are permanently visible so users always see what's applied and can remove individual filters without clearing everything.

---

## Problem Frame

The collection page (`/collection`) and spoke pages (`/unique`, `/work-friendly`, etc.) each maintain their own filter state and UI, sharing no code. Both hide most filters behind a toggle button, omit the two most universally expected travel filters (price range and guest count), and sync only a subset of state to the URL — making filtered results unshareable and back-button-unsafe. This friction is the primary barrier between a user landing on the site and finding a stay they book.

---

## Requirements

- R1. Unify filter state and logic into one module (`filter-utils.ts`) consumed by one component (`FilterEngine.tsx`).
- R2. Always-visible category pills (with result counts) above the fold on desktop; no "reveal" click required.
- R3. Price range filter: dual-thumb slider, $0–$1,000+/night, updates result count instantly.
- R4. Sleeps/guests picker: Any / 2+ / 4+ / 6+ / 8+ button group.
- R5. State drill-down: searchable select showing only states that have inventory, auto-narrows when region is set.
- R6. Amenity chips: top 12 tags by frequency across all stays, multi-select.
- R7. Quick toggles for Editor's Pick and New always visible in the filter bar.
- R8. All active filters shown as removable chips below the filter bar.
- R9. All filter state serialized to / deserialized from URL query params (shareable, back-button safe).
- R10. Mobile: "Filters (N)" button opens a full-height slide-up drawer containing all filter controls.
- R11. Spoke pages continue to receive their spoke-specific quick-filters (WiFi speed, pet type, etc.) within the same FilterEngine.
- R12. Spoke pages no longer paginate (match current behavior); the collection page paginates at 18 per page.

---

## Scope Boundaries

- No server-side filtering — ~250 listings fit in client memory; keep it simple.
- No date / availability filter — this is an affiliate aggregator with no real-time inventory.
- No map view in this iteration.
- No infinite scroll — pagination remains on `/collection` only; spoke pages show all results without pagination.
- `vibe`, `bestFor`, `bestSeason` fields not exposed as filter dimensions (data sparsity unknown; defer).
- No changes to Payload CMS schema or API queries.

### Deferred to Follow-Up Work

- Map / geo filter: separate PR once geo data is confirmed populated.
- `vibe` / `bestFor` filter dimension: add after verifying field coverage across listings.
- Infinite scroll: consider after pagination UX is validated.

---

## Context & Research

### Relevant Code and Patterns

- `src/app/(app)/collection/_directory/DirectoryContent.tsx` — current collection filter (search + category/region/platform toggle panel, AI search, pagination). Replaces entirely.
- `src/app/(app)/[spoke]/_spoke/SpokeFilterBar.tsx` — current spoke filter (search + spoke pills + region dropdown). Replaces entirely.
- `src/lib/filter-utils.ts` — **already written this session.** Contains `FilterState`, `DEFAULT_FILTERS`, `applyFilters()`, `serializeFilters()`, `deserializeFilters()`, `getTopAmenities()`, `getAvailableStates()`, `SPOKE_FILTERS`, `REGIONS`, `PLATFORMS`, `SLEEPS_OPTIONS`, `MAX_PRICE`.
- `src/lib/search-utils.ts` — exports `REGIONS` (now duplicate of filter-utils) and `isNaturalLanguage()`. Must be updated to import `REGIONS` from filter-utils.
- `src/lib/types.ts` — `NormalizedStay` type. All filter-relevant fields present: `price`, `sleeps`, `state`, `region`, `category`, `platform`, `tags`, `editorsPick`, `isNew`.
- `src/lib/categories-config.ts` — `CATEGORIES_CONFIG` with emoji + label per category.
- `src/lib/spokes-config.ts` — `SPOKES_CONFIG` per spoke.
- `src/lib/states.ts` — full 50-state list with region mapping.
- `src/components/StayCard.tsx` — existing card component; no changes needed.
- `src/app/(app)/collection/page.tsx` — server component that fetches all stays and renders `DirectoryContent`. Will pass stays to `FilterEngine` instead.
- `src/app/(app)/[spoke]/page.tsx` — server component that fetches spoke stays and renders `SpokeFilterBar`. Will pass stays + spoke context to `FilterEngine` instead.

### AI search integration

`DirectoryContent.tsx` has a working debounced natural-language search (`/api/search?q=`) with abort-controller cleanup. This must be preserved in `FilterEngine` — the `isNaturalLanguage()` gate from `search-utils.ts` controls when it fires.

### Institutional Learnings

- ISR cache tags `stays`, `stays:featured` — no filter changes affect caching; stays are fetched server-side, filtering is pure client.
- `'use client'` required on any component with `useState`, `useEffect`, `useRouter`, or `useSearchParams`.
- URL sync in Next.js App Router: use `useSearchParams()` to read and `router.replace(pathname + '?' + params, { scroll: false })` to write — do not use `router.push` (pollutes history on every keystroke).

---

## Key Technical Decisions

- **Filter state ownership:** all state lives in `FilterEngine` — no prop-drilling of individual filter values.
- **URL sync strategy:** `router.replace` (not push) on every filter change; read on mount from `useSearchParams()`. Debounce URL writes for query input (400ms) to avoid one history entry per keystroke.
- **Price range UX:** two overlapping `<input type="range">` elements with CSS-hidden default tracks, custom thumb styling, and a colored filled-range div positioned between `priceMin` and `priceMax` percentages. Cross-browser compatibility to be verified during U2 implementation (Safari especially); fallback to two labeled number inputs if needed.
- **Amenities:** computed at render from `getTopAmenities(allStays, 12)` — dynamic, no hardcoding. Multi-select; a stay must match ALL selected amenities (AND logic).
- **State filter scoping:** when a region filter is active, state dropdown shows only states in that region from `STATES` (from `src/lib/states.ts`). Clears `state` when region changes to a region that doesn't contain the previously selected state.
- **Mobile drawer:** `showDrawer` boolean controls a full-height fixed overlay with `transform: translateY` transition. Backdrop click closes it. Escape key closes it. Body scroll locked while open (add/remove `overflow-hidden` class on `document.body`).
- **Spoke integration:** `FilterEngine` accepts optional `spokeSlug` and `spokeConfig` props. When present: replaces category pills with spoke-specific quick-filter pills in Row B, applies spoke accent color. Category filter row is not shown separately — Row B always contains either category pills OR spoke pills, never both.
- **Result count on category pills:** computed as `allStays.filter(s => s.category === cat.id).length` — based on ALL stays, not current filtered set, to give stable orientation.
- **REGIONS dedup:** `src/lib/search-utils.ts` will import `REGIONS` from `filter-utils` instead of re-declaring it.

---

## Open Questions

### Resolved During Planning

- **Should spoke pages paginate?** No — current behavior shows all results. Keep as-is (R12).
- **Should region and state be independent or linked?** Linked — selecting a region narrows the state dropdown; selecting a state does NOT auto-set the region (to allow cross-region "state only" filtering).
- **One shared component or two?** One — `FilterEngine` with optional spoke props. Avoids divergence.

### Deferred to Implementation

- Exact CSS for dual-thumb range slider thumb sizing and track overlap: verify cross-browser at build time.
- Whether to add a `useFilterEngine` hook to separate logic from rendering: decide after first component draft — only extract if the component exceeds ~400 LOC.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
FilterEngine (client component)
├── props: allStays, spokeSlug?, spokeConfig?
│
├── state: FilterState (query, category, region, state, platform,
│          priceMin, priceMax, sleepsMin, editorsPick, isNew,
│          amenities[], sortBy, spokeFilter)
│
├── effects:
│   ├── onMount: deserialize URL → FilterState
│   ├── onFilterChange: serialize FilterState → URL (router.replace, debounced for query)
│   ├── onQuery: debounced AI search (400ms, AbortController)
│   └── onPageChange: scroll to top
│
├── computed:
│   ├── filtered = applyFilters(allStays, filters, aiIds, spokeSlug)
│   ├── topAmenities = getTopAmenities(allStays, 12)
│   └── availableStates = getAvailableStates(allStays, region)
│
└── renders:
    ├── <StickyBar>
    │   ├── Row A: Search + Sort + Count
    │   ├── Row B: Category pills (with counts) | ✦ Pick | New | Filters(N) btn
    │   └── Row C: Active filter chips (conditional)
    ├── <MoreFiltersPanel> (expandable on desktop, drawer on mobile)
    │   ├── Region pills
    │   ├── State dropdown
    │   ├── Platform pills
    │   ├── Price range dual-thumb
    │   ├── Sleeps picker
    │   └── Amenity chips
    ├── <ResultsGrid> (paginated for collection, full for spoke)
    └── <Pagination> (collection only)
```

---

## Implementation Units

### U1. filter-utils.ts — shared filter logic module

**Goal:** Central module for all filter types, logic, and URL serialization. Already written; this unit covers the one remaining fix (REGIONS dedup in search-utils) and the test file.

**Requirements:** R1, R9

**Dependencies:** None

**Files:**
- Modify: `src/lib/search-utils.ts` (import `REGIONS` from filter-utils, remove local declaration)
- Test: `src/lib/filter-utils.test.ts`

**Approach:**
- `search-utils.ts` changes: remove `REGIONS` constant and `Region` type; add `import { REGIONS } from './filter-utils'`; re-export `REGIONS` if needed for backward compat.
- `applyFilters` already handles AI-ID path, all filter dimensions, spoke-filter dispatch, and sort.
- `serializeFilters` / `deserializeFilters` handle URL roundtrip.
- `getTopAmenities` counts tag frequency across all stays, returns top N strings.
- `getAvailableStates` returns unique state names that appear in the stays array.

**Patterns to follow:**
- `src/lib/search-utils.ts` (existing util pattern — pure functions, named exports)

**Test scenarios:**
- Happy path: `applyFilters` with `category='treehouses'` returns only treehouses
- Happy path: `applyFilters` with `priceMin=100, priceMax=300` excludes stays outside range
- Happy path: `applyFilters` with `sleepsMin=4` excludes stays with sleeps < 4
- Happy path: `applyFilters` with `editorsPick=true` returns only editorsPick stays
- Happy path: `serializeFilters` → `deserializeFilters` roundtrip preserves all non-default values
- Happy path: `serializeFilters` with all-default FilterState returns empty URLSearchParams
- Happy path: `getTopAmenities` returns at most N items sorted by frequency
- Happy path: `getAvailableStates` returns unique sorted state names
- Edge case: `applyFilters` with `amenities=['Hot Tub', 'Fire Pit']` uses AND logic (both tags required)
- Edge case: `applyFilters` with empty `allStays` returns empty array for any filter
- Edge case: `deserializeFilters` with unknown param keys ignores them gracefully
- Edge case: `applyFilters` with `aiIds=[]` returns empty (no AI results found)

**Verification:**
- `pnpm test filter-utils` passes all scenarios
- `pnpm tsc` reports no type errors in filter-utils.ts and search-utils.ts

---

### U2. FilterEngine.tsx — unified filter component

**Goal:** Single client component replacing both `DirectoryContent` and `SpokeFilterBar`. Renders the full filter UX: search bar, category pills with counts, quick toggles, active chips, expandable more-filters panel (desktop), slide-up mobile drawer, results grid, and pagination.

**Requirements:** R1–R12

**Dependencies:** U1

**Files:**
- Create: `src/components/FilterEngine.tsx`
- Test: `src/components/FilterEngine.test.tsx`

**Approach:**

*Search row (Row A, always visible):*
- Search input with Search icon, X clear button, AI loading pulse. `isNaturalLanguage()` gates AI search. Debounce URL write for query at 400ms, fire AI fetch after same 400ms.
- Sort select: Featured / Highest Rated / Price Low–High / Price High–Low.
- Result count badge (or "—" during AI load).

*Quick-filter row (Row B, always visible):*
- Category pills: `[All] [🌲 Treehouses (42)] [🔮 Domes (18)] …` — horizontal scroll container with `overflow-x-auto scrollbar-hide`. Counts from `allStays` (stable, not filtered). Show all categories on desktop; truncate after 5 on mobile with "+N more" that opens drawer.
- When `spokeSlug` is provided: replace category pills with the spoke's quick-filter pills (from `SPOKE_FILTERS`).
- Quick toggles: `[✦ Editor's Pick]` and `[New]` stamp badges, toggle active/inactive style on click.
- `[Filters (N) ▼]` button where N = `countActiveFilters(filters)` minus quick-toggle count already visible. On mobile this is the primary filter entry point.

*Active chips row (Row C, conditional):*
- Render when `hasActiveFilters(filters)`. One chip per active dimension. Each chip: label + `×` button that removes only that filter. All chips: `[Reset all]` at the right.
- Chip labels: "Treehouses", "Northeast", "Colorado", "Airbnb", "$100–$300", "Sleeps 4+", "✦ Pick", "New", "Hot Tub", "Fire Pit".

*More filters panel (desktop expand / mobile drawer):*
- Desktop: expand below Row B with `height` transition. Opened by Filters button.
- Mobile: `showDrawer` toggles a fixed full-height overlay. Backdrop div behind at z-40, panel at z-50. Close on backdrop click, Escape key, or explicit close button. `document.body.style.overflow = 'hidden'` while open, restored on close.
- Panel contents in a 2-column grid on desktop, single column on mobile:
  - **Region:** pill buttons (All + 6 regions).
  - **State:** `<select>` populated with `getAvailableStates()`, filtered to current region if set. Clears when region changes to one that doesn't contain selected state. Selecting a state does NOT auto-set the region — state filter is independent (allows "show all Vermont stays" without locking to Northeast).
  - **Platform:** pill buttons (All / Airbnb / VRBO / Wander / Direct).
  - **Price:** `$[min] ──[track]── $[max]` with two overlapping `<input type="range">`. Track highlight via absolute-positioned div with `left` and `width` percentages. Labels below each thumb show current value. "$1,000+" label when `priceMax === MAX_PRICE`.
  - **Sleeps:** button group from `SLEEPS_OPTIONS` (Any [no minimum — `sleepsMin=0`], 2+, 4+, 6+, 8+). `sleepsMin` is always a number: 0 = no filter, 2/4/6/8 = minimum capacity. Selecting "Any" sets `sleepsMin=0`.
  - **Amenities:** horizontal chip grid from `topAmenities`. Multi-select; active chips filled. "Showing X of 12" when truncated (expand on "More").

*Results grid:*
- `paginatedResults.map((stay, i) => <StayCard key={stay.id} stay={stay} index={i} />)` with `fade-up` class.
- For spoke context: `accentColor={spokeConfig.accentColor}` passed to StayCard.
- Pagination controls rendered only when `!spokeSlug` (collection page).

*Loading and empty states:*
- AI loading: centered logo with `animate-pulse` (matches current DirectoryContent).
- Empty: "Nothing here." heading + "Try different filters" + "Start Over" button.

**Patterns to follow:**
- `src/app/(app)/collection/_directory/DirectoryContent.tsx` — AI search effect, fade-up pattern, pagination controls, stamp-badge classes
- `src/app/(app)/[spoke]/_spoke/SpokeFilterBar.tsx` — spoke accent color, spoke pill filters

**Test scenarios:**
- Happy path: renders search input, category pills, sort select, result count
- Happy path: typing in search filters results by title/location/description (non-AI path)
- Happy path: clicking a category pill updates `activeCategory` and filters results
- Happy path: clicking Editor's Pick toggle shows only `editorsPick === true` stays
- Happy path: setting `priceMin=100, priceMax=300` excludes stays outside range
- Happy path: selecting Sleeps 4+ hides stays with `sleeps < 4`
- Happy path: selecting a state filters stays to that state only
- Happy path: selecting a region narrows state dropdown to states in that region
- Happy path: selecting an amenity chip filters to stays with that tag
- Happy path: active chips appear when any filter is set; each chip's × removes only that filter
- Happy path: Reset all clears all filters
- Happy path: URL query params match active filters after user interaction
- Happy path: on mount, URL query params restore filter state
- Happy path: with `spokeSlug='work-friendly'`, spoke pills appear; category pills hidden
- Happy path: pagination shows on `/collection` (no `spokeSlug`); absent with `spokeSlug`
- Edge case: empty `allStays` renders "Nothing here." state without crashing
- Edge case: AI search fires only when `isNaturalLanguage(query)` is true
- Edge case: mobile drawer opens on "Filters" button click; closes on backdrop click and Escape
- Edge case: changing region to one that doesn't include selected state clears state filter
- Edge case: `priceMax === MAX_PRICE` displays "$1,000+" label, not "$1,000"
- Integration: URL param `?category=treehouses&pmin=150` on mount applies both filters simultaneously

**Verification:**
- `pnpm test FilterEngine` passes
- `pnpm tsc` no errors
- Dev server: `/collection` renders; changing any filter updates URL immediately; refreshing restores same filter state; "Nothing here." shows for impossible filter combos

---

### U3. Update DirectoryContent.tsx

**Goal:** Replace the custom filter state in `DirectoryContent` with `FilterEngine`. The server component (`collection/page.tsx`) passes `allStays` to `FilterEngine`; `DirectoryContent.tsx` becomes a thin wrapper or is deleted.

**Requirements:** R1, R2, R8, R9

**Dependencies:** U2

**Files:**
- Modify: `src/app/(app)/collection/_directory/DirectoryContent.tsx`
- Modify: `src/app/(app)/collection/page.tsx` (if it renders DirectoryContent directly, wire FilterEngine instead)

**Approach:**
- **Resolved:** `collection/page.tsx` currently renders only `<DirectoryContent allStays={allStays} />` (no separate header). The "The Collection." hero header lives inside `DirectoryContent.tsx`.
- Move the hero header section (`<section>` with `"The Collection."` heading and stamp badge) into `collection/page.tsx` as a server-rendered section above `<FilterEngine>`. This keeps it static/SEO-friendly and eliminates the client bundle cost of rendering a static heading.
- `DirectoryContent.tsx` is then simplified to: import and render `<FilterEngine allStays={allStays} />` — or deleted, with `page.tsx` rendering `FilterEngine` directly.
- `collection/page.tsx` final shape: `<> <HeroHeader /> <FilterEngine allStays={allStays} /> </>`

**Patterns to follow:**
- `src/app/(app)/collection/page.tsx` — current server data-fetch + client render pattern

**Test scenarios:**
- Happy path: `/collection` route renders without runtime errors
- Happy path: `pnpm build` completes without type errors on this file
- Integration: `allStays` passed from server → FilterEngine renders correct count

**Verification:**
- `pnpm build` succeeds
- Navigating to `/collection` in dev shows filter bar and stay grid

---

### U4. Update SpokeFilterBar.tsx

**Goal:** Replace `SpokeFilterBar` with `FilterEngine` in spoke context. Spoke pages pass `allStays`, `spokeSlug`, and `spokeConfig`; `FilterEngine` handles spoke-specific pills, accent colors, and filter logic.

**Requirements:** R1, R11, R12

**Dependencies:** U2

**Files:**
- Modify: `src/app/(app)/[spoke]/_spoke/SpokeFilterBar.tsx`
- Modify: `src/app/(app)/[spoke]/page.tsx` (update render call)

**Approach:**
- `SpokeFilterBar.tsx` becomes: import `FilterEngine`, render `<FilterEngine allStays={stays} spokeSlug={spokeSlug} spokeConfig={config} />`.
- Remove duplicate `REGIONS` constant from `SpokeFilterBar.tsx` (was already duplicating `search-utils.ts`; now both source from `filter-utils.ts`).
- The spoke page header (hero section) remains in the spoke page server component, above `FilterEngine`.
- `SpokeFilterBar.tsx` may be deleted entirely if `spoke/page.tsx` can render `FilterEngine` directly.

**Patterns to follow:**
- `src/app/(app)/[spoke]/page.tsx` — current spoke page structure

**Test scenarios:**
- Happy path: `/unique` renders spoke pills (Treehouses, Geodesic Domes, …) instead of category pills
- Happy path: `/work-friendly` shows WiFi speed pills and applies work-friendly spoke filter
- Happy path: spoke accent color (`oklch(0.45 0.12 250)` for work-friendly) used on active pill and toggle states
- Happy path: no pagination controls rendered on spoke pages
- Integration: region filter + spoke filter compose correctly (both applied)

**Verification:**
- All 5 spoke routes render in dev without errors
- `pnpm tsc` passes
- Spoke-specific filter pills appear and filter results

---

## System-Wide Impact

- **Interaction graph:** `FilterEngine` is a pure client component. It calls `/api/search` for AI queries (existing endpoint, unchanged). No server actions, no cache mutations, no ISR triggers.
- **Error propagation:** AI search errors are caught and silently degrade to `aiIds=null` (text search fallback). Filter errors produce empty results — the "Nothing here." empty state is the terminal condition, no error boundary needed.
- **State lifecycle risks:** URL params are written on every filter change. If the user navigates away and back, state is restored from URL. No localStorage, no session state, no cross-tab conflicts.
- **API surface parity:** `collection/page.tsx` and `[spoke]/page.tsx` server components are the only callers of `DirectoryContent` and `SpokeFilterBar` respectively — no other consumers. Clean replacement.
- **Unchanged invariants:** Payload API queries, ISR cache tags (`stays`, `stays:featured`), `StayCard.tsx`, `payload-queries.ts`, and all spoke hero/stats sections are untouched.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Dual-thumb range slider cross-browser CSS quirks (Safari especially) | Test in Safari during U2 implementation; fallback to two labeled number inputs if CSS approach is unreliable |
| URL sync on every keystroke causing router.replace storms | Debounce text query URL write at 400ms; other filter changes (clicks) write immediately — acceptable UX |
| Mobile drawer body scroll lock breaking iOS momentum scroll | Add `-webkit-overflow-scrolling: touch` to drawer content; test on real device or Simulator |
| Losing the AI search loading state during component consolidation | Preserve exact effect pattern from current DirectoryContent.tsx; AI search is load-bearing UX |
| `getTopAmenities` returning noisy/low-signal tags if data is sparse | Cap at 12 and inspect output in dev; add a minimum frequency threshold (≥ 3 stays) if needed |

---

## Sources & References

- Current collection filter: `src/app/(app)/collection/_directory/DirectoryContent.tsx`
- Current spoke filter: `src/app/(app)/[spoke]/_spoke/SpokeFilterBar.tsx`
- Filter logic module (written this session): `src/lib/filter-utils.ts`
- Type definitions: `src/lib/types.ts`
- State config: `src/lib/states.ts`
- Category config: `src/lib/categories-config.ts`
- Spoke config: `src/lib/spokes-config.ts`
