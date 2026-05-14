---
title: "feat: Redesign journal archive as worn polaroid grid"
type: feat
status: active
date: 2026-05-11
origin: prototypes/journal-option-a-editorial.html
---

# feat: Redesign journal archive as worn polaroid grid

## Summary

Replace the current asymmetric 6n-column journal archive grid with a uniform 3-column "worn polaroid" layout. Cards become square-cropped polaroids with pin dots, aged photo filters (sepia, vignette, light leak), stamp badges, short descriptions, and subtle tilts — all pinned to a textured desk surface. This redesign targets only the archive board section (posts after the featured dispatch), leaving the hero and featured dispatch unchanged.

---

## Problem Frame

The journal archive grid uses a `5+3+3 / 4+4+4` repeating column pattern that produces cards of varying widths. Combined with content-dependent heights (title length, excerpt presence, image vs. paper-map), the grid feels chaotic rather than curated. The section reads as "CMS output" rather than a curated editorial corkboard. The brand personality — Wanderer, Editorial, Nostalgic — calls for analog warmth (polaroids, pins, stamps, grain) that the current rigid grid undermines.

---

## Requirements

- R1. All archive cards must be the same width (uniform 3-column grid)
- R2. Card images must use 1:1 square crop (polaroid proportions)
- R3. Cards must include pin dots, aged photo filters, and subtle tilts (-2 to +2 degrees)
- R4. Card captions must include title, short description (excerpt), and location
- R5. Select cards display stamp badges ("Verified", "Editor's pick", "New")
- R6. Image-less cards use the existing paper-map texture fallback
- R7. Existing tests must continue passing (content behavior, not CSS assertions)
- R8. Responsive: 2-column at ≤900px, single column at ≤560px
- R9. `prefers-reduced-motion` must disable hover animations
- R10. The featured dispatch and journal hero sections remain unchanged

---

## Scope Boundaries

- The journal hero section (`journal-index-hero`) is not changing
- The featured dispatch card at the top is not changing
- Individual journal post pages (`/journal/[slug]`) are not changing
- The PostmarkSVG component stays as-is (same SVG markup, new positioning only)
- Blog post data layer (Payload queries, types) is not changing

### Deferred to Follow-Up Work

- Section header redesign ("Pinned to the board" / "Dispatches from the road" copy) — can iterate after the grid lands
- Desk background texture — the prototype uses a wood-grain texture that may need performance testing; can be added incrementally
- Grain overlay intensity tuning — needs visual QA on real devices

---

## Context & Research

### Relevant Code and Patterns

- `src/app/(app)/journal/_journal/JournalContent.tsx` — `DispatchCard` component (lines 121-179), `JournalContent` export (lines 181-302)
- `src/app/(app)/globals.css` — journal-archive-board rules (lines 778-991), mobile overrides (lines 1430-1584), reduced-motion (line 1586)
- `src/app/(app)/journal/_journal/JournalContent.test.tsx` — 4 existing tests covering rendering, empty state, image-less fallback
- `src/lib/types.ts` — `NormalizedJournalPost` type with `excerpt` field already available
- Existing pin dots (`.dispatch-dossier__pin`) — keep and reposition
- Existing paper-map fallback (`.dispatch-dossier--paper`) — keep structure, update to polaroid proportions
- `prototypes/journal-option-a-editorial.html` — the approved visual prototype

### Institutional Learnings

- No `docs/solutions/` directory exists yet
- Previous plan `2026-05-10-010` restructured the board from a duplicated ledger+grid to the current single-archive-board layout — this plan builds on that structure

---

## Key Technical Decisions

- **Uniform grid over masonry**: `grid-template-columns: repeat(3, 1fr)` with no `:nth-child` column-span overrides. Solves the "different sizes" problem directly. (see prototype: journal-option-a-editorial.html)
- **Tilts at -2 to +2 degrees**: Reduced from prototype's -3 to +3.5 for a more intentional feel. Uses CSS custom property `--tilt` on each card via inline style, cycling through 4 values.
- **Pin position varied per card**: `--pin-x` custom property (35%-60%) offsets pins slightly off-center, mimicking real corkboard placement.
- **Aged photo filters via CSS `filter`**: `saturate(0.7) contrast(1.08) sepia(0.12) brightness(0.97)` on the `<img>`. Vignette + light leak via `::after` pseudo-element with `mix-blend-mode: multiply`. No JS processing of images.
- **Stamp badges as data-driven**: Add optional `stamp` field handling to DispatchCard. Initially determined by existing fields (`editorsPick`, `isNew`) or a new convention — defer exact mapping to implementation.
- **Polaroid frame via padding**: Thick top/side padding on the card (0.65rem), thin bottom padding that grows for the caption area. Background gradient simulates aged paper.
- **Remove `dispatch-dossier--lead` variant from archive**: All archive cards are uniform. The featured dispatch keeps its own separate layout.

