---
title: "feat: Individual stay detail pages (/stays/[slug])"
type: feat
status: active
date: 2026-05-08
---

# feat: Individual Stay Detail Pages

## Overview

Add individual listing pages at `/stays/[slug]` — the detail view a user lands on when they click a StayCard from the directory, spoke pages, or home page. These pages show full stay information with a prominent affiliate CTA, related stays, and spoke-specific details.

## Problem Frame

StayCard already links to `/stays/${stay.slug}` (see `src/components/StayCard.tsx` line 42), but no route exists — these links 404. The site needs individual listing pages to: (1) capture organic SEO traffic for specific stays, (2) give users detail before clicking through to book, (3) increase affiliate conversion by warming up the visitor with more context.

## Requirements Trace

- R1. Every stay renders at `/stays/{slug}` with full data from NormalizedStay
- R2. Pages are statically generated via `generateStaticParams` with ISR revalidation (1hr)
- R3. SEO metadata per page (title, description, Open Graph)
- R4. Affiliate CTA is the primary action — prominent, above the fold, platform-branded
- R5. Related stays section (same category, excluding current stay)
- R6. Spoke-specific details render when applicable (wifi speed, pet policy, EV charger, RV hookup)
- R7. Breadcrumb navigation back to home / spoke / directory
- R8. Follows the Wanderer's Postcard design system (Fraunces + Plus Jakarta Sans, oklch palette, polaroid aesthetic, stamp badges)

## Scope Boundaries

- No image gallery or carousel — single hero image only (gallery deferred to future iteration)
- No booking form or calendar — affiliate link redirects to platform
- No reviews section — ratings displayed but no review UI
- No map integration — location shown as text
- No JSON-LD structured data in this phase (can be added later for SEO boost)
- Does not change StayCard link behavior — it already links correctly

## Key Technical Decisions

- **RSC + client island pattern**: Follow the spoke page convention — RSC page fetches data and passes to a client island component. This keeps data fetching on the server and interactive features (scroll reveal, hover animations) on the client.
- **`dynamicParams = false`**: All stay pages are pre-generated at build time. Unknown slugs return 404 via `notFound()`.
- **Related stays query**: Fetch stays in the same category, limited to 4, excluding the current stay. Uses existing `normalizeStay` helper.
- **No new components in shared library**: The detail page is a page-level client island, not a reusable component. Related stays reuse the existing `StayCard` component.
- **`sponsored` rel on affiliate links**: All outbound booking links use `rel="noopener noreferrer sponsored"` for compliance.

## Implementation Units

- [ ] **Unit 1: Data layer — stay detail and related stays queries**

**Goal:** Add `getStayBySlug` and `getRelatedStays` to the data fetching layer.

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Modify: `src/lib/payload-queries.ts`

**Approach:**
- `getStayBySlug(slug: string)`: Look up by slug, depth=1 to populate category and spokes relationships. Return a single `NormalizedStay` or `null`. Wrap with `unstable_cache` keyed by slug, tagged `['stays']`, revalidate 3600.
- `getRelatedStays(categorySlug: string, excludeSlug: string)`: Find stays where category matches, exclude the current stay by slug, limit 4, depth=1. Return `NormalizedStay[]`. Wrap with `unstable_cache`.
- `getAllStaySlugs()`: Fetch all stay slugs for `generateStaticParams`. Return `string[]`. Lightweight query (depth=0, select only slug field). Wrap with `unstable_cache`.

**Patterns to follow:**
- `src/lib/payload-queries.ts` — existing `getStaysBySpoke`, `getAllStays`, `normalizeStay` pattern
- Cache key format: `['stays-by-slug']`, `['stays-related']`, `['stays-all-slugs']`

**Test scenarios:**
- Happy path: `getStayBySlug` with a known slug returns a fully normalized stay with populated category and spoke slugs
- Edge case: `getStayBySlug` with a non-existent slug returns `null`
- Happy path: `getRelatedStays` returns up to 4 stays in the same category, excluding the current stay
- Edge case: `getRelatedStays` with a category that has fewer than 4 stays returns what's available (including empty array)
- Happy path: `getAllStaySlugs` returns all slug strings with no nulls

**Verification:**
- All three queries exist and return correctly typed data
- Cache tags and revalidation match existing query conventions

---

- [ ] **Unit 2: RSC route page — data fetching and metadata**

**Goal:** Create the Next.js route at `/stays/[slug]` with static generation, metadata, and data fetching.

**Requirements:** R1, R2, R3

**Dependencies:** Unit 1

**Files:**
- Create: `src/app/(app)/stays/[slug]/page.tsx`

**Approach:**
- Export `dynamicParams = false` and `revalidate = 3600`
- `generateStaticParams()`: Call `getAllStaySlugs()`, return `[{ slug: string }]`
- `generateMetadata({ params })`: Build `<title>` as `"{stay.title} — {stay.location} | UniqueStaysUSA"`, description from stay description (truncated), Open Graph image from `stay.imageUrl`
- Default export: RSC component that calls `getStayBySlug` and `getRelatedStays`, returns `notFound()` if stay is null, otherwise renders `StayDetailContent` with the data

**Patterns to follow:**
- `src/app/(app)/[spoke]/page.tsx` — identical RSC pattern with `dynamicParams`, `generateStaticParams`, `generateMetadata`, and client island delegation
- `params` type is `Promise<{ slug: string }>` (Next.js 16 convention per AGENTS.md)

