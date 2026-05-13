# Filter & Search Redesign: Two-Tier Broadsheet + Field-Notes Sidebar

**Date:** 2026-05-13
**Status:** Approved
**Supersedes:** Broadsheet-only redesign plan (014-feat-filter-broadsheet-redesign)

## Decision

Replace the generic Airbnb-style filter UI on `/collection` with a two-tier design: a broadsheet typographic masthead (Tier 1, always visible) and a field-notes sidebar (Tier 2, push pattern, default closed). Visual language is "Wanderer's Postcard Collection" — editorial travel directory, not booking site.

**Why:** The broadsheet plan eliminated all panel UI in favor of pure typography. That created density problems — too many filters compressed into inline text. The two-tier approach separates browsing (Tier 1: search + category) from refining (Tier 2: location, platform, price, pick), giving each tier clear purpose.

**Why this direction:** Jon explicitly requested a sidebar-based two-tier approach after prototyping `filter-b-field-notes-sidebar.html`. The push sidebar gives spatial context (filters + results visible together) that overlay and bottom-sheet alternatives lack.

## Scope

**In scope:**
- `/collection` page filter/search rewrite
- `/[spoke]` page filter adaptation (same FilterEngine, spoke-specific accent)
- Location combobox (replaces Region dropdown)
- URL sync, AI semantic search, pagination (preserved from current implementation)

**Out of scope:**
- Map-based filtering
- Conversational/wizard filtering
- AI-generated filter suggestions
- Backend changes (all filtering is client-side or existing API)

## Page Layout & Zones

### Desktop (>900px)

Three horizontal zones top-to-bottom, one optional push sidebar:

```
┌─────────────────────────────────────────────┐
│ TIER 1: Broadsheet Masthead                 │
│ ┌─ Masthead ──────── 12 STAYS ── Sort ─┐   │
│ │ ⊙ Search stays...                     │   │
│ │ Treehouses · A-Frames · Cabins · ...  │   │
│ └───────────────────────────────────────┘   │
├──────────┬──────────────────────────────────┤
│ SIDEBAR  │ POLAROID GRID                    │
│ (closed  │ ┌──┐ ┌──┐ ┌──┐                  │
│  by      │ └──┘ └──┘ └──┘                  │
│  default)│ ┌──┐ ┌──┐ ┌──┐                  │
│          │ └──┘ └──┘ └──┘                  │
├──────────┴──────────────────────────────────┤
```

Sidebar (~280px) opens via filter toggle in masthead. Pushes grid right with Framer Motion layout animation. Field-notes ruled-paper background, perforated right edge.

### Mobile (<700px)

Tier 1 stacks vertically. Sidebar becomes left-drawer overlay (slides in from left with backdrop). Filter toggle fixed bottom-left.

### Desktop (900px–1200px)

Sidebar 260px. Cards: 2-col when sidebar open, 3-col when closed.

## Tier 1: Broadsheet Masthead

Always visible. Three rows, broadsheet typographic style. No pill buttons, no boxed inputs — typography IS the interface.

### Row 1 — Masthead + Count + Sort + Toggle

- **Left:** "The Directory" in Fraunces 600, thick underline rule
- **Inline right of title:** result count in small terracotta caps ("12 STAYS")
- **Far right:** Sort dropdown (Featured First / Highest Rated / Price Low-High / Price High-Low). Understated Fraunces italic with bottom-border treatment
- **Filter toggle:** Postmark-stamped circle with "FILTER" text, slight rotation, terracotta border. Click opens/closes sidebar

### Row 2 — Search Bar

- Full-width bottom-border-only input
- Compass SVG icon on left (terracotta)
- Fraunces italic placeholder: "Search stays..."
- AI semantic search fires on natural-language queries (existing `isNaturalLanguage()` gate + `/api/search` endpoint preserved)

### Row 3 — Category Index

- Middot-separated: `Treehouses · A-Frames · Cabins · Domes · Tiny Homes · Yurts`
- Active category: Fraunces italic, terracotta
- Others: Plus Jakarta Sans regular, charcoal
- Single-select (one category at a time)

