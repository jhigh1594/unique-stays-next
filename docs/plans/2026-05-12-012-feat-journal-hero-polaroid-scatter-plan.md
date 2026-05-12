---
title: "feat: Journal hero full-viewport polaroid scatter"
type: feat
status: completed
date: 2026-05-12
---

# Journal Hero Full-Viewport Polaroid Scatter

## Summary

Redesign the journal hero from a two-column grid (text left, polaroid stage right) to a full-viewport composition where three polaroid cards scatter diagonally across the entire hero background, pinned with red pushpins and connected by dashed white lines. The text block remains positioned on the left but overlays the full-bleed landscape rather than sitting in its own grid column. This matches the reference design's corkboard/travel-journal aesthetic.

---

## Problem Frame

The current hero confines polaroids to a right-column "stage" container, creating a boxed-in feel that doesn't match the aspirational corkboard reference. The pushpins are cream-and-green SVG circles (not the warm red pushpins from the reference), connecting lines use the same green palette, and captions use Fraunces instead of the handwritten Caveat font. On screens below 900px the entire polaroid area is hidden. The goal is an immersive, full-viewport scatter that feels like cards pinned directly to a landscape.

---

## Requirements

- R1. Polaroid cards scatter diagonally across the full hero viewport (not confined to a right column)
- R2. Red pushpins with realistic radial-gradient styling (not green SVG circles)
- R3. White dashed connecting lines between pushpin positions
- R4. Handwritten-style captions (Caveat font) on polaroid cards
- R5. Text block overlaid on the left side of the full-bleed background
- R6. Graceful responsive degradation: full scatter on desktop, simplified on tablet, text-only on mobile
- R7. All animations respect `prefers-reduced-motion`
- R8. No hydration mismatches from client-only randomization

---

## Scope Boundaries

- Hero images remain hardcoded Unsplash URLs (not CMS-driven)
- Background image and Ken Burns animation stay as-is
- The archive grid section (plan 011) is not in scope
- Card hover interactions remain simple (lift + shadow), no mouse-parallax in this iteration
- No new dependencies — CSS-first animations, Caveat font already available via `var(--font-caveat)`

### Deferred to Follow-Up Work

- Mouse-follow parallax on polaroids (the postcard prototype has this pattern, could be added later)
- CMS-driven hero images (requires Vercel Blob pipeline)
- Card click-through to journal posts (currently `aria-hidden="true"`, cosmetic only)

---

## Context & Research

### Relevant Code and Patterns

- `src/app/(app)/journal/_journal/JournalHero.tsx` — current hero component with grid layout, SVG routes, and three absolute-positioned polaroids
- `src/app/(app)/globals.css` lines 441–804 — all journal hero CSS (Ken Burns, grid, polaroid stage, pins, routes, responsive, reduced motion)
- `prototypes/journal-hero-c-postcard.html` — has the most realistic red pushpin implementation with specular highlight
- `src/app/(app)/journal/_journal/JournalContent.tsx` — dispatch cards use CSS radial-gradient pushpins (`.dispatch-dossier__pin`) in terracotta, a proven pattern to follow
- `src/app/(app)/_home/Hero.tsx` — hydration-safe shuffle pattern (render deterministic, shuffle in `useEffect`)

### Institutional Learnings

- Hydration mismatch from client-only shuffle: fixed in commit `3d41308` — render deterministically on server, shuffle only after mount
- Hero images must go through `@vercel/blob` if made dynamic; not relevant here since images stay hardcoded
- Plan 011 (polaroid archive grid) is active and targets `globals.css` — coordinate CSS section boundaries to avoid conflicts

---

## Key Technical Decisions

- **Absolute positioning for cards relative to the hero section** (not a stage container). The hero section is already `position: relative` with `overflow: hidden`. Cards use `left/top/right/bottom` percentages to scatter across the full viewport. This avoids the containment issue of the current right-column stage.
- **CSS pushpins over SVG circles.** The dispatch card pattern (`.dispatch-dossier__pin`) uses `radial-gradient` with a specular highlight — proven in production, more visually realistic than SVG circles, and easier to position relative to each card. Each polaroid gets a `::before` pseudo-element for the pushpin.
- **SVG overlay stays for connecting lines**, but coordinate system changes. The current SVG uses `viewBox="0 0 100 100"` with `preserveAspectRatio="none"`. For full-viewport scatter, the SVG still covers the entire hero but path coordinates shift to match new card positions. Lines change from green to white.
- **Text block uses absolute positioning** instead of grid column. `position: absolute; left; top; max-width` keeps text on the left side without a grid constraining the polaroid area.
- **CSS-first animations** — no framer-motion for this component. The current pattern (CSS transitions triggered by `is-visible` class) works well and matches the design principle.

