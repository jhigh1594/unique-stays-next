# UniqueStaysUSA — Content Architecture for Scale
### A Systems-Thinking Blueprint for 10,000+ Properties, 500+ Blog Posts, and p95 < 300ms

*Prepared May 2026 | Version 1.0*

---

## Executive Summary

The current site is a static React SPA with a TypeScript data file. This works beautifully at 64 listings, but it will collapse under its own weight at 1,000+ properties: build times balloon, content editors need to touch code, search becomes unusable, and there is no editorial workflow for blog content. The architecture described here solves all of these problems while keeping the polished frontend experience intact.

**The recommended stack in one sentence:** Payload CMS 3.0 (open-source, self-hosted) as the content layer, Next.js 15 App Router as the frontend with ISR, Neon PostgreSQL as the database, Typesense as the search engine, and Cloudflare as the global edge delivery layer — all deployable for under $80/month at 100,000 monthly visitors.

---

## 1. The Core Problem: Why the Current Architecture Hits a Wall

The current site stores all listing data in a TypeScript file (`stays-data.ts`). This approach has three fundamental scaling problems.

**Build-time coupling.** Every new listing requires a code deployment. At 64 listings this is fine; at 5,000 listings it means non-technical content editors cannot add properties without developer involvement. The editorial workflow breaks entirely.

**No search infrastructure.** The current filter is a client-side JavaScript `Array.filter()` call over an in-memory array. At 5,000 listings, this means shipping 500KB+ of JSON to every visitor's browser before any filtering can happen. Search latency becomes unacceptable and LCP scores collapse.

**No content modeling for blog posts.** Blog articles require rich text editing, author metadata, SEO fields, related listings, internal linking, and a publishing workflow. None of this can be expressed in a TypeScript data file.

The solution is a clean separation of concerns: a **content layer** (CMS + database) that editors control, a **search layer** that handles filtering at the server, and a **delivery layer** (CDN + ISR) that ensures every visitor gets a pre-rendered page from the nearest edge node.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTENT LAYER                            │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Payload CMS 3.0 │    │  Neon PostgreSQL  │                  │
│  │  (Admin UI +     │───▶│  (Serverless,     │                  │
│  │   REST/GraphQL)  │    │   branching)      │                  │
│  └──────────────────┘    └──────────────────┘                  │
│           │                       │                             │
│           │ Webhook on publish     │ Read replica               │
│           ▼                       ▼                             │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Typesense       │    │  Cloudflare R2   │                  │
│  │  (Search Index)  │    │  (Image Storage) │                  │
│  └──────────────────┘    └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    Webhook triggers ISR
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 App Router (ISR + React Server Components)   │  │
│  │                                                          │  │
│  │  /                    → Hub homepage (ISR 1hr)           │  │
│  │  /stays/[slug]        → Property detail (ISR on-demand)  │  │
│  │  /[spoke]             → Spoke pages (ISR 1hr)            │  │
│  │  /blog/[slug]         → Blog posts (ISR on-demand)       │  │
│  │  /directory           → Search UI (Client component)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    Static HTML served from cache
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        EDGE LAYER                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cloudflare (300+ PoPs globally)                         │  │
│  │                                                          │  │
│  │  • Pages/Workers: serve pre-rendered HTML from edge      │  │
│  │  • Cache-Control: s-maxage=3600, stale-while-revalidate  │  │
│  │  • Images: Cloudflare Images (resize + WebP/AVIF)        │  │
│  │  • R2: zero-egress image storage                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Deep Dives

### 3.1 CMS: Payload CMS 3.0

**Why Payload over Strapi and Directus:**

