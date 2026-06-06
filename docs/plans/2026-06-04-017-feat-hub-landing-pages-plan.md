---
title: "Hub Landing Pages for Collections & Tools"
status: active
plan-type: feat
created: 2026-06-04
depth: lightweight
origin: conversation — replacing nav dropdown menus with dedicated SEO hub landing pages
---

## Summary

Replace the "Collections" and "Tools" dropdown menus in the navigation with dedicated hub landing pages at `/collections` and `/tools`. Each hub page showcases its items (5 spokes, 4 tools) with editorial content, SEO metadata, and rich card layouts. Nav items become plain links pointing to the hub pages.

## Problem

Current dropdowns are JS-dependent wayfinding only — not indexable, zero link equity, no keyword targeting, can't earn backlinks. Directory leaders (Airbnb, Hipcamp, Glamping Hub, NerdWallet) all use dedicated hub landing pages for category/tool discovery because they rank for keywords, distribute internal link equity, and serve user research intent.

## Scope Boundaries

### In scope
- New `/collections` hub page showcasing 5 spokes
- New `/tools` hub page showcasing 4 free tools
- Navbar refactor: dropdown triggers → plain links (desktop + mobile)
- Extract `TOOLS` config from inline Navbar array to shared config file
- SEO metadata and JSON-LD for both new pages

### Out of scope
- Changes to existing spoke pages (`/{spoke}`)
- Changes to existing tool pages (`/{tool-slug}`)
- Changes to existing `/collection` directory page
- New spokes or new tools
- Changes to other nav items (Journal, About, Submit)

### Deferred to follow-up
- Internal linking from spoke pages back to `/collections` hub (cross-link enhancement)
- Tools hub page SEO content expansion (blog-style editorial content)
- A/B testing dropdown vs hub page for conversion

---

## Key Technical Decisions

**KTD-1: New `/collections` route, not repurposed `/collection`**

`/collection` is an existing directory/search page with `FilterEngine`. The hub page has different intent — editorial showcase of the 5 spokes, not a flat listing search. Keep both routes: `/collections` (hub) and `/collection` (directory).

**KTD-2: Extract TOOLS to shared config**

`TOOLS` array is inline in `src/components/Navbar.tsx`. Both the navbar and the new `/tools` hub page need it. Extract to `src/lib/tools-config.ts`, mirroring `src/lib/spokes-config.ts` pattern.

**KTD-3: Static pages, no Payload data fetching**

Both hub pages render static content (spoke config + tool config). No database queries needed. Use `export const dynamic = 'force-static'` like existing `/collection` page — simpler than the spoke page pattern which needs `generateStaticParams` for dynamic segments.

**KTD-4: Nav items become plain links, dropdowns removed entirely**

Replace dropdown trigger `<button>` with `<Link>`. Remove dropdown panel state, refs, and event handlers. Follow the flat link pattern used by "Journal" and "About" nav items. Mobile nav likewise — remove accordion/expand pattern for these sections, render flat links grouped under a section header.

---

## Implementation Units

### U1. Extract tools config to shared module

**Goal:** Move `TOOLS` array from inline in Navbar to a shared config file so both Navbar and `/tools` hub page can import it.

**Dependencies:** None

**Files:**
- `src/lib/tools-config.ts` (create)
- `src/components/Navbar.tsx` (modify — replace inline `TOOLS` with import)

**Approach:**
Create `src/lib/tools-config.ts` exporting a `TOOLS` array and a `ToolConfig` type. Shape: `{ slug, title, description, stamp, iconName, seoTitle, seoDescription }`. The `iconName` field stores a string key (e.g., `"PenLine"`) rather than a React component reference — keep Lucide components out of the config module. Consumers (Navbar, tools hub page) map `iconName` to the actual Lucide component via a local lookup. `seoTitle` and `seoDescription` provide per-tool SEO metadata consumed by the tools hub page (U3). Update Navbar to import from the new file and map icon names to components.

**Patterns to follow:** Mirror `src/lib/spokes-config.ts` structure — typed config object exported as const. Note: unlike spokes-config which has no React component references, this config uses string keys for icons to avoid coupling the shared lib to Lucide.

**Test expectation:** none — pure config extraction, no behavioral change. Verify build succeeds and Navbar renders identically.

**Verification:** Build succeeds. Navbar renders identically.

---

### U2. Create `/collections` hub landing page

**Goal:** New page at `/collections` showcasing all 5 spoke collections with editorial content, SEO metadata, and rich card layout.

**Dependencies:** None

**Files:**
- `src/app/(app)/collections/page.tsx` (create)

**Approach:**
- Static server component with `export const dynamic = 'force-static'`
- `generateMetadata()` returns SEO metadata targeting "unique vacation rental collections", "curated stay types"
- Hero section: Fraunces headline, editorial description, cream background
- Card grid: 5 spoke cards from `SPOKES_CONFIG`, each with hero image (from `config.heroImage`), title, tagline, accent color border, stat from `config.stats` array (e.g., "400+ Curated Stays"), link to `/{spoke}`. No database queries — stats come from the static config.
- Cross-link section: links to `/collection` directory page and `/journal`
- JSON-LD: `CollectionPage` schema
- Sitemap: add `/collections` to sitemap generation (check `src/lib/pseo.ts` sitemap helper or `src/app/sitemap.ts`)
- Follow editorial design system: oklch color tokens, Fraunces headlines, terracotta accents, perforation dividers, ghost section numbers

**Patterns to follow:**
- Spoke hub page layout: `src/app/(app)/[spoke]/page.tsx` (hero structure, card grid, cross-links)
- Static export pattern only: `export const dynamic = 'force-static'`. Note: unlike `/collection/page.tsx` which calls `getAllStays()` at build time, this page uses NO database queries — only static config data.
- Color tokens and typography from `.impeccable.md`