---

## Open Questions

### Resolved During Planning

- Layout approach: absolute positioning for both text and cards (vs. grid with overlay) — absolute chosen for maximum scatter freedom
- Pushpin implementation: CSS `::before` pseudo-element with radial-gradient (vs. SVG) — CSS chosen for visual fidelity, matching dispatch card pattern
- Font for captions: Caveat via `var(--font-caveat)` — already available in the design system

### Deferred to Implementation

- Exact card positions and tilt angles for full-viewport scatter — requires visual tuning in browser
- SVG path coordinates for connecting lines — must match final card positions
- Intermediate tablet breakpoint behavior (900–1200px) — may need experimentation

---

## Implementation Units

### U1. Refactor hero layout from grid to full-viewport overlay

**Goal:** Replace the two-column grid with a full-viewport absolute layout where text and polaroids overlay the background independently.

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Modify: `src/app/(app)/journal/_journal/JournalHero.tsx`
- Modify: `src/app/(app)/globals.css`

**Approach:**
- Remove `journal-hero__grid` two-column grid wrapper (flatten the structure)
- Retain `journal-hero__stage` but repurpose it as a full-viewport absolute overlay (`position: absolute; inset: 0`) instead of a right-column container — polaroids remain children of the stage
- Make `journal-hero__text` absolutely positioned (left side, vertically centered)
- Remove the grid `grid-template-columns: 1fr 1fr` and related gap/padding rules
- Keep the `is-visible` class toggle pattern for entrance animations

**Patterns to follow:**
- Current `.journal-hero` section is already `position: relative; min-height: 100svh; overflow: hidden` — the stage just needs to expand to fill it

**Test scenarios:**
- Happy path: Hero renders with full-viewport layout, text on left, no grid artifacts
- Happy path: `is-visible` class triggers all entrance animations as before

**Verification:**
- Hero renders full-width with text overlaid on left, polaroid area spanning entire viewport
- No visual regressions in the background, overlay, or tint layers

---

### U2. Reposition polaroids and redesign pushpins/route lines

**Goal:** Scatter 3 polaroid cards diagonally across the full viewport with red pushpins and white dashed connecting lines.

**Requirements:** R1, R2, R3

**Dependencies:** U1

**Files:**
- Modify: `src/app/(app)/journal/_journal/JournalHero.tsx`
- Modify: `src/app/(app)/globals.css`

**Approach:**
- Reposition `.journal-hero__polaroid--1/2/3` to scatter across the full viewport using percentage-based `left/top/right/bottom` values. Suggested starting positions inspired by the reference:
  - Card 1: left 8–12%, top 12–18%, tilt -3deg to -5deg (bottom-left-ish area, shifted left)
  - Card 2: left 38–45%, top 40–55%, tilt 1deg to 3deg (center, slightly below midpoint)
  - Card 3: right 5–10%, top 8–15%, tilt 2deg to 4deg (top-right area)
- Replace SVG circle pins (`.journal-hero__pin-outer`/`__pin-inner`) with CSS `::before` pseudo-elements on each card, following the dispatch card pushpin pattern verbatim:
  ```css
  background: radial-gradient(circle at 35% 30%, oklch(0.78 0.14 38), oklch(0.55 0.14 38));
  box-shadow: 0 2px 5px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.15);
  ```
  Positioned at top-center of each card, offset upward to look like it's "pinning" the card
- Update SVG route line colors from green (`oklch(0.55 0.1 150)`) to white (`oklch(0.97 0.01 85 / 0.6)`)
- Update SVG path `d` coordinates to connect new card positions
- Adjust line dash styling for the reference's thinner, more delicate white dashed feel

**Patterns to follow:**
- Dispatch card pushpin: `.dispatch-dossier__pin` in globals.css — proven radial-gradient pushpin with inset shadow
- Postcard prototype pushpin: has the specular highlight detail

**Test scenarios:**
- Happy path: 3 cards visible at scattered positions across full viewport
- Happy path: Red pushpins appear at top of each card
- Happy path: White dashed lines connect the three card positions
- Edge case: Cards don't overflow the hero section bounds
- Edge case: Cards don't overlap the text block (or overlap is intentional and readable)

**Verification:**
- Cards scatter diagonally across the full hero, not confined to right half
- Pushpins are red with depth (gradient + shadow), not flat green circles
- Connecting lines are white and dashed

---

### U3. Update card visual treatment

**Goal:** Refine polaroid card styling to match the reference — handwritten captions, adjusted proportions, and warm visual treatment.