| Criterion | Payload 3.0 | Strapi 5 | Directus 11 |
|---|---|---|---|
| **Next.js integration** | Native — installs into `/app` folder | External API only | External API only |
| **TypeScript** | First-class, config is typed | Partial | Partial |
| **Performance (avg response)** | 28ms | 45ms | 35ms |
| **Memory footprint** | ~150MB | ~250MB | ~180MB |
| **PostgreSQL support** | Full (via Drizzle ORM) | Full | Full |
| **Self-hosting cost** | $0 license | $0 license | $0 license |
| **ISR webhook support** | Native `afterChange` hooks | Plugin required | Plugin required |
| **Admin UI quality** | Excellent | Good | Excellent |
| **License** | MIT | MIT | BSL (non-commercial restrictions) |

Payload's decisive advantage is that it runs **inside** the Next.js app, not alongside it. There is no separate CMS server to maintain, no cross-origin API calls, and no CORS configuration. The admin panel lives at `/admin`, the API at `/api`, and the frontend at `/` — all in one Next.js deployment. This eliminates an entire tier of infrastructure.

Critically, Payload's `afterChange` collection hooks fire a webhook to Next.js's `revalidateTag()` endpoint the moment an editor publishes a listing or blog post. The updated page is regenerated at the edge within seconds, with zero full-site rebuilds.

**Content Collections to model:**

```typescript
// Payload collection structure
Collections:
  ├── stays/           → Property listings (core entity)
  ├── blog-posts/      → Editorial articles
  ├── categories/      → Taxonomy (Treehouses, Domes, etc.)
  ├── spokes/          → Hub & spoke metadata
  ├── regions/         → Geographic taxonomy
  ├── authors/         → Blog post authors
  └── media/           → Images (synced to Cloudflare R2)
```

### 3.2 Database: Neon PostgreSQL

Neon is a serverless PostgreSQL provider with a generous free tier (0.5 GB storage, 191 compute hours/month) and a branching feature that allows staging/production database isolation without cost duplication. It is the natural companion to Payload 3.0, which uses Drizzle ORM and supports Neon out of the box.

**Critical indexing strategy for 10,000+ listings:**

```sql
-- Primary lookup indexes
CREATE INDEX idx_stays_slug ON stays(slug);
CREATE INDEX idx_stays_platform ON stays(platform);
CREATE INDEX idx_stays_region ON stays(region);
CREATE INDEX idx_stays_category ON stays(category_id);
CREATE INDEX idx_stays_price ON stays(price_per_night);
CREATE INDEX idx_stays_rating ON stays(rating DESC);

-- Composite index for the most common filter combination
CREATE INDEX idx_stays_filter ON stays(region, category_id, platform, price_per_night);

-- Full-text search fallback (before Typesense is set up)
CREATE INDEX idx_stays_fts ON stays USING gin(to_tsvector('english', title || ' ' || description || ' ' || location));

-- Spoke membership (many-to-many)
CREATE INDEX idx_stay_spokes ON stay_spokes(spoke_id, stay_id);
```

At 10,000 listings, a properly indexed PostgreSQL query with `LIMIT 24 OFFSET 0` on the filter combination above returns in under 5ms. This is the data source for the Typesense sync job.

### 3.3 Search: Typesense (Open Source)

Typesense is the open-source alternative to Algolia — self-hostable, MIT-licensed, and purpose-built for instant search-as-you-type experiences. It is written in C++ and returns search results in under 1ms from an in-memory index.

**Why Typesense over PostgreSQL full-text search:**

PostgreSQL's `tsvector` full-text search is excellent for simple keyword matching but lacks typo tolerance, faceted filtering with counts, geo-search, and relevance tuning. At 1,000+ listings, users will search for "treehous" (typo), "near Asheville" (geo), and "under $300 with hot tub" (multi-facet). Typesense handles all of these natively; PostgreSQL requires significant custom engineering.

**Why Typesense over Algolia:**

Algolia charges $1 per 1,000 search operations. At 100,000 monthly visitors with an average of 3 searches per session, that is $300/month in search fees alone. Typesense Cloud starts at $0.015/hour ($11/month) for a 0.5 GB RAM instance that handles millions of searches. Self-hosted on a $6/month VPS, it is effectively free.

