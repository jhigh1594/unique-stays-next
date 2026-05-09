---
title: "feat: The Journal — blog/editorial section (/journal)"
type: requirements
status: ready-for-planning
date: 2026-05-08
---

# The Journal — Requirements

## Overview

Build UniqueStaysUSA's editorial blog at `/journal`. This is not a blog — it is a dispatch board. Every post is a "field dispatch" from a destination: editorial city guides that read like letters from a well-traveled friend, link through to curated stays, and target navigational SEO queries ("best unique stays in Joshua Tree").

**Phase scope:** Payload `BlogPosts` collection + `/journal` index + `/journal/[slug]` detail template + first post (Joshua Tree, CA).

---

## Users & Jobs To Be Done

**Primary reader:** Someone who typed "unique stays Joshua Tree" or "best treehouses near Joshua Tree" into Google. They want discovery with editorial trust — not a generic listing grid, but a real recommendation from someone who's thought about it. They're in the inspiration phase, not the booking phase.

**Secondary reader:** Newsletter subscriber who clicks through from The Wanderer's Weekly. They already trust the brand; the post deepens that relationship and moves them toward a booking.

**Job to be done:** "Show me the most interesting places to stay in [destination] and make me feel like I already know which one is right for me."

---

## Success Criteria

- `/journal/best-unique-stays-in-joshua-tree-california` ranks on page 1 for "unique stays joshua tree" within 90 days of publishing
- A reader who lands on a post can click through to a stay affiliate link within 2 taps
- Post template scores ≥ 90 on Lighthouse (performance, accessibility)
- The design is immediately distinguishable from every other travel blog — no one should mistake this for a Wix site

---

## Requirements

### Payload Collection

**R1.** Add a `BlogPosts` collection to `src/payload.config.ts` with these fields:

| Field | Type | Notes |
|---|---|---|
| `slug` | text | Unique, required. URL-safe. e.g. `best-unique-stays-in-joshua-tree-california` |
| `title` | text | Required. Editorial headline. |
| `subtitle` | text | Optional. One-line kicker beneath the title. |
| `excerpt` | textarea | Required. 1–2 sentences. Used in meta description + index cards. |
| `heroImage` | relationship → Media | Required. |
| `content` | richText (Lexical) | Required. Full post body. |
| `publishedAt` | date | Required when status = published. |
| `status` | select: draft \| published | Default: draft. |
| `linkedStays` | relationship → Stays, hasMany | Optional. The stays mentioned/recommended in the post. |
| `city` | text | Optional. For SEO city-guide pages. |
| `state` | text | Optional. |
| `metaTitle` | text | Optional. Falls back to `title` if empty. |
| `metaDescription` | text | Optional. Falls back to `excerpt` if empty. |

**R2.** No `Authors` collection. Single-author site for now. Author credit handled as static text in the template.

**R3.** After `status` changes to `published`, fire `revalidateTag('journal')` and `revalidateTag(`journal-${slug}`)` via Payload `afterChange` hook.

### Routes

**R4.** `/journal` — index page listing all published posts, sorted by `publishedAt` desc. ISR, revalidate on tag `journal`.

**R5.** `/journal/[slug]` — individual post page. ISR on-demand via tag `journal-${slug}`, 1hr fallback. `generateStaticParams` pre-builds published posts at build time.

**R6.** SEO metadata per route: `<title>`, `<meta description>`, Open Graph image (hero image), canonical URL.

**R7.** `generateSitemap` includes all `/journal/[slug]` URLs.

### Content Model

**R8.** Posts follow the **city guide format**: editorial intro (sense-of-place), curated stays section (3–6 linked stays with commentary), local context (when to go, getting there), and a closing CTA.

**R9.** Inline stay embeds: when a stay is listed in `linkedStays`, the template renders it as an embedded stay card within the post body — not just a link. The Lexical editor should support a custom `StayEmbed` block that references a stay by ID.

---

## Design Direction

> **The standard to beat:** every travel blog template looks the same. Hero image → title → body text → stay grid → related posts. The Journal must be immediately recognizable as something different. The goal is that a reader screenshots the page to share it — not just the content, but the page itself.