**Test scenarios:**
- Page renders all 5 spokes with correct titles, images, and links
- Each card links to the correct `/{spoke}` route
- Both `/collections` and `/collection` routes resolve independently (no Next.js route conflict)
- SEO metadata is unique and keyword-targeted
- JSON-LD validates as `CollectionPage`

**Verification:** `next build` succeeds. Page loads at `/collections`. All 5 spoke cards visible and linked.

---

### U3. Create `/tools` hub landing page

**Goal:** New page at `/tools` showcasing all 4 free tools with descriptions, use cases, and visual cards.

**Dependencies:** U1 (needs extracted tools config)

**Files:**
- `src/app/(app)/tools/page.tsx` (create)

**Approach:**
- Static server component with `export const dynamic = 'force-static'`
- `generateMetadata()` returns SEO metadata targeting "vacation rental tools", "free Airbnb listing tools". Consumes per-tool `seoTitle` and `seoDescription` from `TOOLS` config (U1).
- Hero section: Fraunces headline ("Free Tools for Hosts & Travelers"), editorial tagline
- Card grid: 4 tool cards from `TOOLS` config, each with Lucide icon (mapped from `iconName`), stamp label, title, description, link to `/{tool-slug}`. Note: tool cards use icon + stamp treatment (no hero images), visually distinct from spoke cards which use hero images.
- CTA section: cross-link to submit-a-stay and newsletter
- JSON-LD: `CollectionPage` or `ItemList` schema
- Sitemap: add `/tools` to sitemap generation
- Same editorial design system tokens

**Patterns to follow:** Same as U2 — static server component, no database queries. Mirror spoke hub page structure adapted for tools.

**Test scenarios:**
- Page renders all 4 tools with correct titles, icons, stamps, and links
- Each card links to the correct `/{tool-slug}` route
- SEO metadata reads from TOOLS config and is unique per intent
- JSON-LD validates

**Verification:** `next build` succeeds. Page loads at `/tools`. All 4 tool cards visible and linked.

---

### U4. Refactor Navbar — dropdowns to plain links

**Goal:** Replace Collections and Tools dropdown menus with plain `<Link>` elements pointing to the new hub pages. Update both desktop and mobile nav.

**Dependencies:** U1, U2, U3

**Files:**
- `src/components/Navbar.tsx` (modify)

**Approach:**
- **Desktop nav:** Replace "Collections" `<button>` dropdown trigger with `<Link href="/collections">` following the flat link pattern used by "Journal" (no dropdown, no `aria-expanded`, no `aria-haspopup`). Same for "Tools" → `<Link href="/tools">`.
- Remove state: `collectionsOpen`, `toolsOpen` and their setters. Verify `closeAll()` no longer references these — update `closeAll` accordingly.
- Remove dropdown panel JSX for both sections (desktop only).
- Remove click-outside handler registrations for these dropdowns.
- Remove refs: `collectionsRef`, `toolsRef`. Verify no other consumers.
- Remove keyboard navigation handlers for these dropdowns: `handleTriggerKeyDown` for collections/tools triggers, `handleItemKeyDown` for menu items. Links get native `<a>` keyboard behavior automatically.
- Remove `focusIndex` state if it was only used for dropdown keyboard navigation.
- **Mobile nav:** Mobile nav already renders spoke/tool links as flat `<Link>` elements (not accordions). No structural change needed for mobile link rendering. Add a link to `/collections` at the top of the spokes section and `/tools` at the top of the tools section. Keep Roman numeral decoration and existing styling. Verify the existing "The Collection" link to `/collection` (directory page) still makes sense alongside the new `/collections` hub link — consider relabeling to avoid confusion.
- Update active state detection:
  - `isOnSpoke`: `pathname === '/collections' || SPOKE_SLUGS.some((s) => pathname === '/' + s)`
  - `isOnTool`: `pathname === '/tools' || TOOLS.some((t) => pathname === '/' + t.slug)`

**Patterns to follow:** "Journal" flat link pattern in the same Navbar file — `<Link>` with `navTextClass()` and hover states.

**Test scenarios:**
- "Collections" nav item is a clickable link to `/collections`, not a dropdown
- "Tools" nav item is a clickable link to `/tools`, not a dropdown
- No dropdown panels render on hover or click for these items
- Mobile nav shows grouped links — no structural change expected since flat links already exist
- Active state highlights when on `/collections` or `/tools`
- Other nav items (Journal, About, Submit, existing "The Collection" link) unaffected
- Keyboard navigation works via native `<Link>` Tab behavior
- Screen reader navigation still functional (semantic `<nav>`, `<Link>` elements, no orphaned ARIA)

**Verification:** Build succeeds. Desktop nav shows plain links. No JS errors. Mobile nav renders grouped links. Active state works.

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Users miss dropdown quick-access to individual spokes/tools | Medium | Hub pages are one click away with rich card layout. Mobile nav still shows individual links grouped under section headers. |
| `/collections` vs `/collection` confusion | Low | Different intent, different URLs. Hub page links prominently to directory page. Clear labeling. |
| Breaking external links to current nav behavior | Very low | Nav changes are internal-only. No public URLs change. |

## System-Wide Impact

- **SEO:** Two new indexable pages earning rankings and distributing internal link equity to spoke/tool pages.
- **Navigation:** Users get one additional click to reach individual spokes/tools (hub page first). Mobile nav retains direct links.
- **Maintenance:** Adding a new spoke or tool requires updating config + hub page, not the navbar component directly.
