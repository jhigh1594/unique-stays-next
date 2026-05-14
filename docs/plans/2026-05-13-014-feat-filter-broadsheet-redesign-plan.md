---
title: "feat: Broadsheet Filter UI Redesign"
type: feat
status: active
date: 2026-05-13
origin: prototypes/filter-broadsheet-v2.html
---

# feat: Broadsheet Filter UI Redesign

## Summary

Replace the generic Airbnb-style sticky pill bar in FilterEngine with a typographic, editorial "broadsheet" filter UI. The prototype at `prototypes/filter-broadsheet-v2.html` defines the target: a masthead with live count, a bottom-border-only search field with compass indicator, a middot-separated category index with Fraunces italic active state, a filter sentence line with a searchable location combobox (states + cities), stamp-badge toggles, and postcard-style stay cards with postmark circles. All filter logic (filter-utils.ts) and tests carry forward — this plan changes only the presentation layer and adds location combobox filtering.

---

## Problem Frame

The current FilterEngine (shipped on `feat/filter-engine-overhaul`) is functional but visually indistinguishable from Airbnb/booking-site UI — the exact anti-reference in the design system. The filter bar, pill buttons, chip rows, and boxed search input are SaaS patterns that break the editorial brand identity. A design critique, 20+ platform research sweep, and 5 HTML prototypes converged on a typographic approach where the UI chrome disappears and the typography IS the interface.

---

## Requirements

- R1. Replace pill-button category filters with a typographic index (middot-separated, Fraunces italic active state)
- R2. Replace boxed search input with a bottom-border-only field with compass SVG indicator
- R3. Replace "More Filters" expandable panel with a filter sentence line ("Vermont · Under $300 · Airbnb · Sleeps 4+")
- R4. Add searchable location combobox (states + cities with counts) as the first filter segment
- R5. Remove chip row — filter sentence IS the active state indicator
- R6. Add stamp-badge toggles for Editor's Pick and New
- R7. Restyle StayCard with postmark circles, dashed metadata rows, and polaroid treatment
- R8. Add FLIP-style grid transition animation (fade/scale with stagger) using framer-motion (already installed)
- R9. Mobile: bottom-sheet filter popovers with explicit Apply button
- R10. Preserve all existing filter logic, URL sync, AI semantic search, spoke page support
- R11. Maintain WCAG 2.1 AA: keyboard nav, aria-live result count, prefers-reduced-motion
- R12. All 19 existing filter-utils tests continue passing

---

## Scope Boundaries

- No changes to filter-utils.ts logic (applyFilters, serializeFilters, etc.) — only additions for location combobox
- No changes to data model or Payload schema
- No sidebar panel (prototype B), no card catalogue tabs (prototype C)
- No conversational/wizard filtering
- No map-based filtering
- Spoke pages use the same FilterEngine with spoke-specific adaptations (existing behavior)

### Deferred to Follow-Up Work

- Spoke-specific discovery cards (vibe-based entry points): future iteration after core filter ships
- Location combobox city-level filtering for spoke pages: same scope, different PR
- Framer Motion `layout` prop for true FLIP grid reflows (vs. fade/scale): performance benchmark first

---

## Context & Research

### Relevant Code and Patterns

- `src/components/FilterEngine.tsx` — current 748-line filter component to be rewritten
- `src/lib/filter-utils.ts` — filter logic (248 lines), carries forward unchanged
- `src/lib/filter-utils.test.ts` — 19 tests, must continue passing
- `src/lib/states.ts` — `STATES` array with `{ name, slug, region }` for location combobox
- `src/lib/categories-config.ts` — `CATEGORIES_CONFIG` for category index
- `src/components/StayCard.tsx` — restyle with postmark, dashed metadata
- `src/app/(app)/globals.css` — existing `.stamp-badge`, `.grain-overlay`, `.fade-up` classes to extend
- `prototypes/filter-broadsheet-v2.html` — pixel reference for all interactions and visual treatment

### Institutional Learnings

