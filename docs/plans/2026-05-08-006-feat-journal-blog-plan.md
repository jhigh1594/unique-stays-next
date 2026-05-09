---
title: "feat: The Journal — editorial blog section (/journal)"
type: feat
status: active
date: 2026-05-08
origin: docs/brainstorms/2026-05-08-journal-requirements.md
---

# feat: The Journal — Editorial Blog (/journal)

## Summary

Adds The Journal — a field-dispatch editorial blog at `/journal` — by: (1) defining a `BlogPosts` Payload collection with a custom `StayEmbed` Lexical block, (2) wiring on-demand ISR revalidation via a Route Handler + `afterChange` hook (a new pattern for this project), (3) building a `StayPolaroidCard` component for inline polaroid stay embeds, (4) building the dispatch-board index page and the full dispatch-format detail page template, and (5) publishing the Joshua Tree first post via Payload admin.

---

## Problem Frame

No editorial content section exists. The site is a listing directory with no blog/journal capability. Without it, the GTM strategy's Tier 3 content (SEO city guides) and newsletter-to-post repurposing pipeline cannot launch. The first post targets "unique stays joshua tree" — a high-intent query with low competition. (see origin: `docs/brainstorms/2026-05-08-journal-requirements.md`)

---

## Requirements

- R1. `BlogPosts` Payload collection with fields: slug, title, subtitle, excerpt, heroImage, content (Lexical with StayEmbed), publishedAt, status, linkedStays, city, state, metaTitle, metaDescription
- R2. No `Authors` collection — single-author site
- R3. `afterChange` hook fires on-demand ISR revalidation when post `status` changes to `published`
- R4. `/journal` index page — published posts sorted by `publishedAt` desc, ISR, SEO metadata
- R5. `/journal/[slug]` detail page — ISR on-demand + 1hr fallback, SEO metadata, OG image, sitemap
- R6. SEO metadata on all journal routes: `<title>`, `<meta description>`, Open Graph image, canonical URL, sitemap inclusion
- R7. Stay cards render as polaroid cards floating inline in the post body, not a flat grid appended at the bottom
- R8. City guide post format: dispatch header with coordinates, circular postmark date, polaroid hero, stamp-styled section headings, reading compass, wax seal close
- R9. Joshua Tree first post written, published, accessible at `/journal/best-unique-stays-in-joshua-tree-california`

---

## Scope Boundaries

- No `Authors` collection or byline system
- No tags taxonomy or `/journal/[tag]` filter pages
- No programmatic `/journal/[state]/[city]` intersection pages
- No Beehiiv newsletter auto-publish integration
- No search within journal
- No comment system
- No dark mode

### Deferred to Follow-Up Work

- On-demand revalidation for the `Stays` collection — same Route Handler (U3) can be reused, wire `afterChange` hook in a follow-up
- Sitemap split across multiple files (single sitemap is fine at current scale)

---

## Context & Research

### Relevant Code and Patterns

- `src/collections/Stays.ts` — collection config template: field structure, access rules, section comments, sidebar admin for flags
- `src/lib/payload-queries.ts` — `unstable_cache` pattern with tags; all journal queries follow this exactly
- `src/app/(app)/stays/[slug]/page.tsx` — route pattern: `dynamicParams`, `revalidate`, `generateStaticParams`, `generateMetadata`, Server Component → client content component
- `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx` — `'use client'` content component with scroll effects
- `src/components/StayCard.tsx` — data shape reference; journal uses its own `StayPolaroidCard` variant
- `src/components/FilmstripSection.tsx` — reused as filmstrip divider between intro and stays sections in post template
- `src/payload.config.ts` — add `BlogPosts` to `collections`; `BlocksFeature` scoped at field level in `BlogPosts.content`
- `.impeccable.md` — Journal-specific design principles (dispatch metaphor, anti-patterns list)

### Institutional Learnings

- `push: false` in Payload config — schema changes require `pnpm migrate:create && pnpm migrate`; never skip
- `pnpm generate:types` must run after any schema change to update `payload-types.ts`
- `"type": "module"` — all new files must use ESM syntax
- `NEXT_PUBLIC_SERVER_URL` is the base URL for internal Payload calls

### External References

- Payload 3.84.x `BlocksFeature` pattern confirmed from `node_modules/@payloadcms/richtext-lexical` types
- `RichText` component + `converters` API from `@payloadcms/richtext-lexical/react` — current API in 3.84.x
- Next.js 16.2.6: `revalidateTag(tag, { expire: 0 })` — two-arg form confirmed from `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`
- On-demand revalidation must be called from a Route Handler, not directly from a Payload hook (hooks run outside Next.js request context)

---

## Key Technical Decisions

- **`dynamicParams = true` for `/journal/[slug]`**: diverges from the existing `false` on stay/spoke pages. New posts published post-deploy must render on first visit without a full rebuild. `false` is correct for fixed slug sets (spokes); wrong for a growing editorial section.
- **`BlocksFeature` scoped at field level**: registered on the `content` field's `editor` override in `BlogPosts.ts`, not on the global `lexicalEditor()` call. Prevents StayEmbed from appearing in Stays, Categories, or other rich text contexts.
- **Revalidation via Route Handler**: Payload `afterChange` hooks do not run within a Next.js request context — calling `revalidateTag` directly would be a no-op or error. The hook POSTs to `/api/revalidate` with a `REVALIDATE_SECRET` header; the Route Handler calls `revalidateTag(tag, { expire: 0 })`.
- **`StayPolaroidCard` as a new component**: separate from `StayCard`. The polaroid design (rotation, white border, handwritten caption, stamp CTA) is distinct enough to warrant a clean component — sharing `StayCard` would require unmanageable conditional branching.
- **`NormalizedJournalPost` type with pass-through `content`**: Lexical content is passed through as raw JSON to the client. `RichTextRenderer` handles deserialization. This avoids server-serializing the Lexical AST into HTML (which would break the custom StayEmbed block converter).