---

## Open Questions

### Resolved During Planning

- Should the featured dispatch change? No — only the archive grid section.
- Should the PostmarkSVG change? No — same component, new positioning (corner of image instead of inline with heading).

### Deferred to Implementation

- Exact stamp badge field mapping: which posts get "Verified" vs "Editor's pick" vs "New" — needs to align with existing Payload fields (`editorsPick`, `isNew`) or be a manual convention.
- Grain overlay intensity: prototype uses 6% opacity; final value needs visual QA on retina and non-retina screens.

---

## Implementation Units

### U1. Rewrite archive grid CSS in globals.css

**Goal:** Replace the 12-column asymmetric grid with a uniform 3-column polaroid grid. Restyle cards with polaroid frame proportions, aged photo filters, vignette/light leak, pin dots, and stamp badges.

**Requirements:** R1, R2, R3, R5, R6, R8, R9

**Dependencies:** None

**Files:**
- Modify: `src/app/(app)/globals.css` (lines 778-991 and mobile overrides at 1430-1584)

**Approach:**

Replace the following CSS sections:
1. `.journal-archive-board__grid` — change from `repeat(12, minmax(0, 1fr))` to `repeat(3, 1fr)`. Remove all `.dispatch-dossier-link:nth-child(6n + ...)` column-span rules.
2. `.dispatch-dossier` — restructure as polaroid frame: `padding: 0.65rem 0.65rem 0`, background gradient for aged paper, updated border and shadow.
3. `.dispatch-dossier__pin` — reposition using `--pin-x` custom property instead of fixed `left: 50%`.
4. `.dispatch-dossier__image` — change from `aspect-ratio: 5/3` to `aspect-ratio: 1/1`. Add `::after` pseudo-element for vignette + light leak with `mix-blend-mode: multiply`.
5. Add image filter: `filter: saturate(0.7) contrast(1.08) sepia(0.12) brightness(0.97)` on `.dispatch-dossier__image img`.
6. `.dispatch-dossier__body` — reduce min-height, restructure for polaroid caption (title + excerpt + location).
7. Remove `.dispatch-dossier--lead` variant rules (only used for archive cards, not featured).
8. Update `.dispatch-dossier--paper` to `aspect-ratio: 1/1`.
9. Add `.dispatch-dossier__stamp` rules for stamp badges.
10. Update mobile overrides: 2 columns at ≤900px, 1 column at ≤560px.
11. Add tilt range -2 to +2 degrees.
12. Ensure `prefers-reduced-motion` disables hover transforms on the new structure.

**Patterns to follow:**
- Existing `.dispatch-dossier` structure and naming conventions
- Existing mobile override pattern in globals.css
- Existing `prefers-reduced-motion` block
- Prototype `prototypes/journal-option-a-editorial.html` for visual reference

**Test scenarios:**
- Test expectation: none — CSS-only changes, no behavioral logic. Visual QA in browser.

**Verification:**
- Archive grid renders 3 equal-width columns on desktop
- Cards show square images with aged photo appearance
- Pin dots appear at varied positions across cards
- Cards tilt subtly (-2 to +2 degrees)
- Stamp badges render on select cards
- Image-less cards show paper-map fallback at 1:1 ratio
- Grid collapses to 2 columns at ≤900px, 1 column at ≤560px

---

### U2. Rewrite DispatchCard component

**Goal:** Update the DispatchCard JSX to match the polaroid structure — simplified variant logic, repositioned postmark, added excerpt, pin with custom position, and stamp badge.

**Requirements:** R4, R5, R7

**Dependencies:** U1 (CSS must land for the component to render correctly)

**Files:**
- Modify: `src/app/(app)/journal/_journal/JournalContent.tsx` (DispatchCard function, lines 121-179)
- Test: `src/app/(app)/journal/_journal/JournalContent.test.tsx`

**Approach:**

1. Simplify variant logic: remove `dispatch-dossier--lead` and `dispatch-dossier--compact` distinction. All archive cards use the same base styles. Keep `dispatch-dossier--paper` for image-less cards.
2. Update tilt cycle to use 4 values between -2 and +2 degrees instead of the current -0.55 to 0.45 range.
3. Add `--pin-x` custom property to the card's inline style, cycling through varied positions (e.g., `['35%', '60%', '45%', '50%']`).
4. Move postmark SVG from inline with the heading (`dispatch-dossier__heading`) to absolute-positioned over the image corner (bottom-right), similar to the prototype.
5. Add excerpt (`post.excerpt`) to the caption area, between the title and location, with 2-line clamp.
6. Remove the "File 002" / "File 003" kicker — replace with location-based label ("Dispatch from Vermont", "Route notes") or just the location. The `journal-kicker` class can be removed from archive cards.
7. Remove the `dispatch-dossier__meta` footer ("Open file" CTA) — the caption area now just has title + excerpt + location.
8. Add optional stamp badge: a small absolutely-positioned element at top-right, conditionally rendered based on post fields (e.g., `post.editorsPick` → "Editor's pick", check for other flags).