- Hero images require Vercel Blob, not Payload media upload alone (see memory)
- All styles in current FilterEngine are inline — this plan moves to CSS classes for maintainability
- `framer-motion` is installed but unused — available for grid transitions
- `accentColor` prop on StayCard exists but is voided — will be activated for spoke coloring

### External References

- FLIP technique (Paul Lewis) for grid reflow animation
- Sawday's persona-based category model for spoke adaptation
- Discogs faceted counts pattern for category/location counts
- Plum Guide collection-card pattern for future discovery cards

---

## Key Technical Decisions

- **CSS classes over inline styles**: Move from `style={{...}}` objects to `globals.css` classes. Inline styles in the current FilterEngine make maintenance difficult and conflict with existing `.stamp-badge` patterns in globals.css.
- **Location combobox as new filter segment**: Add `location` field to FilterState (type: `{ type: 'state' | 'city', value: string }` or empty string). Serialize to URL as `?loc=vermont` or `?loc=stowe-vt`. Derive states/cities with counts from allStays at render time.
- **Framer Motion for grid transitions**: Use `AnimatePresence` + `motion.div` with `layout` prop for card enter/exit/move animations. Already installed. Falls back to instant swap when `prefers-reduced-motion`.
- **Keep filter-utils.ts stable**: Add `getLocationFacets()` and `filterByLocation()` as new exports. Do not modify existing `applyFilters` signature — layer location filtering on top.
- **Single FilterEngine for collection + spoke**: Same component, same filter sentence pattern. Spoke pages pass `spokeSlug` which adjusts the category index (shows spoke-specific categories instead of global).

---

## Open Questions

### Resolved During Planning

- **City vs State granularity**: State filter segment + searchable combobox that includes cities. City filtering uses the existing `state` field in NormalizedStay plus `location` string matching. Search field also matches cities as fallback.
- **Animation library**: framer-motion (already installed) over react-flip-toolkit (would need new dependency)
- **Mobile filter pattern**: Bottom sheet with explicit Apply, not instant-apply. Confirmed by research (Airbnb, Google Hotels, Booking.com all use this).

### Deferred to Implementation

- **Exact CSS class naming convention** for new filter components
- **Framer Motion animation tuning** (stagger delay, spring config) — needs visual testing
- **StayCard postmark SVG** exact design — implement to match prototype visually

---

## Implementation Units

### U1. CSS Foundation — Broadsheet Filter Styles

**Goal:** Add CSS classes for all new filter UI elements to globals.css, replacing inline styles.

**Requirements:** R1, R2, R3, R5, R6

**Dependencies:** None

**Files:**
- Modify: `src/app/(app)/globals.css`
- Test: visual (no unit test for CSS)

**Approach:**
- Add `.filter-masthead`, `.filter-masthead-title`, `.filter-masthead-rule`, `.filter-masthead-count` for the masthead
- Add `.filter-search` with bottom-border-only treatment, compass rotation on focus
- Add `.filter-category-index` with middot separators, `.filter-category-item` with active/inactive states (Fraunces italic + terracotta underline for active, Plus Jakarta Sans muted for inactive)
- Add `.filter-sentence` with segment styles, `.filter-segment` clickable text, `.filter-segment--active` terracotta bold
- Add `.filter-popover` with cream bg, sand border, no border-radius, scrollable
- Add `.filter-location-combobox` with search input inside popover, states/cities sections
- Add `.filter-toggle-badge` for Pick/New stamps (pressed/unpressed states)
- Add `.filter-clear` link style
- Extend `.stamp-badge` if needed
- Add `@media (prefers-reduced-motion: reduce)` rules disabling filter transitions
- Add mobile bottom-sheet styles (`.filter-bottom-sheet`, `.filter-bottom-sheet-backdrop`)

**Patterns to follow:**
- Existing `.stamp-badge`, `.category-pill`, `.grain-overlay` patterns in globals.css
- CSS custom properties for colors (already established in `:root`)

**Test expectation:** none — CSS-only changes verified visually

**Verification:**
- All existing globals.css patterns still render correctly
- New classes available for FilterEngine component

---

### U2. FilterEngine Rewrite — Core UI