---

## Open Questions

### Resolved During Planning

- **`revalidateTag` two-arg form in v16?** Yes — `revalidateTag(tag, { expire: 0 })`. Confirmed from `node_modules/next/dist/docs/`.
- **`dynamicParams` for journal detail?** `true` — new posts must render post-deploy.
- **`BlocksFeature` scope?** Field-level on `BlogPosts.content`, not global.
- **`StayEmbed` block: `relationship` or text ID?** `relationship` to `stays` — Payload populates at `depth: 1` automatically.

### Deferred to Implementation

- **Joshua Tree stays in DB**: Check `stays` collection during U8 before writing content. If < 3 stays exist at "Joshua Tree, California", the post uses prose recommendations with affiliate links rather than StayEmbed blocks. Update after seeding more stays.
- **Hero image for first post**: Source a license-clear Joshua Tree desert/dome landscape from Unsplash. Upload via Payload media admin during U8.
- **`REVALIDATE_SECRET` env var**: Add to `.env.local` and Vercel environment before U3 is deployed.
- **Dispatch number format**: Hardcode `№001` for Joshua Tree first post. Automate (e.g., from `publishedAt` sort order) in a follow-up.
- **Coordinates per post**: Hardcode Joshua Tree coordinates in first post. Make this a Payload field (`latitude`, `longitude`) in a follow-up if more posts need different values.

---

## Output Structure

    src/
    ├── blocks/
    │   └── StayEmbed.ts                  (new)
    ├── collections/
    │   └── BlogPosts.ts                  (new)
    ├── components/
    │   ├── RichTextRenderer.tsx          (new)
    │   └── StayPolaroidCard.tsx          (new)
    └── app/
        ├── sitemap.ts                    (new or modify)
        ├── api/
        │   └── revalidate/
        │       └── route.ts              (new)
        └── (app)/
            └── journal/
                ├── page.tsx              (new)
                ├── _journal/
                │   └── JournalContent.tsx (new)
                └── [slug]/
                    ├── page.tsx          (new)
                    └── _post/
                        └── JournalPostContent.tsx (new)

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
Editor publishes post in Payload admin
         │
         ▼
BlogPosts.afterChange hook fires
         │
         ▼  POST /api/revalidate
         │  body: { tag: 'journal' }   + { tag: 'journal:${slug}' }
         │  header: x-revalidate-secret
         ▼
Route Handler: /api/revalidate/route.ts
         │  validates secret header
         ▼  revalidateTag('journal', { expire: 0 })
            revalidateTag('journal:${slug}', { expire: 0 })

Next visitor to /journal/[slug]
         │
         ▼  cache miss → Server Component renders
         │  getJournalPostBySlug(slug)
         │  └── unstable_cache, tags: ['journal', 'journal:${slug}']
         │       └── payload.find({ collection: 'blog-posts', depth: 1 })
         │           └── linkedStays populated at depth: 1
         ▼