**Patterns to follow:**
- Existing `DispatchCard` structure and prop interface
- Existing `PostmarkSVG` usage (same component, different positioning)
- Prototype HTML structure from `prototypes/journal-option-a-editorial.html`

**Test scenarios:**
- Happy path: Renders all posts with titles, excerpts, and locations in the archive grid
- Happy path: Postmark SVG renders on cards with images
- Edge case: Image-less card renders paper-map fallback, no broken image
- Edge case: Post with empty excerpt renders without excerpt element (no empty DOM node)
- Edge case: Post with empty city/state shows "Undisclosed location" fallback
- Existing test: 5 posts renders all titles once — must still pass
- Existing test: 1 post shows no archive board — must still pass
- Existing test: 0 posts shows empty state — must still pass
- Existing test: Image-less post shows fallback — must still pass

**Verification:**
- All 4 existing tests pass unchanged
- Cards render title + excerpt + location in the caption area
- Postmark appears over the image corner, not inline with heading
- Stamp badges appear on appropriate cards

---

### U3. Update section header and background styling

**Goal:** Restyle the "Filed dispatches" / "Routes from the desk" section header and add the desk-surface background texture to the journal board.

**Requirements:** R10 (header changes are additive, hero unchanged)

**Dependencies:** U1

**Files:**
- Modify: `src/app/(app)/globals.css` (journal-board and journal-archive-board__header sections)
- Modify: `src/app/(app)/journal/_journal/JournalContent.tsx` (section header JSX in the archive-board area)

**Approach:**

1. Update `.journal-archive-board__header` styling: terracotta kicker badge with slight rotation, larger Fraunces heading at weight 340, italic accent on emphasis text.
2. Update header copy in JSX: change "Pinned now" kicker to "Pinned to the board", update heading to include italic emphasis for visual interest.
3. Add desk-surface background to `.journal-board` or `.journal-archive-board`: subtle wood-grain texture via SVG noise filter in CSS, warm brown tones matching the prototype. Keep the existing inset shadow.
4. Ensure the background texture doesn't interfere with the hero section or featured dispatch above.

**Patterns to follow:**
- Existing `.journal-board` background pattern
- Prototype header styling from `prototypes/journal-option-a-editorial.html`

**Test scenarios:**
- Test expectation: none — visual/styling changes only. Existing tests assert content presence, not header copy or background.

**Verification:**
- Section header renders with new kicker and heading
- Background texture is visible but subtle behind the archive grid
- Hero section and featured dispatch remain visually unchanged above the archive

---

## System-Wide Impact

- **Interaction graph:** No callbacks, middleware, or observers are affected. The `DispatchCard` is a pure presentational component.
- **Error propagation:** No error paths changed.
- **State lifecycle risks:** None — no state management involved.
- **API surface parity:** No API changes. The `NormalizedJournalPost` type already includes the `excerpt` field.
- **Integration coverage:** No cross-layer interactions.
- **Unchanged invariants:** The featured dispatch layout, journal hero, individual post pages, ISR revalidation, and sitemap integration are all untouched.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Aged photo filters may look too heavy on some images | Implementation should use conservative filter values matching the prototype; can be tuned after visual QA |
| Square 1:1 crop may clip important parts of some hero images | `object-fit: cover` already handles this; some images may benefit from `object-position` adjustments (defer to visual QA) |
| Desk background texture SVG noise may impact render performance | Use a simple CSS gradient fallback if the SVG noise proves expensive; test on mid-range mobile devices |
| Stamp badge field mapping is unclear | Use existing `editorsPick` and `isNew` fields from the stays collection as signals; journal posts may not have these fields yet — render stamps only when data is available |

---

## Sources & References

- **Visual prototype:** `prototypes/journal-option-a-editorial.html`
- Previous plan: `docs/plans/2026-05-10-010-fix-journal-dispatch-board-plan.md`
- Existing CSS: `src/app/(app)/globals.css` (lines 778-991)
- Component: `src/app/(app)/journal/_journal/JournalContent.tsx`
- Tests: `src/app/(app)/journal/_journal/JournalContent.test.tsx`
- Types: `src/lib/types.ts` (lines 42-58)