**Goal:** Rewrite FilterEngine.tsx to use the broadsheet typographic UI. Masthead, search, category index, filter sentence, toggle badges.

**Requirements:** R1, R2, R3, R5, R6, R10, R11

**Dependencies:** U1

**Files:**
- Modify: `src/components/FilterEngine.tsx`
- Modify: `src/app/(app)/collection/_directory/DirectoryContent.tsx` (remove inline hero styles if any conflict)
- Test: `src/lib/filter-utils.test.ts` (must still pass)

**Approach:**
- Replace the sticky filter bar with the broadsheet layout: masthead → search → category index → filter sentence → toggle badges
- Category index: map `CATEGORIES_CONFIG` to middot-separated text items. Active = Fraunces italic + terracotta underline. Compute counts per category from allStays.
- Filter sentence: 4 segments (Location, Price, Platform, Sleeps). Each opens a popover on click. Active segments show selected value in terracotta.
- Price popover: list of price ranges (not a slider — matches prototype). Alternatively keep the range slider from current impl but styled minimally.
- Platform popover: `PLATFORMS` list with counts.
- Sleeps popover: `SLEEPS_OPTIONS` list.
- Toggle badges: `✦ Pick` and `New` stamp badges at end of sentence line.
- Search field: bottom-border-only input, compass SVG, Fraunces italic placeholder.
- Result count: `aria-live="polite"` region in masthead.
- Remove: chip row, pill buttons, "More Filters" panel, sticky bar.
- Preserve: URL sync (serializeFilters/deserializeFilters), AI semantic search (isNaturalLanguage + /api/search), pagination, spoke page support.
- Mobile: filter sentence wraps, popovers become bottom sheets.

**Patterns to follow:**
- Current FilterEngine's state management pattern (useState, URL sync, AI search effect)
- Current FilterEngine's spoke page adaptation (spokeSlug/spokeConfig props)
- Current FilterEngine's mobile drawer pattern (adapted to bottom sheet per segment)

**Test scenarios:**
- **Happy path**: Category click filters results, result count updates, URL updates
- **Happy path**: Filter sentence segments open popovers, selecting an option filters results
- **Happy path**: Toggle badges filter by editorsPick and isNew
- **Happy path**: Search field filters results by text
- **Edge case**: No results — empty state renders with "Start over" link
- **Edge case**: URL with pre-set filters loads correctly on mount
- **Integration**: AI semantic search activates for natural language queries, shows results
- **Integration**: Spoke page renders spoke-specific category index and filters

**Verification:**
- All 19 filter-utils tests pass
- FilterEngine renders broadsheet UI (masthead, category index, filter sentence)
- Category switching works and updates grid
- Filter sentence popovers open/close correctly
- URL sync preserves filter state across page reloads

---

### U3. Location Combobox

**Goal:** Add a searchable location combobox as the first segment in the filter sentence. Shows states and cities with stay counts, filterable by text input.

**Requirements:** R4

**Dependencies:** U2

**Files:**
- Modify: `src/lib/filter-utils.ts` (add `getLocationFacets()`, `filterByLocation()`)
- Modify: `src/components/FilterEngine.tsx` (add location combobox UI)
- Test: `src/lib/filter-utils.test.ts` (add location facet tests)

**Approach:**
- Add `getLocationFacets(allStays): { states: { name, count }[], cities: { name, state, stateAbbr, count }[] }` to filter-utils.ts. Derives from allStays at render time.
- Add location filter logic: when a state is selected, filter by `stay.state === selectedState`. When a city is selected, filter by `stay.location` starts with cityName or `stay.state === state && location match`.
- Add `location` to FilterState: `{ locationType: 'state' | 'city' | null, locationValue: string }`. Serialize to URL as `?loc=vermont` or `?loc=stowe-vt`.
- UI: Clicking "Everywhere" segment opens a popover with a search input and two sections (STATES / CITIES). Typing filters both lists. Each item shows name + count. Clicking selects and closes popover. Segment text updates to show selection.
- Combobox is keyboard-navigable (arrow keys, Enter to select, Escape to close).
- On mobile: location combobox opens as a bottom sheet.