JournalPostContent (client component)
    ├── Dispatch header (dispatch #, city/state, coordinates)
    ├── Postmark stamp (SVG, city arched, date, terracotta, rotated)
    ├── Polaroid hero image (white border, tilt, Fraunces italic caption)
    ├── Subtitle kicker + H1 title
    ├── RichTextRenderer
    │   └── stayEmbed blocks → StayPolaroidCard (float right desktop)
    ├── FilmstripSection (divider between intro and stays)
    ├── Reading compass (fixed, bottom-right, scroll-driven needle)
    └── Wax seal close + "More Dispatches" (2 related post cards)
```

---

## Implementation Units

### U1. `BlogPosts` collection + `StayEmbed` block definition

**Goal:** Define the two schema artifacts — `BlogPosts` collection and `StayEmbed` Lexical block — as standalone TypeScript files before wiring into Payload config.

**Requirements:** R1, R2, R3

**Dependencies:** None

**Files:**
- Create: `src/collections/BlogPosts.ts`
- Create: `src/blocks/StayEmbed.ts`

**Approach:**
- `BlogPosts.ts`: follow `Stays.ts` structure — export a named `CollectionConfig` constant, use section comments, sidebar admin for `status`, `slug`, and editorial flags.
- Access: `read: () => true`, write operations require `Boolean(user)`.
- `status` field: `type: 'select'`, options `draft` / `published`, default `draft`, sidebar position.
- `publishedAt`: `type: 'date'`, sidebar. Not required at the field level (set by editor on publish).
- `heroImage`: `type: 'upload'`, `relationTo: 'media'`.
- `content`: `type: 'richText'` with a **field-level `editor` override** that adds `BlocksFeature({ blocks: [StayEmbedBlock] })` alongside the default features. This scopes StayEmbed to BlogPosts content only — not global.
- `linkedStays`: `type: 'relationship'`, `relationTo: 'stays'`, `hasMany: true`, optional.
- `latitude` / `longitude`: `type: 'text'`, optional sidebar fields. Used by the index card coordinates line and dispatch header. Example: `"34.1347"` / `"-116.3116"`.
- `afterChange` hook: fire revalidation in two cases — (1) `doc.status === 'published'`, (2) `previousDoc?.status === 'published' && doc.status === 'draft'` (unpublish). Both cases POST to `/api/revalidate` with `x-revalidate-secret` header and bodies `{ tag: 'journal' }` + `{ tag: \`journal:${doc.slug}\` }`. Wrap all fetches in `try/catch` — revalidation failure must never block the save.
- `StayEmbed.ts`: standard `Block` type — `slug: 'stayEmbed'`, `interfaceName: 'StayEmbedBlock'`, single field: `stay` as `type: 'relationship'`, `relationTo: 'stays'`, required.

**Patterns to follow:**
- `src/collections/Stays.ts` — field structure, access rules, section comment style
- `src/payload.config.ts` — how `lexicalEditor()` is currently configured (to understand how to add `BlocksFeature` at field level)

**Test scenarios:**
- Happy path: `BlogPosts` document with all required fields (`slug`, `title`, `excerpt`, `status: 'draft'`) creates without validation errors
- Happy path: setting `status: 'published'` triggers `afterChange` hook — verify the POST to `/api/revalidate` fires (mock `fetch` in unit test or check dev server logs)
- Edge case: `afterChange` hook fails (revalidate endpoint unreachable) — save succeeds, error is caught and logged, not thrown
- Edge case: `status: 'draft'` on create — revalidation POST does NOT fire

**Verification:**
- `BlogPosts.ts` exports a valid `CollectionConfig` with no TypeScript errors
- `StayEmbed.ts` exports a valid `Block` with no TypeScript errors

---

### U2. Wire into `payload.config.ts` + generate types + migrate

**Goal:** Register `BlogPosts` in the Payload config, generate updated TypeScript types, and run the database migration to create the `blog_posts` table in Neon.

**Requirements:** R1

**Dependencies:** U1

**Files:**
- Modify: `src/payload.config.ts`
- Auto-generated (do not edit): `src/payload-types.ts` (updated by `pnpm generate:types`)
- Auto-generated: new migration file in `src/migrations/` (created by `pnpm migrate:create`)

**Approach:**
- Import `BlogPosts` from `./collections/BlogPosts` and add to the `collections` array.
- The `BlocksFeature` is already scoped at the field level in `BlogPosts.ts` — no change needed to the global `editor: lexicalEditor()` call.
- Run in sequence: `pnpm generate:types` → `pnpm migrate:create` → `pnpm migrate`.
- Verify migration by checking that Neon contains `blog_posts` (and join tables for `linkedStays` relationship) after `pnpm migrate` exits 0.

**Patterns to follow:**
- Existing collection import pattern in `src/payload.config.ts`

**Test scenarios:**
- Test expectation: none — this unit is schema scaffolding. Correctness is verified by Neon table creation and TypeScript compilation.

**Verification:**
- `pnpm generate:types` exits 0; `src/payload-types.ts` contains `BlogPost` type
- `pnpm migrate` exits 0; Neon contains `blog_posts` table
- `pnpm dev` starts without errors

---

### U3. On-demand revalidation Route Handler

**Goal:** Create a secured `/api/revalidate` POST endpoint that accepts a cache tag name and calls `revalidateTag` to bust ISR cache on demand. This is a project-wide utility — BlogPosts uses it first; Stays can be wired in a follow-up.

**Requirements:** R3

**Dependencies:** None (independent of U1/U2 — can be built in parallel)

**Files:**
- Create: `src/app/api/revalidate/route.ts`

**Approach:**
- `POST` handler. **First guard**: if `!process.env.REVALIDATE_SECRET`, return 500 immediately — an unconfigured secret must never match `undefined`. Read `x-revalidate-secret` header, compare against the secret. Return 401 if mismatch.
- Parse body for `tag: string`. Return 400 if `tag` is absent or not a string. Call `revalidateTag(tag, { expire: 0 })`. Return `{ revalidated: true, tag }`.
- Note: `src/app/api/revalidate/` lives outside the `(app)` route group — it is an API-only route, no layout wrapping.
- `REVALIDATE_SECRET` must be added to `.env.local` and Vercel env vars before first deployment of this route.

**Patterns to follow:**
- Existing Route Handler at `src/app/api/search/route.ts` (if present) for Next.js App Router conventions

**Test scenarios:**
- Happy path: `POST /api/revalidate` with correct secret + `{ tag: 'journal' }` → 200 `{ revalidated: true }`
- Error path: POST with wrong or missing secret → 401 `{ error: 'Unauthorized' }`
- Error path: POST with missing `tag` in body → 400 or graceful handling without unhandled exception
- Integration: after `afterChange` hook fires and posts to this endpoint, a subsequent request to `/journal/[slug]` is not served from stale cache (verify in dev by checking ISR revalidation in Next.js dev logs)

**Verification:**
- Manual `curl` with correct secret returns 200
- Manual `curl` with wrong secret returns 401
- No TypeScript errors; route exports a named `POST` function

---

### U4. Journal query functions + `NormalizedJournalPost` type

**Goal:** Add `NormalizedJournalPost` type and three query functions to the existing query layer following the established `unstable_cache` pattern exactly.

**Requirements:** R4, R5, R7

**Dependencies:** U2 (types generated — `BlogPost` type must exist in `payload-types.ts`)

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/payload-queries.ts`

**Approach:**
- `NormalizedJournalPost` type in `types.ts`: `id`, `slug`, `title`, `subtitle`, `excerpt`, `heroImageUrl` (string), `publishedAt` (string), `city`, `state`, `metaTitle`, `metaDescription`, `linkedStays: NormalizedStay[]`, `content` (pass through as `unknown` or `Record<string, unknown>` — the Lexical AST; typed by `@payloadcms/richtext-lexical` in the renderer).
- `normalizeJournalPost(doc)` helper: same shape as `normalizeStay()` — reads the raw Payload document, resolves `heroImageUrl` from `heroImage.url` using the existing `resolveImageUrl` helper. Sanitize `affiliateUrl` from any populated `linkedStays`: only pass through values that start with `https://`; replace anything else with `''` to prevent insecure or relative URLs propagating to `StayPolaroidCard`.
- `getAllJournalPosts()`: published only (`where: { status: { equals: 'published' } }`), sorted `publishedAt: 'desc'`, `limit: 50`, `depth: 0`. Cache tags: `['journal']`, `revalidate: 3600`.
- `getJournalPostBySlug(slug)`: single post, `depth: 1` (populates `linkedStays` → `NormalizedStay[]`). Cache tags: `['journal', \`journal:${slug}\`]`. Returns `null` if not found.
- `getAllJournalSlugs()`: slugs only for `generateStaticParams`, `depth: 0`. Cache tags: `['journal']`.

**Patterns to follow:**
- All existing functions in `src/lib/payload-queries.ts` — exact `unstable_cache` wrapper shape, `normalizeStay()` normalization pattern

**Test scenarios:**
- Happy path: `getAllJournalPosts()` returns only `status: 'published'` posts, sorted newest first
- Happy path: `getJournalPostBySlug('best-unique-stays-in-joshua-tree-california')` returns post with `linkedStays` populated as `NormalizedStay[]`
- Edge case: `getJournalPostBySlug('nonexistent-slug')` returns `null`
- Edge case: post with no `linkedStays` returns `linkedStays: []` — no crash
- Edge case: post with no `heroImage` (only `heroImageUrl` not applicable here — all images via Media upload) returns `heroImageUrl: ''` — no crash
- Edge case: post with no `subtitle` or `city` returns those fields as empty string — no crash

**Verification:**
- TypeScript compiles cleanly in both modified files
- `getAllJournalPosts()` callable from a Next.js Server Component returns an array

---

### U5. `StayPolaroidCard` component

**Goal:** Build the polaroid-format stay card used for inline StayEmbed rendering in post bodies and the "More Dispatches" section.

**Requirements:** R7, R8

**Dependencies:** None (can be built in parallel with U3/U4)

**Files:**
- Create: `src/components/StayPolaroidCard.tsx`

**Approach:**
- Props: `stay: NormalizedStay`, optional `rotation?: number` (degrees, default computed from index or random ±2°), optional `size?: 'sm' | 'md'` (default `'md'`).
- **Structure** (outer to inner):
  1. Wrapper div: white background, drop shadow `shadow-lg`, `transform rotate-[{rotation}deg]`. Transition: on hover → `rotate-0`, `translateY(-4px)`, deeper shadow. Width ~240px desktop, full-width mobile.
  2. Image block: `next/image`, fills top ~75% of card. No border-radius on image (polaroid is rectangular).
  3. Caption block (~25% of card, white): stay name in Fraunces italic ~14px. Location in Plus Jakarta Sans, muted, ~12px.
  4. "Book It →" CTA: terracotta background rectangle, small all-caps Plus Jakarta Sans. Links to `stay.affiliateUrl` with `target="_blank" rel="noopener noreferrer"`. NOT a `<button>` — an `<a>` styled as a stamp label.
  5. Platform badge: `✦ {platform}` as a small overlay badge on the image, top-right, terracotta background.
- **Layout behavior**: on `md:` breakpoint, the card is wrapped in a container with `float-right ml-6 mb-4`. On mobile, `float-none w-full`.
- Use `'use client'` only if hover state requires `useState`; otherwise handle via Tailwind `group-hover` and CSS transitions.

**Patterns to follow:**
- `src/components/StayCard.tsx` — `NormalizedStay` data shape, `next/image` usage, affiliate link pattern
- `.impeccable.md` Journal design principles — polaroid aesthetic, terracotta stamp CTA

**Test scenarios:**
- Happy path: renders with valid `stay` prop — title, location, and affiliate link present in output
- Happy path: affiliate link has `target="_blank"` and `rel="noopener noreferrer"` for security
- Edge case: `stay.imageUrl === ''` — `next/image` renders a fallback without crashing (provide a fallback src or `onError` handler)
- Edge case: `stay.affiliateUrl` is empty — CTA still renders but links to `#` (or omits the link) — no crash
- Visual (manual): card has rotation; on hover rotation returns to 0° and card lifts

**Verification:**
- Component renders without TypeScript errors or React warnings
- Affiliate link present and correct
- No layout shift when card appears in post body flow

---

### U6. `/journal` index page — dispatch board

**Goal:** Build the `/journal` listing page as a dispatch board of pinned index cards, with ISR and full SEO metadata.

**Requirements:** R4, R6

**Dependencies:** U4

**Files:**
- Create: `src/app/(app)/journal/page.tsx`
- Create: `src/app/(app)/journal/_journal/JournalContent.tsx`

**Approach:**
- `page.tsx`: Server Component. `export const revalidate = 3600`. Calls `getAllJournalPosts()`. Passes posts to `JournalContent`.
- `generateMetadata`: `title: "The Journal | UniqueStaysUSA"`, `description: "Field dispatches from extraordinary places across America."`. No OG image override (use site default).

**`JournalContent.tsx`** — dispatch board layout, finalized from `prototypes/journal-home.html`:

**Header typography:**
- Two-line treatment: `<span>The</span>` (italic Fraunces light, ~36–48px, muted `var(--mu)`) on line 1; `<span>Journal</span>` (roman Fraunces light, ~72–144px responsive, terracotta `var(--tc)`) on line 2. "Journal" is explicitly roman (not italic) — the Fraunces italic uppercase J has a dramatic descending swash at display size that reads as an error. Color carries the editorial emphasis instead.
- Ghost `"DISPATCHES"` watermark: absolute-positioned, Fraunces 600, ~13vw, terracotta at 3.2% opacity, centered behind the header.
- Subhead: Fraunces italic 300, ~16px, muted. Dispatch count in small muted monospace below.

**Board structure:**
1. **Featured dispatch** (latest post, above the masonry grid):
   - Desktop: CSS grid, `grid-template-columns: 58% 42%`. Image fills left column (min-height ~360px). Card body right column, flex column, vertically centered.
   - Mobile: stacked (image top, body below), same as regular cards.
   - Rotation: `−0.5deg` (subtler than regular cards).
   - Pin: positioned at `left: 35%` (left-of-center, signals "just pinned").
   - `"Latest Dispatch"` stamp badge: terracotta border-only (no fill), 2px border, rotated `−5deg`, positioned top-left of image. Border-only treatment simulates ink impression vs filled badge.
   - Postmark: 84px SVG, overlapping image bottom-right at `bottom: −26px, right: 20px`.
   - Title: `clamp(24px, 2.5vw, 32px)`.
   - Excerpt: `max-width: 540px`, `font-size: 14px`.

2. **Regular dispatch cards** (masonry grid, CSS `columns`):
   - `columns-1 sm:columns-2 lg:columns-3`, `column-gap: 28px`.
   - Card image: full bleed top, `height: 210px`, `object-fit: cover`, gradient scrim `rgba(44,40,37,0.32)→transparent` at bottom 80px so postmark reads against image.
   - Postmark: 72px SVG, `position: absolute, bottom: −22px, right: 16px` within `.card-img-wrap`. Per-card rotation varies: `nth-child(3n+1): −12deg`, `nth-child(3n+2): +6deg`, `nth-child(3n): −4deg`.
   - Card body (below image): coordinates → dispatch number → title → excerpt → footer.
   - **Coordinates line**: `34.1347° N · 116.3116° W` format (4 decimal places). Font: Plus Jakarta Sans, 9px, `letter-spacing: 0.12em`, muted 70% opacity. Sourced from `post.coordinates` field (add `latitude`/`longitude` text fields to `BlogPosts` — see open question below).
   - **Dispatch number**: `DISPATCH №001`, 9px, terracotta, `letter-spacing: 0.22em`, with a short `::after` rule `(flex: 1; max-width: 20px; height: 1px; background: var(--sd))`.
   - Card rotations: `nth-child(3n+1): −1.8deg`, `nth-child(3n+2): +1.4deg`, `nth-child(3n): −0.7deg`.
   - Pin positions: `nth-child(3n+1): left 42%`, `nth-child(3n+2): left 56%`, `nth-child(3n): left 48%`. Avoids the mechanical centered-pin look.
   - Hover: `rotate(0deg) translateY(−8px)`, deeper shadow, image `scale(1.04)` + slight desaturation lift, postmark straightens to `rotate(0deg) scale(1.06)`.

3. **Staggered entrance animation**: `@keyframes card-in` — `opacity: 0, translateY(28px)` → `opacity: 1, translateY(0)`, each card delayed by `0.08s` per index.

4. **Empty state**: single centered card — `"The first dispatch is coming soon. ✦"` in Fraunces italic.

**Postmark SVG anatomy** (same for featured and regular cards):
- Outer circle: `stroke-dasharray: 3 2.5` (perforated ring).
- Inner circle: `stroke-width: 0.75`.
- Background fill circle: `fill: rgba(250,248,243,0.92)` so stamp reads over dark image.
- City name arched top: `<textPath>` on `M 10,40 A 30,30 0 0,1 70,40`, `startOffset="50%"`, `text-anchor="middle"`. Font-size varies 5.5–7px based on city name length.
- State arched bottom: `<textPath>` on `M 10,40 A 30,30 0 0,0 70,40`.
- Date centered: `x="40" y="43"`, `font-size: 7px`.
- ✦ separators: `x="26"` and `x="54"`, `y="52"`, `font-size: 6px`.
- Fallback: if `post.city` is absent, top arc shows `"DISPATCH"`.

**Patterns to follow:**
- `src/app/(app)/[spoke]/page.tsx` + `SpokeContent.tsx` — Server Component + client split
- `prototypes/journal-home.html` — finalized design reference (CSS tokens, card anatomy, postmark SVG)
- `.impeccable.md` Journal-specific design principles and anti-patterns

**Test scenarios:**
- Happy path: renders with 1+ published posts — all cards show title, coordinates, and excerpt
- Happy path: `"Read Dispatch →"` links point to correct `/journal/${post.slug}` URLs
- Happy path: first post renders as featured card (two-column on desktop), remaining posts in masonry
- Edge case: `getAllJournalPosts()` returns `[]` — empty state message renders, no crash
- Edge case: `getAllJournalPosts()` returns exactly 1 post — featured card only, no masonry grid rendered
- Edge case: post with no `city` — postmark top arc shows `"DISPATCH"` fallback, no crash
- Edge case: post with no `latitude`/`longitude` — coordinates line hidden (not rendered), no crash
- SEO: `<title>` equals `"The Journal | UniqueStaysUSA"` in rendered HTML metadata
- Accessibility: heading hierarchy — H1 is `"The Journal"`, each card title is H2; cards keyboard-navigable; link text is descriptive
- Visual (manual): cards have alternating rotations; hover straightens and lifts; featured card renders two-column at ≥760px, stacked on mobile

**Verification:**
- `GET /journal` returns 200 with dispatch board rendered
- Featured dispatch renders at top, masonry grid below
- SEO title tag present in page HTML
- No TypeScript errors; no console errors in dev

---

### U7a. `/journal/[slug]` detail page — functional shell

**Goal:** Build a working post page: routing, ISR, SEO metadata, `RichTextRenderer` with StayEmbed support, and the structural template (dispatch header, hero, title, body, filmstrip, wax seal close). Editorial chrome (reading compass, stamp headings, torn-paper blockquotes) comes in U7b.

**Requirements:** R5, R6, R8

**Dependencies:** U4, U5, U3 (revalidation wired)

**Files:**
- Create: `src/app/(app)/journal/[slug]/page.tsx`
- Create: `src/app/(app)/journal/[slug]/_post/JournalPostContent.tsx`
- Create: `src/components/RichTextRenderer.tsx`

**Approach:**

**`page.tsx`:**
- `export const dynamicParams = true` — diverges from existing `false` pattern; new posts must render post-deploy
- `export const revalidate = 3600` (fallback TTL; on-demand revalidation overrides via U3)
- `generateStaticParams`: calls `getAllJournalSlugs()` — pre-builds all published posts at deploy time
- `generateMetadata`: `title` from `metaTitle ?? \`${post.title} | UniqueStaysUSA\``, `description` from `metaDescription ?? post.excerpt`, OG image from `heroImageUrl`, canonical URL
- `notFound()` when `getJournalPostBySlug` returns null

**`RichTextRenderer.tsx`:**
- Thin RSC wrapper around `RichText` from `@payloadcms/richtext-lexical/react`
- `converters` prop: spread `defaultConverters`, add `blocks: { stayEmbed: ({ node }) => { const stay = node.fields?.stay; if (!stay) return null; return <StayPolaroidCard stay={stay} />; } }`
- **Null-guard is required**: a StayEmbed block referencing a deleted stay will have `node.fields.stay === null`. Return `null` from the converter — do not pass null to `StayPolaroidCard`.
- Renders nothing (returns null) if `content` is nullish

**`JournalPostContent.tsx`** — structural template. Structure top to bottom:

1. **Dispatch header**: `DISPATCH №001` + city/state all-caps + coordinates (from `post.latitude`/`post.longitude` — hidden if absent). Plus Jakarta Sans, letter-spaced, small.
2. **Postmark**: SVG circle stamp (city arched, date at center), terracotta, −3° rotation. Absolute-positioned top-right of dispatch header.
3. **Polaroid hero**: `next/image` inside a white-bordered frame, +1.5° rotation, drop shadow. Fraunces italic caption beneath (from `post.subtitle` or image alt).
4. **Subtitle kicker**: `✦ {post.subtitle}` in Plus Jakarta Sans small-caps, terracotta. Rendered only when `post.subtitle` is present.
5. **H1 title**: Fraunces, ~52px, full weight, charcoal.
6. **Body**: `RichTextRenderer` renders Lexical content. Prose wrapper styles: lede `p:first-of-type` in Fraunces italic ~20px, body paragraphs Plus Jakarta Sans 17–18px line-height 1.75, max-width 680px. (Stamp H2 and torn-paper blockquote styles deferred to U7b.)
7. **Filmstrip divider**: `<FilmstripSection stays={post.linkedStays} />` between editorial intro and stays section. Only rendered when `post.linkedStays.length > 0`.
8. **Post close**: thin terracotta rule with `✦` center. `"VETTED ✦ UNIQUESTAYSUSA"` circular stamp motif.
9. **"More Dispatches"**: 2 related posts from `getAllJournalPosts()` excluding current slug, rendered as index cards.

**Patterns to follow:**
- `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx` — scroll effects pattern
- `src/components/FilmstripSection.tsx` — prop shape
- `.impeccable.md` — dispatch template anti-patterns

**Test scenarios:**
- Happy path: `GET /journal/best-unique-stays-in-joshua-tree-california` → 200, full template renders
- Happy path: Lexical rich text with StayEmbed blocks renders `StayPolaroidCard` for each embedded stay
- Happy path: `RichTextRenderer` with no StayEmbed blocks renders prose only, no crash
- Edge case: StayEmbed block referencing a deleted/null stay — converter returns `null`, no crash, no broken card in DOM
- Edge case: post with no `subtitle` — kicker absent, H1 at top, no crash
- Edge case: post with no `latitude`/`longitude` — coordinates line hidden, no crash
- Edge case: `post.linkedStays` is empty — FilmstripSection not rendered, no crash
- Edge case: `GET /journal/nonexistent-slug` → 404
- Edge case: slug post-`generateStaticParams` (`dynamicParams = true`) → ISR on first visit, returns 200
- SEO: `<title>` uses `metaTitle` when set, falls back to `"{title} | UniqueStaysUSA"`
- SEO: `og:image` present when `heroImageUrl` non-empty
- Accessibility: H1 (post title) → H2 (section headings), no skipped levels

**Verification:**
- `GET /journal/best-unique-stays-in-joshua-tree-california` returns 200
- OG metadata in `<head>`
- No React console errors in dev

---

### U7b. Post template — editorial chrome

**Goal:** Layer the dispatch-specific editorial details on top of the functional shell from U7a: stamp-styled H2 section headings, torn-paper blockquotes, and the fixed reading compass needle.

**Requirements:** R8

**Dependencies:** U7a

**Files:**
- Modify: `src/app/(app)/journal/[slug]/_post/JournalPostContent.tsx`
- Modify: `src/components/RichTextRenderer.tsx` (or CSS module co-located with `JournalPostContent`)

**Approach:**

**Stamp H2 headings:**
- `<h2>` in prose output gets a CSS rule: small rectangular badge with `repeating-radial-gradient` or SVG perforated border, section title in Plus Jakarta Sans small-caps, terracotta. Desktop: `margin-left: -120px` (pulled into left margin, full column width preserved). Mobile: full-width inline. Apply via CSS class on the prose wrapper (`.journal-body h2`).

**Torn-paper blockquotes:**
- `<blockquote>` gets a CSS rule: off-white background (`clip-path` polygon for rough top/bottom edges), terracotta 3px left border, Fraunces italic text, sits within content column (not full-width). Apply via `.journal-body blockquote`.

**Reading compass:**
- `position: fixed`, bottom-right `24px`, 48×48px SVG compass rose.
- Needle element rotates `0deg` (W, 0% scroll) → `180deg` (E, 100% scroll). Use `useScrollProgress` hook (or `window.scrollY / (documentHeight - viewportHeight)` in `useEffect`).
- Opacity: 0.6 at rest, 1.0 on hover. Hidden on mobile (`@media (max-width: 767px) { display: none }`).
- Needle rotation driven by CSS custom property `--scroll-progress` updated on scroll. No layout shift — compass is `position: fixed` and overlaps no content.

**Patterns to follow:**
- `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx` — `useEffect` scroll listener pattern
- `prototypes/journal-home.html` — CSS token names, motion patterns
- `.impeccable.md` — reading progress anti-pattern: compass not top bar

**Test scenarios:**
- Happy path: H2 heading in post body renders as stamp badge, not bold sans-serif H2
- Happy path: blockquote in post body renders torn-paper style with terracotta left bar
- Happy path: reading compass present at bottom-right on desktop
- Edge case: post with no H2 or blockquote — no crash, body renders cleanly
- Edge case: compass on mobile — element hidden (`display: none`), no layout space consumed
- Visual (manual): compass needle advances from W to E as post is scrolled; snaps back on page refresh

**Verification:**
- H2 and blockquote styles differ visually from default browser rendering
- Compass visible bottom-right on desktop, absent on mobile
- No layout shift from fixed compass on any viewport width

---

### U8. Sitemap — include journal post URLs

**Goal:** Add all published `/journal/[slug]` URLs to the site's XML sitemap, satisfying R6.

**Requirements:** R6

**Dependencies:** U4 (`getAllJournalSlugs` available)

**Files:**
- Create or modify: `src/app/sitemap.ts`

**Approach:**
- Check whether `src/app/sitemap.ts` already exists. If yes, add journal entries alongside existing entries. If no, create it.
- Call `getAllJournalSlugs()` to retrieve published slugs.
- Return entries with `url: \`${process.env.NEXT_PUBLIC_SERVER_URL}/journal/${slug}\``, `lastModified: new Date()`, `changeFrequency: 'weekly'`, `priority: 0.7`.
- `src/app/sitemap.ts` runs as a Server Component at build time — no `'use client'` directive.

**Patterns to follow:**
- Next.js 16 `MetadataRoute.Sitemap` return type from `node_modules/next/dist/docs/`

**Test scenarios:**
- Happy path: sitemap returns entries for all published journal posts
- Edge case: no published posts — sitemap returns empty array for journal section, no crash
- SEO: `GET /sitemap.xml` includes at least one `/journal/` URL after first post published

**Verification:**
- `GET /sitemap.xml` includes `/journal/best-unique-stays-in-joshua-tree-california`
- No TypeScript errors

---

### U9. Joshua Tree first post — write and publish

**Goal:** Write and publish the Joshua Tree city guide via Payload admin. Verify it renders at its canonical URL.

**Requirements:** R9

**Dependencies:** U2 (schema exists in DB), U7a (template renders)

**Files:**
- No code files. Content authored via Payload admin at `/admin`.

**Approach:**
- Before writing: query `stays` collection for listings where `location` contains `"Joshua Tree"`. 
  - If 3+ matching stays exist: use `StayEmbed` blocks for each in the Lexical content, populate `linkedStays` field.
  - If fewer than 3 exist: write prose recommendations with inline affiliate links from available stays data. Post can be updated later as stays are seeded.
- **Post fields to set**:
  - `slug`: `best-unique-stays-in-joshua-tree-california`
  - `title`: `The Best Unique Stays in Joshua Tree, California`
  - `subtitle`: `Where the desert does the work and you finally stop checking your phone.`
  - `excerpt`: ~155 chars targeting "unique stays joshua tree"
  - `metaTitle`: `Best Unique Stays in Joshua Tree, California (2026) | UniqueStaysUSA`
  - `metaDescription`: ~155 chars, exact-match "unique stays Joshua Tree"
  - `city`: `Joshua Tree`, `state`: `California`
  - `heroImage`: uploaded Joshua Tree desert/dome landscape (source from Unsplash, upload via `/admin/collections/media`)
  - `status`: `published`, `publishedAt`: today
- **Post structure** (10 sections per requirements):
  1. Dispatch header (coordinates: 34.1347° N, 116.3116° W) — dispatch №001
  2. Hero polaroid
  3. Title + subtitle kicker
  4. Lede: sensory, specific, Stoic undertone — lead with the quality of desert silence, NOT the amenities
  5. `## Why Joshua Tree?` — editorial context: monzogranite boulders, dark sky designation, proximity to LA (2.5hr), the specific way solitude feels different in a desert vs mountains
  6. `## The Stays` — StayEmbed blocks (or prose if few stays), 2–3 sentences commentary per stay (feeling-first, one hyper-specific concrete detail each)
  7. `## When to Go` — 1–2 paragraphs; October–April ideal, avoid July–August (110°F), wildflower superbloom in March (unpredictable but worth knowing)
  8. `## Getting There` — 1 paragraph; drive from LA, Twentynine Palms gateway, no train
  9. Post close (wax seal handled by template)
  10. "More Dispatches" (handled by template)
- **Voice check before publishing**: verify lede contains at least one hyper-specific concrete detail (boulder name, distance, temperature data, a sensory observation). No generic phrases: "stunning views", "cozy atmosphere", "perfect for couples", "life-changing".

**Test scenarios:**
- Happy path: `/journal/best-unique-stays-in-joshua-tree-california` returns 200 with full content rendered
- Happy path: affiliate links in StayEmbed cards (or prose links) are valid `https://` URLs
- SEO: `<title>` matches `metaTitle`, `<meta name="description">` matches `metaDescription`
- Revalidation: after publish, dev server logs show POST to `/api/revalidate` for both `journal` and `journal:best-unique-stays-in-joshua-tree-california` tags
- Brand voice (manual): lede is sensory and specific; no generic travel copy; dry wit present

**Verification:**
- Post accessible at `/journal/best-unique-stays-in-joshua-tree-california`
- `/journal` dispatch board shows the new post card
- Revalidation fired (check dev server output or Next.js cache logs)

---

## System-Wide Impact

- **New cache tags**: `'journal'` and `'journal:{slug}'` added to the project tag namespace. No collision with existing `'stays'`, `'categories'`, `'stays:featured'` tags.
- **First on-demand revalidation pattern**: the `/api/revalidate` Route Handler introduces a new ISR invalidation pattern. The `Stays` collection does not yet use it (deferred) — keep the handler generic enough to accept any tag string.
- **`REVALIDATE_SECRET` env var**: server-side only, never exposed to client. Add to `.env.local` and Vercel environment before U3 deployment.
- **`push: false` constraint**: the `blog_posts` table does not exist until `pnpm migrate:create` + `pnpm migrate` runs after U2. Deploying before migration will cause Payload to error.
- **`dynamicParams = true` on journal detail**: intentional divergence from existing routes. Does not affect `/stays/[slug]`, `/[spoke]`, or `/directory`.
- **`@payloadcms/richtext-lexical/react`**: first frontend use of the Lexical React renderer. The package is already installed (in use server-side for the editor); confirm the `/react` export is available in the installed version.
- **Unchanged invariants**: `Stays`, `Categories`, `Spokes`, and `Media` collections unmodified. All existing routes (`/stays/[slug]`, `/[spoke]`, `/directory`) unaffected.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `@payloadcms/richtext-lexical/react` `RichText` API changed in 3.84.x | Verify `converters` prop shape against `node_modules/@payloadcms/richtext-lexical/dist/` types before building U7. Research confirmed current API. |
| Neon connection unavailable during migration (U2) | Ensure `DATABASE_URI` is current in `.env.local`. Use `pnpm migrate:down` to roll back a failed migration. |
| Joshua Tree has 0 matching stays in DB | Post content falls back to prose + affiliate links — see U8. No blocker. |
| `BlocksFeature` field-level scoping not supported in 3.84.x | Fallback: register `BlocksFeature` globally on `lexicalEditor()` in `payload.config.ts`. Acceptable — just adds StayEmbed to all rich text contexts (low risk). |
| `revalidateTag` two-arg form not supported at runtime | Confirmed from `node_modules/next/dist/docs/`. Single-arg form is the fallback if it errors. |
| First post deploy before migration runs | Deployment order: run `pnpm migrate` first, then deploy. CI should gate on migration success. |

---

## Sources & References

- **Origin document:** [`docs/brainstorms/2026-05-08-journal-requirements.md`](docs/brainstorms/2026-05-08-journal-requirements.md)
- **Design context:** [`.impeccable.md`](.impeccable.md)
- Related code: `src/collections/Stays.ts`, `src/lib/payload-queries.ts`, `src/app/(app)/stays/[slug]/page.tsx`
- Next.js docs: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`
- Payload Lexical types: `node_modules/@payloadcms/richtext-lexical/dist/features/blocks/server/index.d.ts`