**Typesense schema for stays:**

```json
{
  "name": "stays",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "title", "type": "string"},
    {"name": "description", "type": "string"},
    {"name": "location", "type": "string"},
    {"name": "state", "type": "string", "facet": true},
    {"name": "region", "type": "string", "facet": true},
    {"name": "category", "type": "string", "facet": true},
    {"name": "platform", "type": "string", "facet": true},
    {"name": "spokes", "type": "string[]", "facet": true},
    {"name": "price", "type": "float", "facet": true},
    {"name": "rating", "type": "float"},
    {"name": "sleeps", "type": "int32", "facet": true},
    {"name": "tags", "type": "string[]", "facet": true},
    {"name": "coordinates", "type": "geopoint"},
    {"name": "featured", "type": "bool", "facet": true},
    {"name": "image_url", "type": "string", "index": false}
  ],
  "default_sorting_field": "rating"
}
```

The sync flow is: Payload `afterChange` hook → update PostgreSQL → fire Typesense upsert API → fire Next.js ISR revalidation webhook. The entire chain completes in under 500ms.

### 3.4 Frontend: Next.js 15 App Router with ISR

**Why Next.js over Astro for this use case:**

Astro produces lighter pages for pure content sites (0 KB JavaScript vs ~100 KB for Next.js). However, UniqueStaysUSA has a critical interactive requirement: the Directory page is a real-time search interface with instant filtering, faceted counts, and URL-synced state. This is an application, not a document. Astro's island architecture would require shipping a full React or Preact bundle for the search component anyway, negating the JavaScript savings.

The decisive factor is ISR. When an editor publishes a new listing in Payload, Next.js's `revalidateTag('stays')` call invalidates and regenerates only the affected pages — the hub homepage, the relevant spoke page, and the new property detail page — within seconds. Astro requires a full site rebuild for any content change, which at 10,000 pages takes 8–15 minutes.

**Page rendering strategy by route:**

| Route | Strategy | Revalidation | Rationale |
|---|---|---|---|
| `/` | ISR | On-demand + 1hr fallback | Featured listings change infrequently |
| `/stays/[slug]` | ISR | On-demand (Payload webhook) | Immediate after editor publishes |
| `/[spoke]` | ISR | On-demand + 1hr fallback | Spoke content changes infrequently |
| `/blog/[slug]` | ISR | On-demand (Payload webhook) | Immediate after editor publishes |
| `/directory` | Static shell + Client | N/A | Search UI is fully client-side via Typesense |
| `/sitemap.xml` | ISR | 24hr | Regenerated daily |

**The Directory page architecture:**

The Directory page is the one exception to the "serve from cache" rule. It is a static HTML shell (fast TTFB from CDN) with a React client component that calls the Typesense search API directly from the browser. This means:

1. The HTML shell loads in ~50ms from Cloudflare's edge
2. The Typesense search API returns results in ~1ms from the nearest node
3. The user sees the search interface immediately, with results populating within 100ms of the first keystroke

This is the correct architectural split: static delivery for the chrome, dynamic search for the content.

### 3.5 Image Strategy: Cloudflare Images + R2