**Patterns to follow:**
- Existing `getAvailableStates()` pattern in filter-utils.ts for deriving facets from allStays
- STATES array from `states.ts` for region grouping
- FilterEngine's existing popover pattern (from U2)

**Test scenarios:**
- **Happy path**: `getLocationFacets` returns correct states and cities with counts
- **Happy path**: Selecting a state filters results to that state only
- **Happy path**: Selecting a city filters results to that city only
- **Edge case**: State with 0 stays not shown in facets
- **Edge case**: City with 0 stays not shown
- **Edge case**: Clearing location resets to "Everywhere"
- **Edge case**: Location + category + price filter combine correctly (AND logic)
- **Integration**: Location combobox keyboard navigation works (arrow keys, Enter, Escape)
- **Integration**: URL serialization roundtrip for location filter

**Verification:**
- New filter-utils tests pass
- Location combobox renders states and cities with correct counts
- Typing in search input filters the suggestion list
- Selecting a location filters the result grid and updates the URL

---

### U4. StayCard Restyle

**Goal:** Restyle StayCard with postmark circles, dashed metadata rows, and refined polaroid treatment matching the prototype.

**Requirements:** R7

**Dependencies:** None (parallel with U1-U3)

**Files:**
- Modify: `src/components/StayCard.tsx`
- Modify: `src/app/(app)/globals.css` (add card styles)

**Approach:**
- Add postmark circle: 32px terracotta circle with dashed inner ring, state abbreviation in tiny caps. Positioned absolute over bottom-right of image area.
- Add dashed-border monospace metadata row below location: `$285/nt · sleeps 4 · ★ 4.9`
- Add Editor's Pick `✦` stamp in forest green on card when `editorsPick` is true
- Refine polaroid borders: 8px top, 6px sides, 6px bottom white frame
- Category stamp: terracotta dashed border, rotated -4deg, positioned top-right of image
- Activate the `accentColor` prop for spoke-specific card coloring
- Keep existing tilt animation, grain overlay, platform badge patterns

**Patterns to follow:**
- Current StayCard.tsx structure (polaroid frame, tilt, grain, platform badges)
- Current `.stay-card` CSS in globals.css

**Test expectation:** none — visual component, verified by screenshot/review

**Verification:**
- StayCard renders with postmark circle showing correct state abbreviation
- Metadata row shows price, sleeps, rating in monospace
- Editor's Pick stamp visible on curated stays
- Existing hover tilt and grain overlay still work
- Cards render correctly in both collection and spoke page contexts

---

### U5. Grid Transition Animation

**Goal:** Add framer-motion FLIP-style grid transition animation when filters change.

**Requirements:** R8, R11

**Dependencies:** U2

**Files:**
- Modify: `src/components/FilterEngine.tsx` (wrap card grid with AnimatePresence + motion.div)

**Approach:**
- Wrap the results grid in `<AnimatePresence mode="wait">` or `<AnimatePresence mode="popLayout">`
- Each card wrapped in `<motion.div>` with `layout`, `initial`, `animate`, `exit` props
- Exit animation: opacity 0, scale 0.97, 150ms ease-out
- Enter animation: opacity 1, scale 1, with stagger (50ms per card, max 400ms)
- Use `layout` prop for cards that move position without exiting
- Wrap all animations in `useReducedMotion()` check from framer-motion — instant snap when reduced motion preferred
- Consider `LayoutGroup` for coordinating grid reflows

**Patterns to follow:**
- framer-motion documentation for `AnimatePresence`, `layout`, `LayoutGroup`
- Prototype's transition timing (150ms exit, 200ms enter, 40ms stagger)

**Test scenarios:**
- **Happy path**: Category switch triggers exit animation on old cards, enter animation on new cards
- **Happy path**: Filter change animates card positions smoothly
- **Edge case**: `prefers-reduced-motion` disables all animations — instant swap
- **Edge case**: Rapid filter changes don't create animation conflicts

**Verification:**
- Grid transitions are smooth (no layout thrash, 60fps)
- Cards exit/enter with correct timing
- Reduced motion users see instant swaps
- No visual artifacts during rapid filter changes

