---
title: Build Cost Calculator Free Tool
status: active
date: 2026-06-03
origin: docs/plans/free-tool-strategy.md
---

# Build Cost Calculator Free Tool

## Problem Frame

The next free tool after the completed listing description generator is T11, the Unique Stay Building Cost Calculator. It should target long-tail searches like "how much does it cost to build a treehouse", "dome home cost", "yurt cost", and "glamping pod cost" while giving aspiring hosts a credible first-pass budget, ROI timeline, and next-step checklist.

## Scope

Build an end-to-end public tool at `src/app/(app)/build-cost-calculator` with deterministic estimates, no authentication requirement, and a polished product interface that follows the current editorial Field Kit pattern.

Out of scope for this pass:
- Paid detailed reports.
- Persisted lead capture or email automation.
- Live market data from Payload.
- A `/tools` index page, which the strategy lists as the next separate step.

## Design Direction

Register: product. The surface serves a task, but it should still feel like a UniqueStaysUSA field worksheet: warm paper, terracotta accents, restrained form controls, artifact-like result panels, and no generic SaaS calculator chrome.

Scene: an aspiring host is sketching a first budget at a kitchen table in the evening, comparing a treehouse, dome, or yurt before deciding whether to call a builder.

Color strategy: restrained. Use the existing cream, warm-white, sand, charcoal, terracotta, and forest vocabulary. No gradients, side-stripe accents, or identical feature-card grids.

## Implementation Units

### U1: Calculator Model

Files:
- Create `src/lib/build-cost-calculator/types.ts`
- Create `src/lib/build-cost-calculator/calculator.ts`
- Create `src/lib/build-cost-calculator/index.ts`
- Test `src/lib/build-cost-calculator/__tests__/calculator.test.ts`

Approach:
- Define supported structure types, finish levels, site complexity, regions, and input shape.
- Store cost ranges, nightly-rate ranges, occupancy assumptions, and operating expense assumptions in code.
- Calculate build cost range, furnished budget, contingency, financing-light annual net, annual gross, payback range, and recommendation notes.

Test scenarios:
- Treehouse estimates include higher complexity and produce a longer payback than a simple yurt with similar inputs.
- Region, finish level, and site complexity multipliers affect both low and high build ranges.
- Financing, permits, furnishings, contingency, gross revenue, net revenue, and payback fields are internally consistent.
- Invalid or out-of-range user inputs are normalized into usable defaults.

### U2: Product UI

Files:
- Create `src/app/(app)/build-cost-calculator/page.tsx`
- Create `src/app/(app)/build-cost-calculator/BuildCostCalculatorClient.tsx`
- Create route-local components as needed under `src/app/(app)/build-cost-calculator/_components/`

Approach:
- Use a single-page client calculator: inputs on the left, live result worksheet on the right for desktop, stacked on mobile.
- Include structure, region, finish, site complexity, size, projected nightly rate override, and financing toggle.
- Show estimate ranges, annual revenue, operating cost, payback timeline, and a host checklist.
- Include a non-blocking email-style CTA for future lead capture without building persistence in this pass.

Test scenarios:
- Initial state renders a complete estimate without requiring submission.
- Changing structure, finish, size, or nightly rate updates visible outputs.
- Errors or odd input values do not break the page.

### U3: Navigation and Discoverability

Files:
- Modify `src/components/Navbar.tsx`

Approach:
- Add Build Cost Calculator to the Field Kit dropdown as a host-facing tool.
- Ensure active-state detection includes the new route.

Test scenarios:
- Desktop and mobile Field Kit lists include the new calculator.
- Link path is `/build-cost-calculator`.

## Verification

- Run focused tests for `src/lib/build-cost-calculator`.
- Run type checking or build-oriented validation available in the repo.
- Start the Next.js dev server and inspect `/build-cost-calculator` on desktop and mobile.
- Check for console/runtime errors, text overflow, keyboard-reachable controls, and responsive layout quality.