## Tier 2: Field-Notes Sidebar

Push sidebar, default closed. Field-notes journal aesthetic.

### Visual Treatment

- Cream background (`#F7F3EC`) with ruled-line repeat (horizontal lines every 29px)
- Perforated right edge (radial-gradient pseudo-element)
- Sticky, full viewport height, own scrollbar
- Caveat handwritten labels for section headings
- Dashed-rule dividers between sections

### Header — Stamp Badge

- "THE FILTER" in small caps, double-bordered stamp box, slight rotation (-2.5deg)
- SVG stamp-distort filter for ink-bleed imperfection

### Wax-Seal Result Counter

- 64px terracotta circle, radial gradient, inset dashed border
- Count number in Fraunces 600 white
- "stays" label in Caveat below

### Filter Sections

1. **Location Combobox** — Searchable input showing states + cities with stay counts. Bottom-border input, Fraunces italic placeholder. Dropdown facets like "California (8)" "New York (5)". Immediate filter on selection. Replaces Region.

2. **Platform Stamps** — 2x2 grid of stamp-style boxes: Airbnb, VRBO, Wander, Direct. Slight rotation per item via CSS custom property. Active: terracotta border + tinted background. Multi-select.

3. **Price Per Night** — Min/max inputs with dollar signs in Fraunces. Dashed-border inputs. Em-dash separator in Caveat. Debounced filter on input.

4. **Editor's Pick** — Postmark circle toggle (48px, terracotta border, dashed inner ring, "EDITOR'S PICK" in tiny caps at -12deg rotation). Active: terracotta tint fill, rotates to 0deg with spring animation.

### Footer — Reset

- "[ CLEAR ALL FILTERS ]" centered, terracotta, uppercase, letter-spaced
- Dashed border on hover

## Motion & Delight

Framer Motion (already installed) powers all animations. All animations respect `prefers-reduced-motion: reduce`.

### Sidebar Open/Close

- Push transition with `layout` prop on grid container
- Sidebar slides: `x: -280 → x: 0`, spring physics `stiffness: 300, damping: 30`
- Filter toggle postmark rotates on activation (-12deg → 0deg, spring)

### Card Grid Reflow

- Cards reflow from 3-col → 2-col when sidebar opens
- Framer Motion `layout` prop on each StayCard — FLIP-style position transitions
- No exit/enter on sidebar toggle, just position changes

### Card Entrance

- On page load and filter changes: staggered fade+slide from `opacity: 0, y: 20` → `opacity: 1, y: 0`
- 40ms stagger between cards
- `AnimatePresence` for filter-removal exit (fade+shrink)

### Micro-interactions

- Platform stamps: scale 1.05 hover, 0.95 active press
- Editor's Pick postmark: rotation spring on toggle
- Wax-seal counter: scale 1.15 briefly when count changes
- Category index items: underline grows from center on hover
- Search bar: border transitions to terracotta on focus

### Reduced Motion

- All animations disabled when `prefers-reduced-motion: reduce`
- Instant state changes, no springs, no stagger

## Data Flow & State

### Filter State

```
FilterState {
  search: string
  category: string | null        // single-select, null = All
  location: string | null         // state or city slug, replaces region
  platform: Set<string>           // multi-select
  priceMin: number | null
  priceMax: number | null
  editorsPick: boolean
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating'
}
```

### State Management

- `FilterEngine.tsx` owns all filter state
- Sidebar open/close is local state (`isSidebarOpen`), not URL-synced — always starts closed
- All filter values sync to URL via `router.replace()` (not push, no history pollution)
- URL params: `?q=` `?category=` `?loc=` `?platform=` `?priceMin=` `?priceMax=` `?pick=` `?sort=`

### Filtering Pipeline

1. Search: keyword (client-side includes) or AI semantic (API call via `/api/search`)
2. Category: exact match on category slug
3. Location: `filterByLocation()` — matches state or city against stay fields
4. Platform: Set.has() check
5. Price: range comparison
6. Editor's Pick: boolean filter
7. Sort: applied after all filters
8. Pagination: client-side, 18 per page