### The Metaphor: Dispatches From the Field

The organizing metaphor is a **letter from a well-traveled correspondent**. The post is not an article — it is a dispatch. Every visual element should reinforce this without becoming costume jewelry.

---

### Hero: The Dispatch Header (not a standard hero)

**Do not use a full-bleed hero image.** Full-bleed heroes are what every travel site uses. Instead:

- The post opens with a **telegram-style dispatch header** block:
  ```
  DISPATCH №001
  JOSHUA TREE, CALIFORNIA
  34.1347° N · 116.3116° W
  ```
  Set in Plus Jakarta Sans, all-caps, small, letter-spaced. Positioned in the top of the content area like a letterhead. The dispatch number and coordinates give it an artifact quality — like a real field report.

- The **date** renders as a **circular postmark stamp**, slightly rotated (−3°). Not "May 8, 2026" — a circular ink stamp impression containing the city name arched around the top and the date across the middle. CSS-only or SVG.

- The **hero image** sits below the dispatch header, framed as a **large polaroid** — white border, slight shadow, 1.5° rotation. Width ~85% of the content column, centered. A caption beneath in Fraunces italic, styled like handwriting on a polaroid back.

- The **title** (H1) sits below the polaroid hero. Full editorial weight, Fraunces at ~52–60px display size. No background. Just large serif type on cream.

- The **subtitle/kicker** — if present — appears above the title, small and in Plus Jakarta Sans, terracotta color, with a ✦ before it. Like a stamp classification.

---

### Body: The Letter

- **Opening paragraph (the lede):** Set at ~20–21px in Fraunces italic. Larger than the rest of the body. This is the "hook" — the specific, sensory detail that puts the reader in the destination. Do not use the same size as body copy.

- **Body paragraphs:** Plus Jakarta Sans, 17–18px, generous line-height (1.75). Max content width ~680px, centered. Generous paragraph spacing.

- **Pull quotes:** Not a generic blockquote. Styled as a piece of torn paper — a slightly off-white card with rough top/bottom edges (CSS `clip-path` polygon), terracotta vertical bar on the left, quote text in Fraunces italic. Sits within the content column, not full-width.

- **Section headings (H2):** Not a large bold H2. Styled as **postage stamps** — a small rectangular element with a serrated/perforated border (CSS repeating-radial-gradient or SVG pattern), containing the section title in small caps. On desktop: positioned in the left margin. On mobile: full width, inline.

---

### Inline Stay Embeds: Polaroid Cards in the Flow

When a stay is referenced in the body (`StayEmbed` Lexical block):