**Test scenarios:**
- Happy path: known slug renders the page with correct metadata
- Edge case: unknown slug returns 404 (since `dynamicParams = false`, this is build-time)
- Integration: `generateStaticParams` returns one entry per stay slug

**Verification:**
- `pnpm build` succeeds and generates pages for all stay slugs
- Visiting `/stays/{known-slug}` renders the detail page
- Visiting `/stays/nonexistent` returns 404

---

- [ ] **Unit 3: Client island — stay detail UI**

**Goal:** Build the full stay detail page component with hero, info sections, affiliate CTA, spoke-specific details, and related stays.

**Requirements:** R1, R4, R5, R6, R7, R8

**Dependencies:** Unit 2

**Files:**
- Create: `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx`

**Approach:**

Page layout (top to bottom):

1. **Hero section** — Full-width image with gradient overlay. Platform badge top-right. Editor's Pick / New badges top-left if applicable. Breadcrumb bar (Home > Spoke/Category > Stay title).

2. **Content grid** — Two-column layout (desktop): left column = main content, right column = sticky CTA sidebar.

   Left column:
   - Title (Fraunces, large) + subtitle
   - Location with MapPin icon + region
   - Star rating + review count
   - Full description text
   - Tags as stamp badges in a row
   - Spoke-specific detail card (when stay belongs to a spoke): work-friendly shows wifi speed + desk status; pet-friendly shows policy; RV shows hookup info; EV shows charger info. Conditional rendering based on `stay.spokes` array.

   Right column (sticky):
   - Price block (`$XXX/night`)
   - Primary CTA button: "Book on {Platform}" — links to `stay.affiliateUrl` with `target="_blank" rel="noopener noreferrer sponsored"`
   - Platform badge (colored per existing PLATFORM_STYLES)
   - Quick stats: sleeps, bedrooms

3. **Related stays** — Section with "More {category} stays" heading. Grid of up to 4 StayCards with `href={stay.affiliateUrl} external`. Category header with back-link to directory.

Design tokens (matching existing pages):
- Background: `oklch(0.975 0.012 85)` (warm cream)
- Dark sections: `oklch(0.22 0.01 60)` (dark brown)
- Accent: `oklch(0.55 0.14 38)` (warm amber)
- Fonts: Fraunces for headings, Plus Jakarta Sans for body
- `stamp-badge` class for badges, `fade-up` class for scroll reveal

**Patterns to follow:**
- `src/app/(app)/[spoke]/_spoke/SpokeContent.tsx` — client island structure, scroll reveal pattern, design token usage
- `src/app/(app)/_home/HomeContent.tsx` — hero section styling, breadcrumb pattern
- `src/components/StayCard.tsx` — platform badge colors (PLATFORM_STYLES)
- `src/lib/spokes-config.ts` — spoke accent colors for spoke-specific detail cards

**Test scenarios:**
- Happy path: all fields populated renders complete page with hero, info, CTA, related stays
- Edge case: stay with no rating or review count — rating section hidden gracefully
- Edge case: stay with no tags — tags section hidden
- Edge case: stay with no spoke-specific fields — spoke detail card not rendered
- Edge case: stay with no related stays (sole entry in category) — related section hidden
- Happy path: affiliate CTA opens correct platform URL in new tab with sponsored rel
- Happy path: breadcrumb links navigate to home, directory, and spoke pages correctly

**Verification:**
- Full page renders at `/stays/{slug}` with all sections
- Affiliate CTA is prominent and functional
- Related stays section shows StayCards linking externally
- Scroll reveal animations fire on viewport entry
- Responsive layout works on mobile (single column) and desktop (two columns)

## System-Wide Impact

- **Interaction graph:** No callbacks, middleware, or observers affected. This is a new read-only route.
- **Error propagation:** `notFound()` handles missing slugs. Payload query errors propagate to Next.js error boundary.
- **State lifecycle risks:** None — no state mutation. Statically generated with ISR.
- **API surface parity:** No other interfaces expose this data. The Payload REST API already serves stays.
- **Integration coverage:** `generateStaticParams` integration with Next.js build system is the only cross-layer concern.
- **Unchanged invariants:** StayCard link behavior unchanged. Affiliate link format unchanged. Data normalization unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Large number of static pages (~250) increases build time | Acceptable at current scale. Monitor build times; add `dynamicParams = true` with on-demand generation if build exceeds 5 min. |
| Stay images served from external CDN (Airbnb/VRBO) may be slow or blocked | Already the case for all pages. Accepted. Image optimization deferred to Blob migration. |
| Related stays query may return stale data after category changes | ISR revalidation (1hr) is acceptable. Cache tagged with `['stays']` for manual revalidation. |

## Sources & References

- Existing spoke page pattern: `src/app/(app)/[spoke]/page.tsx`
- Existing client island pattern: `src/app/(app)/[spoke]/_spoke/SpokeContent.tsx`
- Data layer: `src/lib/payload-queries.ts`
- Type definitions: `src/lib/types.ts`
- StayCard (already links to `/stays/${slug}`): `src/components/StayCard.tsx`
- Design tokens: `src/app/(app)/_home/HomeContent.tsx`