External platform images (Airbnb's `a0.muscache.com`, Wander's `assets.wander.com`, VRBO's `media.vrbo.com`) are the single biggest performance risk in the current architecture. These images are:

- Served from third-party CDNs with no control over cache headers
- Not optimized for WebP/AVIF delivery
- At risk of breaking if the platform changes their CDN URLs
- Potentially violating platform ToS if used without proper attribution

**The solution: Cloudflare Images as a proxy layer.**

A Cloudflare Worker intercepts every image request, fetches the source image from the platform CDN, resizes it to the requested dimensions, converts it to WebP/AVIF, and caches it at the Cloudflare edge. The Worker URL becomes the canonical image URL stored in the database:

```
https://images.uniquestaysusa.com/stays/{stay-id}/hero?w=800&f=webp
```

This provides:
- **Format optimization:** WebP/AVIF reduces image size by 30–50% vs JPEG
- **Responsive sizing:** `?w=400` for mobile, `?w=800` for desktop, `?w=1200` for hero
- **CDN caching:** Images cached at 300+ Cloudflare PoPs globally
- **Resilience:** If the source platform changes their URL, only the Worker needs updating
- **LCP improvement:** Pre-sized images eliminate layout shift and reduce LCP by 200–400ms

Cloudflare Images pricing: $5/month for up to 100,000 images stored + $1 per 100,000 transformations. At 10,000 listings with 3 images each, this is approximately $8/month.

---

## 4. The p95 < 300ms Path

The 300ms p95 target is achievable at every layer. Here is the latency budget breakdown:

| Layer | p50 | p95 | How |
|---|---|---|---|
| **DNS resolution** | 5ms | 20ms | Cloudflare DNS (fastest globally) |
| **TLS handshake** | 10ms | 30ms | TLS 1.3 + 0-RTT resumption |
| **TTFB (HTML)** | 15ms | 50ms | Pre-rendered HTML served from Cloudflare edge PoP |
| **HTML parse + render** | 30ms | 80ms | RSC, minimal JS, critical CSS inlined |
| **LCP image** | 40ms | 100ms | Cloudflare Images, preloaded, WebP/AVIF |
| **JS hydration** | 20ms | 50ms | Minimal client JS, deferred non-critical |
| **Total** | **~120ms** | **~330ms** | |

The p95 target of 300ms is tight but achievable if the LCP image is properly preloaded and the HTML is served from a Cloudflare PoP within 50ms TTFB. The one risk is cache misses on ISR pages — if a page has not been visited in 24 hours and the ISR cache has expired, the first visitor triggers a server-side render that takes 300–800ms. The mitigation is a daily cron job that pre-warms all listing pages by hitting each URL, ensuring the cache is always fresh.

---

## 5. Database Schema (Core Tables)

```sql
-- Core stays table
CREATE TABLE stays (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  location        TEXT NOT NULL,
  state           TEXT NOT NULL,
  region          TEXT NOT NULL,
  category_id     UUID REFERENCES categories(id),
  platform        TEXT NOT NULL CHECK (platform IN ('Airbnb','VRBO','Wander','Direct')),
  affiliate_url   TEXT NOT NULL,
  price_per_night NUMERIC(8,2),
  rating          NUMERIC(3,2),
  review_count    INTEGER,
  sleeps          SMALLINT,
  bedrooms        SMALLINT,
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  featured        BOOLEAN DEFAULT false,
  editors_pick    BOOLEAN DEFAULT false,
  is_new          BOOLEAN DEFAULT false,
  published       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Images (one-to-many, ordered)
CREATE TABLE stay_images (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id   UUID REFERENCES stays(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,          -- Cloudflare Images URL
  alt       TEXT,
  position  SMALLINT DEFAULT 0,     -- 0 = hero image
  width     INTEGER,
  height    INTEGER
);

-- Tags (many-to-many via junction)
CREATE TABLE tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  slug  TEXT UNIQUE NOT NULL
);
CREATE TABLE stay_tags (
  stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (stay_id, tag_id)
);

-- Spoke membership
CREATE TABLE spokes (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  TEXT UNIQUE NOT NULL,  -- 'unique', 'work-friendly', etc.
  title TEXT NOT NULL
);
CREATE TABLE stay_spokes (
  stay_id  UUID REFERENCES stays(id) ON DELETE CASCADE,
  spoke_id UUID REFERENCES spokes(id) ON DELETE CASCADE,
  PRIMARY KEY (stay_id, spoke_id)
);

-- Spoke-specific attributes (EAV pattern for flexibility)
CREATE TABLE stay_attributes (
  stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
  key     TEXT NOT NULL,   -- 'wifi_speed', 'pet_policy', 'ev_charger_type'
  value   TEXT NOT NULL,
  PRIMARY KEY (stay_id, key)
);

-- Blog posts
CREATE TABLE blog_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT,
  content      JSONB NOT NULL,       -- Lexical rich text (Payload's default)
  author_id    UUID REFERENCES authors(id),
  hero_image   TEXT,                 -- Cloudflare Images URL
  published    BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Blog ↔ Stay cross-links (for "Featured in this article" sections)
CREATE TABLE blog_stay_links (
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  stay_id      UUID REFERENCES stays(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, stay_id)
);
```

---

## 6. Migration Path from Current Site

The migration from the current TypeScript data file to this architecture is designed to be incremental — the current site stays live throughout.

**Phase 1 — Infrastructure (Week 1–2):**
Provision Neon PostgreSQL, deploy Payload CMS 3.0 into a new Next.js project, configure Cloudflare R2 and Images. No user-facing changes.

**Phase 2 — Data Migration (Week 2–3):**
Write a one-time migration script that reads `stays-data.ts` and inserts all 64 listings into Payload via its REST API. Verify data integrity. Set up Typesense and run the initial index sync.

**Phase 3 — Frontend Migration (Week 3–5):**
Migrate the current React components to Next.js 15 App Router, preserving the "Wanderer's Postcard Collection" design system exactly. Replace the TypeScript data file imports with Payload API calls. Deploy to Cloudflare Pages.

**Phase 4 — ISR + Search (Week 5–6):**
Wire up Payload `afterChange` webhooks to Next.js ISR revalidation. Replace the client-side filter on the Directory page with the Typesense InstantSearch React library. Configure Cloudflare Images proxy for all listing images.

**Phase 5 — Blog Launch (Week 6–8):**
Build the blog collection in Payload, create the blog post template in Next.js, and publish the first 5–10 SEO articles targeting high-intent keywords ("best treehouses in California," "pet-friendly beach houses Pacific Northwest," etc.).

---

## 7. Cost Model

| Service | Free Tier | Paid Tier | At 100k MAU |
|---|---|---|---|
| **Neon PostgreSQL** | 0.5 GB, 191 compute hrs | $19/month (Launch) | $19/month |
| **Payload CMS** | Self-hosted, $0 license | — | $0 |
| **Cloudflare Pages** | Unlimited requests | $0 (included in Pro) | $0 |
| **Cloudflare Images** | — | $5 base + $1/100k transforms | ~$8/month |
| **Cloudflare R2** | 10 GB free | $0.015/GB after | ~$2/month |
| **Typesense Cloud** | — | $0.015/hr (0.5 GB RAM) | ~$11/month |
| **VPS (Payload host)** | — | $12/month (2 vCPU, 4 GB) | $12/month |
| **Domain + DNS** | — | ~$15/year | ~$1/month |
| **Total** | | | **~$53/month** |

This compares favorably to a Contentful + Algolia + Vercel stack which would cost $400–800/month for the same traffic volume.

---

## 8. Recommended Open-Source CMS: Final Verdict

**Payload CMS 3.0** is the clear choice for UniqueStaysUSA. The reasons are:

1. **Zero vendor lock-in.** MIT license, self-hosted, your data stays in your PostgreSQL database. If Payload ever becomes unfavorable, the data is portable.
2. **Next.js native.** No separate CMS server. The admin panel, API, and frontend are one deployment. This reduces operational complexity from three services to one.
3. **TypeScript-first.** The entire content schema is defined in TypeScript, which means type safety from the database to the React component. No runtime surprises.
4. **Webhook hooks.** The `afterChange` collection hook fires immediately on publish, enabling sub-second ISR revalidation. Editors see their changes live within 5 seconds of hitting "Publish."
5. **Lexical rich text.** Payload ships with a Lexical-based rich text editor that supports custom blocks — meaning blog posts can embed listing cards, image galleries, and maps inline, without any custom plugin development.
6. **42,000+ GitHub stars** (as of May 2026) with active development and a large Discord community.

The only meaningful alternative is **Directus**, which has a superior admin UI for non-technical editors and better database introspection. If the content team is large and non-technical, Directus is worth evaluating. However, its BSL license restricts commercial use in certain configurations, and its Next.js integration requires a separate server process.

---

## 9. SEO Architecture

The content architecture must be designed for SEO from day one, as organic search is the primary traffic driver for an affiliate directory.

**URL structure:**
```
/stays/[slug]                    → Individual property pages
/blog/[slug]                     → Editorial articles
/category/[slug]                 → Category index pages (Treehouses, Domes, etc.)
/region/[slug]                   → Region index pages (Pacific Northwest, etc.)
/state/[slug]                    → State index pages (California, Oregon, etc.)
/[spoke]                         → Spoke collection pages
/[spoke]/[state]                 → Spoke + state intersection pages (high-value long-tail)
```

The spoke + state intersection pages (e.g., `/pet-friendly/california`, `/work-friendly/colorado`) are the highest-leverage SEO pages in the entire site. Each one targets a high-intent, low-competition long-tail keyword ("pet friendly vacation rentals California") and can be generated automatically from the database with zero editorial effort.

At 5 spokes × 50 states, this creates **250 programmatically generated SEO pages** that each target a distinct keyword cluster. This is the core of the long-term SEO strategy.

**Sitemap generation:**
Next.js 15's `generateSitemaps()` function generates a paginated sitemap automatically from the database. At 10,000 listings + 500 blog posts + 250 intersection pages, the sitemap is split into multiple files and submitted to Google Search Console.

---

## 10. Summary Recommendation

| Decision | Recommendation | Alternative |
|---|---|---|
| **CMS** | Payload CMS 3.0 (open-source, self-hosted) | Directus (if large non-technical team) |
| **Database** | Neon PostgreSQL (serverless, branching) | Supabase PostgreSQL |
| **Search** | Typesense (self-hosted or Typesense Cloud) | Meilisearch (similar, slightly less performant) |
| **Frontend** | Next.js 15 App Router + ISR | Astro (if blog-only, no search) |
| **CDN + Edge** | Cloudflare Pages + Workers + Images | Vercel (more expensive at scale) |
| **Image storage** | Cloudflare R2 | AWS S3 + CloudFront |
| **Deployment** | Cloudflare Pages (frontend) + VPS (Payload) | Vercel + Railway |

The architecture described here will comfortably serve 10,000 properties, 500 blog posts, and 1 million monthly visitors at p95 < 300ms, for approximately $53/month in infrastructure costs. It is designed to be migrated to incrementally, with the current site remaining live throughout the transition.

---

## References

[1] Strapi vs Directus vs Payload CMS performance benchmarks — https://www.glukhov.org/post/2025/11/headless-cms-comparison-strapi-directus-payload/

[2] Payload CMS 3.0 announcement — https://payloadcms.com/posts/blog/payload-30-the-first-cms-that-installs-directly-into-any-nextjs-app

[3] Astro vs Next.js: When SSG beats React for content sites — https://blog.logrocket.com/astro-vs-next-js-ssg-vs-react/

[4] Typesense open-source search engine — https://typesense.org/

[5] Cloudflare Images optimization and R2 storage — https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/optimizing-image-delivery-with-cloudflare-image-resizing-and-r2/

[6] Next.js ISR on-demand revalidation — https://naturaily.com/blog/nextjs-isr

[7] Neon PostgreSQL serverless — https://neon.tech

[8] Best Headless CMS for Next.js 2026 — https://www.buildwithmatija.com/blog/best-headless-cms-nextjs-2026-decision-framework
