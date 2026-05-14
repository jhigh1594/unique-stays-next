# Filter Engine Redesign — The Curated Catalogue

## Decision: Card-catalogue filter UX with Editor's Pick default, vibe-based discovery, and FLIP animations

## Context

Current FilterEngine (feat/filter-engine-overhaul) is a functional but generic Airbnb-style sticky pill bar. Design critique identified it as the exact anti-reference in `.impeccable.md` — indistinguishable from booking-site UI. Research across 20+ curated platforms (Plum Guide, Sawday's, Design Hotels, SSENSE, Letterboxd, Discogs, Rijksmuseum, Cooper Hewitt, 1stDibs, Etsy, Garmentory) converged on a single meta-pattern: **collection-as-filter** — curated entry points replace faceted search.

HTML prototype C (card catalogue tabs, Editor's Pick default) validated strongest. This spec merges C with research findings.

## The Concept

**"The Curated Catalogue"** — filtering feels like browsing a curated travel library. Physical tab dividers separate categories. Editorial picks are the default view. Vibe-based discovery cards sit alongside the taxonomy. The page IS the artifact.

## Architecture

### Layer 1: Tab Divider Navigation (primary)

Physical card-catalogue dividers spanning the full content width. Each tab:
- `clip-path` notched corners + perforation dot strip along top edge
- Staggered heights via `--lift` CSS custom property (looks genuinely filed)
- Active tab: lifts 6px, terracotta top border, bottom border severed to merge with content surface
- Shows stay count in small type (Discogs pattern — builds confidence)
- Scroll horizontally on mobile

**Tab order:**
1. `✦ Curated` (default) — shows Editor's Picks only
2. Category tabs: `🌲 Treehouses (24)` · `🔺 A-Frames (18)` · `🔵 Geodomes (12)` · `🏕️ Cabins (31)` · `⛺ Yurts (8)`
3. `All Stays` — explicit opt-in, the "show everything" escape hatch

**Default state = Curated.** Not all stays. Plum Guide ("only the top 3%"), Sawday's ("personally inspected"), Design Hotels all lead with curation. Users see the best first, browse-all is opt-in.

### Layer 2: Subject Strip (secondary filters)

Below the tab row, a slim horizontal bar styled as a card catalogue's subject-heading index:

```
Region: [All ▾]  ·  Price: [$0–$1,000 ▾]  ·  Platform: [All ▾]  ·  Sleeps: [Any ▾]
```

- Each trigger opens a minimal index-card popup (notched arrow, cream bg, terracotta border)
- Only shows options with results (context-sensitive — hide zero-result filters)
- Active state: label text changes to reflect selection, terracotta color
- On mobile: stacks as 2×2 grid or scrolls horizontally

### Layer 3: Discovery Cards (vibe-based entry points)

Above or beside the results grid, 3-4 curated discovery cards — not filters, but editorial entry points:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  [photo]         │ │  [photo]         │ │  [photo]         │
│  Cozy Cabins     │ │  Off-Grid        │ │  Design-Forward  │
│  Under $200      │ │  Escapes         │ │  Stays           │
│  12 stays →      │ │  8 stays →       │ │  15 stays →      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

- Plum Guide collection-card pattern
- Each card applies a pre-set filter combination (category + price range, or tag-based)
- Styled as postcards (white border, slight tilt, stamp badge)
- Only shown in "Curated" and "All Stays" tabs — hidden when a specific category is selected

### Layer 4: Search (always accessible)

- Rectangular sharp-corner input with "SEARCH" stamp label in terracotta
- Fraunces italic placeholder: "Search the collection…"
- When AI semantic search activates (natural language detected), show small Caveat annotation below: "searching by feel"
- Live-filtering with 400ms debounce (existing behavior)

### Layer 5: Active Filter State

When secondary filters are active:
- No chip row (removed — redundant with the subject strip showing active state)
- Subject strip labels turn terracotta and show the selected value
- Single "Reset" link styled as telegraphic `[CLEAR FILTERS]` at the right end of the strip
- Tab count updates live to reflect filtered results within that category

### Layer 6: Result Cards

Stay cards styled as index cards / postcards:
- Gradient or photo top section
- Terracotta dashed category stamp (rotated slightly)
- Editor's Pick ribbon (forest green, clip-path tail) for curated stays
- Postmark circle with state abbreviation + platform icon
- Fraunces title
- Caveat handwritten location
- Dashed-border mono metadata row: `RATE: $285/nt · SLEEPS: 4 · ★ 4.9`
- Tags as small stamp badges
- Micro-rotated by seeded amount, snap to zero on hover

### Grid Transition Animation

When tabs or filters change:
- FLIP animation via react-flip-toolkit or Framer Motion `layout` prop
- Spring physics (not cubic-bezier) — models real momentum
- Staggered card entrances (50ms delay per card, capped at 400ms)
- Cards that exit: fade + scale down to 0.95
- Cards that enter: fade in + scale up from 0.95
- Cards that move: smooth position transition
- All wrapped in `prefers-reduced-motion` check — instant snap when reduced motion preferred

### Mobile Behavior

- Tab dividers scroll horizontally (no wrapping)
- Subject strip stacks to 2×2 grid
- Secondary filter popups become a bottom sheet drawer
- Bottom sheet has explicit "Show N stays" Apply button (not instant-apply on mobile — prevents jarring empty states)
- Discovery cards scroll horizontally
- Grid: 1 column on narrow, 2 on wider mobile

### Spoke Page Adaptation

On spoke pages (`/[spoke]`):
- Tab dividers show spoke-specific categories instead of global categories
- Spoke persona framing: "Work-Friendly Stays" header, not just filter label
- Sawday's "Who's coming?" pattern — spoke pages feel like persona-based entry points
- Discovery cards show spoke-relevant vibes (e.g., on /work-friendly: "Fast WiFi + Desk Setup", "Minimalist Work Spaces")

### Accessibility

- Tab dividers: `role="tablist"` / `role="tab"` / `role="tabpanel"` with arrow-key navigation
- Subject strip dropdowns: listbox pattern with `aria-activedescendant`
- Result count: `aria-live="polite"` region announces count changes
- Focus management: after filter change, focus stays on the control; after closing popup, returns to trigger
- `prefers-reduced-motion`: all FLIP animations disabled, cards render in final position immediately
- All interactive elements: 44×44pt minimum touch target on mobile
- Keyboard: Tab into/out of filter groups, Arrow keys within, Escape to close popups

## Components Affected

| Component | Change |
|---|---|
| `FilterEngine.tsx` | Full rewrite — tabs, subject strip, discovery cards, FLIP grid |
| `filter-utils.ts` | Add facet count computation, discovery-card filter presets, "Curated" default logic |
| `StayCard.tsx` | Restyle as index card / postcard with postmark, stamp, metadata row |
| `DirectoryContent.tsx` | Update to pass facet data, adjust page header |
| `SpokeFilterBar.tsx` | Replace with spoke-adapted tab pattern |
| `globals.css` | Add tab-divider CSS (clip-path, perforation, stagger), card animations |

## What We're NOT Building

- No sidebar filter panel (prototype B)
- No horizontal pill bar (current implementation)
- No chip row for active filters
- No instant-apply on mobile filters
- No faceted search sidebar with checkboxes
- No conversational/wizard filtering
- No map-based filtering
- No AI-generated filter suggestions

## Success Criteria

1. "Curated" tab is the default — users see Editor's Picks first, not all 230+ stays
2. Filter interaction takes <2 seconds from click to visible result
3. Grid transition animation is smooth (60fps, no layout thrash)
4. Mobile experience is fully functional — no features amputated
5. WCAG 2.1 AA compliant — keyboard nav, screen reader, reduced motion
6. Filter state persists in URL (deep linkable, shareable)
7. Visual identity is unmistakably UniqueStaysUSA — not generic booking site

## Supersedes

- docs/plans/2026-05-12-013-feat-filter-engine-overhaul-plan.md (previous filter plan — functional but generic UI)
- Prototype A (newspaper index) and B (sidebar) — explored, not chosen
- Current FilterEngine.tsx sticky pill bar