- Renders as a **polaroid card** — white border, stay image, stay name + location in handwritten-style text below (Fraunces italic), tiny ✦ platform badge.
- On **desktop**: floats right with the text wrapping left, slight rotation (+2° or −2°, alternating), with a drop shadow. `margin-left: 24px`, like a photo tucked into a journal.
- On **mobile**: full-width, centered, no rotation.
- **Hover state**: card lifts (translate Y −4px) and shadow deepens. The rotation snaps to 0° (straightens out, as if you're picking it up to look at it).
- Below the image: a "Book It →" button styled as a rubber stamp impression in terracotta — rectangular, slight border texture, not a standard button.

---

### Section Transition: Filmstrip Divider

Between the editorial intro section and the "Curated Stays" section, use the existing `FilmstripSection` component as a visual break. This creates a cinematic transition — editorial prose → the visual parade of places.

---

### Reading Progress: Compass Needle

- A small **compass rose** fixed in the bottom-right corner of the viewport (not top progress bar).
- The needle rotates from West (0% read) to East (100% read) as the user scrolls.
- The rose itself is ~48×48px, subtle opacity (0.6 at rest, 1.0 on hover).
- On mobile: compass is hidden.

---

### Post End: The Wax Seal

- After the final paragraph, instead of a generic "related posts" section:
  1. A **decorative horizontal rule** — a thin terracotta line with a ✦ in the center.
  2. A **"VETTED ✦ UNIQUESTAYSUSA"** stamp motif — circular, ink-worn, slightly rotated. Signals the editorial promise kept.
  3. A **"More Dispatches"** section — 2 related posts (same region or category) rendered as postcard-style index cards (not standard blog cards): landscape image, tilted, with city/state in stamp font below.

---

### Journal Index (`/journal`)

The index page is **not a standard blog listing**. It is a **dispatch board**:

- Background: cream (`oklch(0.975 0.012 85)`) with a very subtle cork/paper texture.
- Posts render as **index cards** pinned to the board — each card is slightly rotated (alternating +1.5° / −1.5°), with a shadow suggesting it's sitting on the board.
- Each card contains: a small postmark (city, date), the post title in Fraunces, a one-line excerpt, and a "Read Dispatch →" link in terracotta.
- Cards arranged in a **masonry-style grid** (3 cols desktop, 2 tablet, 1 mobile).
- Page header: large Fraunces display text — "The Journal" — with a small editorial subhead: "Field dispatches from extraordinary places."

---

### What This Design Is NOT

- Not a generic full-bleed hero + title + byline layout
- Not a dark mode layout
- Not a sidebar layout with related posts
- Not a reading-progress bar at the top of the viewport
- Not standard H2/H3 headings in bold sans-serif
- Not a "share on Twitter/Facebook" button strip
- Not AI-slop stock photography

---

## First Post: Joshua Tree, CA

**Slug:** `best-unique-stays-in-joshua-tree-california`

**SEO target queries:**
- "unique stays joshua tree"
- "best places to stay joshua tree"
- "unique vacation rentals joshua tree california"

**Post structure:**
1. **Dispatch header** — coordinates, postmark date
2. **Hero polaroid** — wide desert landscape shot (domes/A-frames preferred)
3. **Title:** "The Best Unique Stays in Joshua Tree, California"
4. **Subtitle kicker:** "Where the desert does the work and you finally stop checking your phone."
5. **Lede paragraph** — sensory, specific, Stoic undertone. Sets the scene at Joshua Tree without mentioning the stays yet.
6. **Section: Why Joshua Tree?** — editorial context, what makes this destination distinct for unique stays (boulders, dark skies, solitude, proximity to LA).
7. **Section: The Stays** — 4–6 inline `StayEmbed` polaroid cards with 2–3 sentences of commentary per stay. Commentary follows brand voice (feeling-first, specific, not generic).
8. **Section: When to Go** — brief practical guidance without being a generic listicle.
9. **Section: Getting There** — 1 paragraph.
10. **Wax seal close + "More Dispatches"**

**Note:** Check `stays` collection for existing Joshua Tree, CA listings before writing. If fewer than 3 relevant stays exist, the post body can recommend stays generally with affiliate links and the `linkedStays` field can be populated once more listings are added.

---

## Scope Boundaries

### In scope
- `BlogPosts` Payload collection
- `/journal` index + `/journal/[slug]` routes
- Post template with full design treatment above
- Journal index page (dispatch board)
- SEO metadata (title, description, OG image, sitemap)
- ISR on-demand revalidation
- Joshua Tree first post — content written and published

### Deferred for later
- Authors collection / bylines
- Tags taxonomy and `/journal/[tag]` filter pages
- Programmatic `/journal/[state]/[city]` intersection pages
- Newsletter integration (Beehiiv post → auto-publish)
- Search within the journal
- Comment system

### Outside this product's identity
- Dark mode
- User accounts or saved posts
- Comment system / community features

---

## Open Questions

1. **Are there Joshua Tree stays in the database?** Check before writing the first post. If < 3 stays exist, the embedded stay cards section will use general affiliate links and be updated when listings are added.
2. **Hero image source for first post?** Will need a Joshua Tree landscape image. Source from Unsplash (license-clear) or the existing `imageUrl` fields in stays near Joshua Tree.
3. **`StayEmbed` Lexical block** — this is a custom Lexical block that needs to be built in Payload. It accepts a `stayId` and renders the polaroid card client-side. This is the most technically novel piece of the implementation.