---

### U6. Integration and Spoke Page Adaptation

**Goal:** Verify the broadsheet filter works on both collection and spoke pages. Ensure spoke-specific category index and spoke filter adaptations.

**Requirements:** R10

**Dependencies:** U2, U3, U4, U5

**Files:**
- Modify: `src/app/(app)/[spoke]/_spoke/SpokeFilterBar.tsx` (verify it passes correct props)
- Modify: `src/app/(app)/[spoke]/page.tsx` (verify spoke page integration)
- Modify: `src/app/(app)/collection/page.tsx` (verify collection page integration)
- Test: manual verification on both page types

**Approach:**
- Spoke pages already pass `spokeSlug` and `spokeConfig` to FilterEngine — verify the broadsheet UI adapts
- Category index on spoke pages: show spoke-specific categories from `SPOKE_FILTERS[spokeSlug]` instead of global categories
- Location combobox on spoke pages: show only states/cities that have stays matching the spoke
- `accentColor` from spokeConfig applied to masthead rule, active category underline, toggle badges
- Verify spoke-specific filters (wifi speed, pet policy, etc.) still work via the existing `spokeFilter` field
- Verify both collection and spoke pages render correctly at mobile breakpoints

**Patterns to follow:**
- Current spoke page structure (SpokeFilterBar wrapping FilterEngine in Suspense)
- Current spoke-specific filter logic in filter-utils.ts `applySpokeFilter`

**Test scenarios:**
- **Happy path**: Collection page renders broadsheet filter with all global categories
- **Happy path**: Spoke page renders with spoke-specific category index
- **Integration**: Spoke-specific filters (e.g., "Fast WiFi" on work-friendly) combine with broadsheet filters
- **Integration**: Spoke accent color applies to masthead, active states, badges
- **Integration**: Location combobox on spoke pages shows relevant locations only
- **Edge case**: Spoke page with no spoke-specific filters shows default broadsheet UI

**Verification:**
- Both /collection and /[spoke] pages render the broadsheet filter correctly
- Spoke-specific adaptations (categories, colors) apply correctly
- All filter-utils tests still pass
- No console errors or layout breaks on either page type

---

## System-Wide Impact

- **Interaction graph:** FilterEngine renders on /collection and /[spoke] pages. DirectoryContent and SpokeFilterBar are thin wrappers — changes to FilterEngine propagate to both.
- **Error propagation:** AI semantic search failures already handled gracefully (falls back to null aiIds). No change.
- **State lifecycle risks:** URL sync could create conflicts if location combobox serialization format clashes with existing params. Use a new `loc` param key to avoid collision.
- **API surface parity:** Spoke pages and collection page must render identical StayCard components.
- **Integration coverage:** Spoke-specific filter logic (applySpokeFilter) must still work with the new UI — this is untested territory since spoke pages weren't fully adapted in the previous filter-engine-overhaul branch.
- **Unchanged invariants:** filter-utils.ts exports and signatures remain stable. URL param keys for existing filters unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Location combobox city matching is fragile (free-text `location` field) | Match on `state` first, then `location.includes(cityName)` — documented in filter-utils |
| Framer Motion layout animations cause layout thrash with 200+ cards | Pagination (18 per page) limits cards in DOM. Benchmark before shipping. |
| Mobile bottom sheet UX differs from desktop popover pattern | Shared trigger, different container — same interaction model, different surface |
| CSS class migration from inline styles is a large diff | Incremental: new classes in U1, then rewrite component in U2 |
| Spoke page integration untested in current filter branch | U6 dedicated to spoke page verification |

---

## Sources & References

- **Prototype:** `prototypes/filter-broadsheet-v2.html`
- **Design spec:** `docs/superpowers/specs/2026-05-13-filter-engine-redesign-design.md` (card catalogue spec — broadsheet supersedes the visual direction but architectural decisions carry forward)
- **Previous plan:** `docs/plans/2026-05-12-013-feat-filter-engine-overhaul-plan.md`
- **Design system:** `.impeccable.md` and updated `CLAUDE.md`