### Location Facets

`getLocationFacets(stays)` returns `{ states: [{name, count}], cities: [{name, state, count}] }`. Precomputed on mount, powers the combobox dropdown.

### filter-utils.ts Changes

- Add `getLocationFacets(stays)`
- Add `filterByLocation(stay, locationSlug)`
- Add `loc` to `serializeFilters()` / `deserializeFilters()`
- All existing functions and 19 tests preserved — no signature changes

## Components & Files

### New/Rewritten

| File | Purpose |
|---|---|
| `src/components/FilterEngine.tsx` | Full rewrite. Owns masthead, search, category index, filter toggle, sidebar state |
| `src/components/FilterSidebar.tsx` | New. Field-notes sidebar with all filter sections |
| `src/components/LocationCombobox.tsx` | New. Searchable states + cities dropdown with facet counts |
| `src/components/BroadsheetMasthead.tsx` | New. Title, count, sort, filter toggle row |
| `src/components/CategoryIndex.tsx` | New. Middot-separated category links |
| `src/lib/filter-utils.ts` | Extend with location functions and serialization |

### Modified

| File | Change |
|---|---|
| `src/app/(app)/collection/_directory/DirectoryContent.tsx` | Replace inline filter UI with `<FilterEngine>` |
| `src/app/(app)/[spoke]/_spoke/SpokeFilterBar.tsx` | Replace with `<FilterEngine spokeSlug={slug}>` |
| `src/app/globals.css` | Add broadsheet + field-notes CSS classes |
| `src/components/StayCard.tsx` | Add `layoutId` prop for FLIP compatibility |

### Component Hierarchy

```
DirectoryContent (page wrapper, data fetch)
 └─ FilterEngine (state, URL sync, filter pipeline)
     ├─ BroadsheetMasthead (title, count, sort, toggle)
     ├─ CategoryIndex (middot links)
     ├─ FilterSidebar (field-notes panel)
     │   ├─ LocationCombobox
     │   ├─ Platform stamps
     │   ├─ Price inputs
     │   └─ Editor's Pick toggle
     └─ StayCard grid (Framer Motion layout)
```

## Accessibility (WCAG 2.1 AA)

- Sidebar: `role="dialog"`, `aria-label="Filters"`, focus trap when open, Escape to close
- Location combobox: `role="combobox"` with `aria-expanded`, `aria-activedescendant`, arrow key navigation
- Category index: `role="tablist"` / `role="tab"`, arrow key navigation
- Platform stamps: `role="group"` with `role="checkbox"` on each, `aria-checked`
- Editor's Pick toggle: `role="switch"`, `aria-checked`
- Price inputs: `aria-label="Minimum price"` / `"Maximum price"`
- Sort: standard `<select>` with `<label>`
- Filter toggle: `aria-expanded`, `aria-controls`
- Color contrast: terracotta on cream, charcoal on cream, white on terracotta — all AA
- `prefers-reduced-motion`: all animations disabled

## Mobile Behavior (<700px)

- Sidebar: left-drawer overlay (not push — insufficient width)
- Semi-transparent backdrop, tap to dismiss
- Filter toggle: fixed bottom-left button (matching field-notes prototype)
- Category index: wraps to 2 lines if needed
- Search: full-width
- Sort: below search
- Cards: 2-col grid, 1-col at <480px

## Trade-offs Accepted

- **Sidebar default closed** means extra click to access deep filters. Accepted because Tier 1 (search + category) handles 80% of use cases.
- **Location replaces Region** — loses "browse by region" as a single click. Accepted because location combobox is strictly more useful (states + cities with counts).
- **Single-select category** — can't combine "Treehouses + Cabins". Accepted because category browsing is exploratory and multi-category created confusing results.
- **Push sidebar on desktop** — grid shrinks when open. Accepted because seeing filters + results together outweighs the space cost. Overlay alternative hides results.
