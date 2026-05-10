---
title: "fix: Detail page full-viewport immersive layout"
type: fix
status: active
date: 2026-05-09
---

# fix: Detail page full-viewport immersive layout

## Summary

The stay detail page intended a full-screen split layout — hero image left, scrollable editorial right — but shipped constrained inside a `maxWidth: 960` container with side padding. Four targeted fixes restore the immersive intent: expand the split frame to edge-to-edge `100dvh`, force the navbar into its opaque state (since the panel's internal scroll never fires `window.scrollY`), relocate the breadcrumb into the right panel with nav-clearance padding, and move the Related Stays section into the right panel's scroll so it isn't stranded below an unreachable page-scroll boundary.

---

## Problem Frame

The desktop split frame is padded (24px each side) and capped at `maxWidth: 960`, so it renders as a card centered on a cream background rather than an edge-to-edge viewport experience. The height kludge `calc(100dvh - 140px)` subtracts both nav and breadcrumb heights rather than letting the layout own the full viewport. Three compounding issues make the fix non-trivial: the navbar stays transparent forever on this route (internal panel scroll never triggers `window.scrollY`), the breadcrumb needs a new home, and the Related Stays grid below the frame becomes unreachable once the frame takes `100dvh`.

---

## Requirements

- R1. The desktop split frame fills exactly the viewport — full width, `height: 100dvh`, no outer padding or max-width constraint.
- R2. The navbar renders with its opaque cream background on all stay detail routes so it is readable over the cream right panel.
- R3. The breadcrumb ("Home · Spoke · Title") is relocated inside the right panel below the nav-clearance zone — not deleted.
- R4. The Related Stays section is accessible via the right panel's internal scroll, not stranded below a `100dvh` page-scroll boundary.

---

## Scope Boundaries

- Mobile layout is not changed (it is already a normal-scroll page, not the split frame).
- No changes to Navbar visual design; only the "force opaque" behavior is added.
- Related Stays moves inside the right panel; its grid layout and `StayCard` usage remain unchanged.

### Deferred to Follow-Up Work

- Sticky nav title on the right panel (show stay title in the nav when right panel is scrolled) — follow-up enhancement.
- Image-panel parallax on scroll — separate polish pass.

---

## Context & Research

### Relevant Code and Patterns

- `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx` — the entire split layout; all four units edit this file and the Navbar.
- `src/components/Navbar.tsx:47` — `scrolled` state controls `bg-transparent` vs cream background; uses `window.scrollY > 40`.
- `src/app/(app)/layout.tsx` — `<Navbar />` is always rendered above `{children}`; no route-group override available without restructuring.
- Nav heights: `h-16` (64px) mobile, `h-20` (80px) desktop (`md:h-20`).

### Key Constraints

- The right panel uses `overflowY: 'scroll'`, so `window.scrollY` never increments on this route. The navbar's scroll listener has no effect here; the navbar stays `bg-transparent` forever unless we intervene.
- `position: sticky; top: 0` within the scrollable right panel sticks relative to the panel's viewport edge (the browser treats the nearest scrolling ancestor as the sticky container). Setting `top: 80px` on the sticky ticket and adding equivalent top padding to the panel is the correct fix.

---

## Key Technical Decisions

- **Force navbar opaque via `usePathname`** (not a prop): the Navbar already imports `usePathname`. Add a `isDetailPage` boolean (`pathname.startsWith('/stays/')`) and merge it into the opacity condition so detail routes always render the opaque state. No prop threading needed.
- **Breadcrumb in right panel, not deleted**: moves just below the nav-clearance zone at the top of the right panel scroll area. Preserves SEO internal linking.
- **Related Stays moves inside right panel**: renders after the amenity stickers and disclosure, before the panel ends. Removes the dual-scroll trap — users scroll the right panel to see everything. The `<section>` wrapper style stays the same; just changes render location.
- **Right panel `overflowY: 'auto'` instead of `'scroll'`**: `scroll` always shows a scrollbar track even when content fits; `auto` only shows when content overflows. Changed as part of this fix.

---

## Open Questions

### Resolved During Planning

- *Should we keep the breadcrumb?* Yes — relocate inside right panel. Removing it loses both UX wayfinding and internal SEO links.
- *Related Stays: move or remove?* Move inside right panel. Related cards are a key conversion driver; removing them is not acceptable.
- *How to handle nav opacity without a layout-level prop?* `usePathname` inside Navbar — it's already imported and the pattern is already used for `isOnSpoke`.

### Deferred to Implementation

- Exact pixel value of top padding/sticky offset: plan uses `80px` (desktop nav `h-20`); implementer should visually verify it clears the nav with a small buffer (suggest `84px` to `92px`).

---

## Implementation Units

### U1. Expand desktop split frame to full viewport

**Goal:** Remove the `maxWidth`, outer padding, and border-radius from the desktop wrapper so the split frame is truly edge-to-edge and full-height.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx`

**Approach:**
- The outer desktop `<div>` (`className="hidden lg:block"`) currently has `padding: '0 24px 32px'`. Change to `padding: 0`.
- The inner container currently has `maxWidth: 960, margin: '0 auto', borderRadius: 3, boxShadow: '0 20px 80px …'`. Remove `maxWidth` and `margin: '0 auto'`. Remove `borderRadius` (edge-to-edge panels have no rounded outer corners). The `boxShadow` can be removed or reduced to a subtle bottom shadow only — implementer's call.
- Height: change from `calc(100dvh - 140px)` to `100dvh`. The fixed navbar no longer needs to be subtracted (it overlays; the right panel gets clearance via U3's padding instead).
- Change `minHeight: 500, maxHeight: 860` — the `maxHeight` cap can be removed since the intent is full-viewport. Keep `minHeight: 500` as a floor for very short viewports.

**Test scenarios:**
- Happy path: at 1440×900 viewport, split frame fills full width and exact viewport height with no cream margins visible.
- Edge case: at 1024×600 (near minimum), split frame is at least 500px tall and still fills full width.
- Edge case: at 1440×1200 (tall viewport), split frame fills to 1200px (no 860px cap).

**Verification:** No cream background visible to the left or right of the split frame on any desktop viewport width.

---

### U2. Force navbar opaque on stay detail routes

**Goal:** Ensure the navbar always shows its cream/opaque state on `/stays/[slug]` routes so it is readable over the cream right panel.

**Requirements:** R2

**Dependencies:** None (can land independently)

**Files:**
- Modify: `src/components/Navbar.tsx`

**Approach:**
- `usePathname` is already imported. Add `const isDetailPage = pathname.startsWith('/stays/')` alongside the existing `isOnSpoke` derivation.
- In the `header` className, change the conditional from `scrolled ?` to `(scrolled || isDetailPage) ?` so detail routes always render the opaque cream background and backdrop-blur.
- No visual change on any other route.

**Test scenarios:**
- Happy path: navigating to `/stays/any-slug` renders the navbar with cream background immediately (before any scroll).
- Regression: on `/collection`, the navbar starts transparent and only goes opaque after scrolling 40px.
- Regression: on `/journal`, same transparent-until-scroll behavior preserved.

**Verification:** Navbar text and logo are legible immediately on page load of any stay detail page without scrolling.

---

### U3. Nav-clearance padding + breadcrumb relocation

**Goal:** Prevent the sticky ticket stub from rendering behind the fixed navbar; relocate the breadcrumb to the top of the right panel's scroll area.

**Requirements:** R1, R3

**Dependencies:** U1 (full viewport height must be set before the sticky offset matters)

**Files:**
- Modify: `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx`

**Approach:**
- Remove the breadcrumb `<div>` from its current position above the desktop split frame. Keep the mobile breadcrumb if it exists in the mobile `<div className="lg:hidden">` block — verify this (the current breadcrumb is outside both the desktop and mobile sections, rendered for both; after removal from desktop it should only render on mobile, or be moved into each branch explicitly).
- In the right panel, add a nav-clearance zone as the first child: a `<div>` with `paddingTop: ~88px` (80px nav + small buffer) that contains the relocated breadcrumb at the bottom of that zone.
- Change the sticky ticket section's `top: 0` to `top: 80px` so when the right panel is scrolled, the ticket sticks just below the navbar.
- Change right panel's `overflowY: 'scroll'` to `overflowY: 'auto'`.

**Patterns to follow:**
- Breadcrumb markup is already written; just move the JSX block.

**Test scenarios:**
- Happy path: on desktop, the breadcrumb is visible inside the right panel above the ticket stub.
- Happy path: the sticky ticket, when scrolled to its sticky position, is fully below the opaque navbar with no overlap.
- Regression: breadcrumb still renders correctly on mobile (its position is unaffected by this change).
- Edge case: on a 1024px-wide desktop, the breadcrumb text does not overflow the right panel width.

**Verification:** No content is occluded by the navbar on the right panel at any scroll position.

---

### U4. Move Related Stays into right panel scroll

**Goal:** Eliminate the dual-scroll trap by rendering Related Stays inside the right panel, below the editorial content.

**Requirements:** R4

**Dependencies:** U1, U3 (right panel must be set up correctly first)

**Files:**
- Modify: `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx`

**Approach:**
- Move the existing Related Stays `<section>` JSX block from its position below the desktop split frame into the right panel `<div>`, after the affiliate disclosure paragraph and before the closing `</div>`.
- The section currently has `background: 'oklch(0.99 0.005 85)'` and a top border — this creates a visual break that still works well inside the scrollable panel. Adjust `borderTop` if it duplicates the disclosure's `paddingTop` border.
- The `py-16` padding, grid, and `StayCard` usage remain unchanged.
- The `fade-up` class on individual cards still works; the IntersectionObserver watches the document, not the scroll container, so animations trigger when cards enter the viewport regardless of which container scrolls.
- The desktop-only split frame wrapper (`className="hidden lg:block"`) currently wraps only the split frame. The Related Stays section currently sits outside that wrapper as its own sibling. After this change, the split frame wrapper contains the right panel which contains Related Stays. This is fine.

**Test scenarios:**
- Happy path: scrolling the right panel past editorial content reveals the Related Stays grid.
- Happy path: 4 related stay cards render in a 4-column grid at `lg` breakpoint within the right panel.
- Edge case: when `related.length === 0`, the section is absent and the panel ends cleanly at the disclosure.
- Integration: `fade-up` animations fire on the related cards when they scroll into the viewport via the right panel scroll.

**Verification:** On a 1440×900 viewport, scrolling the right panel to the bottom reveals Related Stays without requiring any page-level scroll.

---

## System-Wide Impact

- **Interaction graph:** Only `StayDetailContent.tsx` and `Navbar.tsx` change. No other routes, layouts, or components are affected.
- **Unchanged invariants:** Mobile layout, Related Stays card design, `StayCard` component, and all other pages' navbar behavior are explicitly unchanged.
- **State lifecycle risks:** None — these are pure layout/style changes with no data fetching or state mutations.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `IntersectionObserver` for `fade-up` observes document root, not scroll container | Confirmed: `rootMargin` on document-root observer works with internal scroll as long as cards enter the visual viewport. Test visually. |
| Exact `top` offset for sticky ticket varies by nav height at different breakpoints | Implementer: verify at `md` (80px nav) and also check if the tick-stub sticky `top` needs a `md:` breakpoint variant. |
| Breadcrumb currently renders outside desktop/mobile split — removing from desktop only requires care | Implementer: trace the breadcrumb JSX and verify it's correctly conditionally rendered per breakpoint after the move. |

---

## Sources & References

- Related code: `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx`
- Related code: `src/components/Navbar.tsx`
- Related code: `src/app/(app)/layout.tsx`