**Requirements:** R4

**Dependencies:** U2

**Files:**
- Modify: `src/app/(app)/journal/_journal/JournalHero.tsx`
- Modify: `src/app/(app)/globals.css`

**Approach:**
- Change `.journal-hero__polaroid-caption strong` font from `var(--font-display)` (Fraunces) to `var(--font-caveat)` (Caveat) for handwritten feel
- Increase caption font size slightly (handwritten fonts render smaller at the same size)
- Change caption tag color from terracotta to the accent peach (`oklch(0.75 0.12 40)` or similar warm tone)
- Optionally adjust card width for full-viewport scatter — cards may be slightly larger since they have more room
- Ensure image filter treatment (sepia, desaturate) still reads as "developed film"

**Patterns to follow:**
- Caveat is the design system's handwritten accent font (`var(--font-caveat)`)
- Reference image captions use a cursive, personal style

**Test scenarios:**
- Happy path: Captions render in Caveat font
- Happy path: Card proportions look balanced at full-viewport scale

**Verification:**
- Captions use handwritten font, cards have warm polaroid feel

---

### U4. Responsive breakpoints and accessibility

**Goal:** Ensure the full-viewport scatter works across screen sizes and maintains reduced-motion support.

**Requirements:** R6, R7, R8

**Dependencies:** U2

**Files:**
- Modify: `src/app/(app)/globals.css`

**Approach:**
- **Desktop (1200px+):** Full-viewport scatter with all 3 cards, pushpins, and connecting lines
- **Tablet (900–1200px):** Reduce card count to 2 or tighten positions to prevent overlap with text. May shift cards rightward or reduce card width via `clamp()`
- **Mobile (<900px):** Hide polaroid stage entirely (existing pattern), text block switches from absolute to relative positioning within a padded container
- Update `prefers-reduced-motion` block to cover any new CSS properties (pushpin animations, new entrance keyframes)
- No client-only randomization — card positions are deterministic (hardcoded CSS), avoiding the hydration mismatch pattern from commit `3d41308`

**Patterns to follow:**
- Existing responsive pattern at 900px hides stage and collapses grid — extend with intermediate breakpoint
- Existing reduced-motion block at line 784 already collapses animations — extend to new elements

**Test scenarios:**
- Happy path: Full scatter renders on desktop (1200px+)
- Happy path: Graceful degradation on tablet (900–1200px) — no overlapping text/cards
- Happy path: Text-only hero on mobile (<900px) — no broken layout
- Edge case: Reduced motion users see all content instantly with no animation
- Edge case: No hydration mismatch from SSR (all positions are CSS-determined)

**Verification:**
- Hero works across all three breakpoints
- Reduced motion users see a functional, complete hero
- No React hydration warnings in console

---

## System-Wide Impact

- **Interaction graph:** The hero is a standalone section. Changes do not affect callbacks, middleware, or data flow. The `is-visible` class toggle pattern remains unchanged.
- **CSS namespace overlap:** Both this plan and plan 011 (polaroid archive grid) modify `globals.css` journal sections. Coordinate via section boundaries — hero CSS is lines 441–804, archive grid CSS starts after. Both plans should avoid editing each other's sections.
- **Unchanged invariants:** Background image URL, Ken Burns animation, overlay/tint gradients, and the `is-visible` entrance trigger all remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Card positions overlap text block on certain viewport widths | Use percentage-based positioning with `clamp()` for card widths; test at common breakpoints |
| SVG route line coordinates require manual tuning after card repositioning | Position cards first, then derive SVG path coordinates from the card center points |
| Plan 011 CSS changes conflict with hero CSS changes | Maintain clear section boundaries in globals.css; hero CSS is a self-contained block |
| Full-viewport absolute positioning behaves differently across browsers | Test in Chrome, Safari, Firefox; use `svh` units which have broad support |
| Reduced-motion users miss the visual interest of the scatter | Cards still render in final positions — animation collapse doesn't hide content |

---

## Sources & References

- Reference image: `ChatGPT Image May 11, 2026, 09_07_45 PM.png` (polaroid diagonal scatter with red pushpins)
- Current hero: `src/app/(app)/journal/_journal/JournalHero.tsx`
- Hero CSS: `src/app/(app)/globals.css` lines 441–804
- Pushpin pattern: dispatch card `.dispatch-dossier__pin` in globals.css
- Postcard prototype: `prototypes/journal-hero-c-postcard.html`
- Hydration fix: git commit `3d41308`
- Active parallel plan: `docs/plans/2026-05-11-011-feat-journal-polaroid-grid-plan.md` (archive grid, not hero)
