# UniqueStaysUSA — Automated Property Discovery Pipeline

**Version:** 1.0 | **Date:** May 2026 | **Author:** Manus AI

---

## Executive Summary

The goal of this system is to deliver **15–20 pre-scored, pre-filtered property candidates to your inbox every morning at 7 AM**, requiring nothing more than a single approve or deny click per property. Approved properties are automatically formatted, enriched, and queued for publication. Denied properties are logged with a reason code to continuously improve the AI scoring model.

The entire pipeline runs on **$0–$18/month** in infrastructure costs and requires **zero ongoing maintenance** once configured. It is designed around a single principle: your time is spent on editorial judgment, not on finding or formatting listings.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DISCOVERY LAYER (Nightly 2 AM)              │
│                                                                 │
│  Apify Airbnb Scraper ──┐                                       │
│  Apify VRBO Scraper ────┼──► Raw Candidates (~200/night)        │
│  Wander RSS/API ────────┘                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     SCORING LAYER (2:30 AM)                     │
│                                                                 │
│  Deduplication Check (Neon DB)                                  │
│  Rule-Based Pre-Filter (hard discard rules)                     │
│  GPT-4o Vision Scoring (image quality + uniqueness)             │
│  GPT-4o Text Scoring (description + amenities analysis)         │
│  Composite Score Calculation (0–100)                            │
│  Top 15–20 candidates selected                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     STAGING LAYER (3 AM)                        │
│                                                                 │
│  Airtable "Approval Queue" base populated                       │
│  Property cards formatted with photo, score, tags, spoke        │
│  Morning digest email compiled (HTML with approve/deny links)   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     DELIVERY LAYER (7 AM)                       │
│                                                                 │
│  Morning digest email sent to your inbox                        │
│  Each property has: photo, score, key details, 2 buttons        │
│  [✓ APPROVE] → webhook → auto-publish to site                   │
│  [✗ DENY] → webhook → logged + reason dropdown                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Discovery — Finding Raw Candidates

### The Scraping Strategy

The pipeline runs three parallel Apify actors nightly at 2 AM, each targeting a different platform and spoke category. The goal is to surface ~200 raw candidates per night, which the scoring layer then filters down to the 15–20 best.

**Airbnb Discovery (via Apify `tri_angle/airbnb-scraper`)**

The actor is configured with the following input parameters for each of the 5 spoke categories:

```json
{
  "locationQuery": "United States",
  "propertyType": ["treehouse", "dome", "cave", "houseboat", "barn"],
  "minRating": 4.7,
  "minReviews": 10,
  "maxResults": 60,
  "currency": "USD"
}
```

Each run returns: `id`, `title`, `description`, `thumbnail`, `url`, `roomType`, `rating`, `reviewsCount`, `amenities`, `price`, `coordinates`, `isSuperHost`, `highlights`. At $1.25 per 1,000 results, a nightly run of 200 results costs approximately **$0.25/night ($7.50/month)**.

**VRBO Discovery (via Apify `maxcopell/vrbo-scraper`)**

VRBO is searched by category keywords: "converted church," "lighthouse," "fire tower," "castle," "yurt," "container home." The actor returns listing title, price, rating, review count, image URLs, and direct booking URL.

**Wander Discovery (direct API)**

Wander exposes a public JSON endpoint at `wander.com/api/properties` that returns all current inventory. Since Wander has fewer than 200 properties total, this is a simple full-catalog fetch that checks for new listings not yet in the database.

### Deduplication

Every scraped listing's platform ID is checked against a `discovered_listings` table in Neon PostgreSQL before entering the scoring layer. Listings already in the database (whether approved, denied, or pending) are immediately discarded. This prevents the same property from appearing in the queue multiple times.

---

## Layer 2: Scoring — The AI Editorial Filter

This is the heart of the pipeline. Every raw candidate passes through a four-stage scoring system that produces a composite **Uniqueness Score (0–100)**. Only the top 15–20 candidates by score are passed to the approval queue each morning.

### Stage 1: Hard Discard Rules (Rule-Based, Instant)

These are non-negotiable filters applied before any AI processing. A listing is immediately discarded if:

| Rule | Threshold |
|---|---|
| Rating below | 4.6 stars |
| Review count below | 8 reviews |
| Price per night above | $2,500 |
| Property type is | Standard apartment, condo, or hotel room |
| Title contains | "studio," "1BR," "apartment," "condo," "unit" |
| Already in database | Any status |

Approximately 60–70% of raw candidates are discarded at this stage, reducing 200 candidates to ~60–80 for AI scoring.

### Stage 2: GPT-4o Vision — Image Quality Score (0–30 points)

The primary listing photo is sent to GPT-4o Vision with the following prompt:

```
You are an editorial curator for a luxury unique-stays travel directory. 
Analyze this vacation rental photo and score it from 0–30 based on:

- Uniqueness of the structure (0–12): Is this a treehouse, dome, cave, 
  houseboat, converted building, or other non-standard structure? 
  A standard house scores 0. A geodesic dome scores 10–12.
  
- Photo quality (0–10): Is the photo professional, well-lit, and 
  visually compelling? Blurry or dark photos score 0–3.
  
- Wow factor (0–8): Would this photo stop a traveler mid-scroll on 
  Instagram? Rate the immediate visual impact.

Return ONLY a JSON object: {"uniqueness": X, "photo_quality": X, "wow_factor": X, "total": X, "reasoning": "one sentence"}
```

### Stage 3: GPT-4o Text — Description & Amenity Score (0–40 points)

The listing title, description, and amenities list are sent to GPT-4o with this prompt:

```
You are an editorial curator for UniqueStaysUSA.com, a directory of 
memorable, one-of-a-kind vacation rentals. Score this listing from 0–40:

Title: {title}
Description: {description}
Amenities: {amenities}

Scoring criteria:
- Structural uniqueness (0–15): Is the building itself unusual? 
  (treehouse=15, converted barn=13, A-frame=8, standard house=0)
- Spoke fit (0–10): Does it clearly fit one of our 5 categories?
  (unique/work-friendly/pet-friendly/rv-ready/ev-ready)
- Amenity quality (0–10): Hot tub, stargazing deck, outdoor shower, 
  fire pit, private dock = high scores. Basic amenities = low scores.
- Location interest (0–5): National park adjacent, remote wilderness, 
  coastal cliff, mountain summit = high. Suburban neighborhood = low.

Also identify: which spoke this belongs to, top 3 tags, and a 
one-sentence editorial description (max 15 words, evocative tone).

Return ONLY JSON: {"structural": X, "spoke_fit": X, "amenity": X, 
"location": X, "total": X, "spoke": "unique|work-friendly|pet-friendly|rv-ready|ev-ready", 
"tags": ["tag1","tag2","tag3"], "editorial_description": "..."}
```

### Stage 4: Composite Score & Ranking

The final composite score is calculated as:

```
Composite Score = Image Score (max 30) + Text Score (max 40) + Bonus Points (max 30)

Bonus Points:
  +10  Superhost status
  +8   200+ reviews
  +5   Featured in Airbnb "Unique Stays" category
  +5   Price in $150–$500/night sweet spot
  +2   Listed on Wander (premium signal)
```

The top 15–20 candidates by composite score are selected for the morning queue. In practice, anything scoring above 65/100 is a strong candidate; anything below 50 is discarded even if it makes the top 20 cut.

---

## Layer 3: Staging — The Airtable Approval Base

### Airtable Base Structure

All scored candidates are written to an Airtable base called **"UniqueStays — Approval Queue"** with the following fields:

| Field | Type | Description |
|---|---|---|
| `Property Name` | Text | Listing title |
| `Photo` | Attachment | Primary listing image |
| `Composite Score` | Number | 0–100 AI score |
| `Platform` | Single Select | Airbnb / VRBO / Wander |
| `Booking URL` | URL | Direct link to listing |
| `Price/Night` | Currency | Nightly rate |
| `Location` | Text | City, State |
| `Spoke` | Single Select | Which collection it belongs to |
| `Tags` | Multi-Select | AI-generated tags |
| `Editorial Description` | Long Text | AI-generated 15-word description |
| `Rating` | Number | Platform rating |
| `Review Count` | Number | Number of reviews |
| `Status` | Single Select | Pending / Approved / Denied |
| `Deny Reason` | Single Select | Not unique / Poor photos / Wrong category / Duplicate / Other |
| `Date Discovered` | Date | When scraped |
| `AI Reasoning` | Long Text | GPT-4o's scoring rationale |

### Why Airtable?

Airtable's Interface Designer allows you to build a mobile-optimized approval view where each record shows the property photo, score, key details, and two buttons — **Approve** and **Deny** — without requiring any custom code. The free tier supports up to 1,000 records and 5 editors, which is more than sufficient for this use case. When a button is clicked, an Airtable Automation triggers a webhook to n8n, which handles the downstream publishing or logging.

---

## Layer 4: Delivery — The Morning Digest Email

At 7 AM every morning, n8n compiles the day's approval queue into a single HTML email. Each property is presented as a card:

```
┌─────────────────────────────────────────────────┐
│  [Property Photo — full width]                  │
│                                                 │
│  ★ 4.92 (247 reviews)    Score: 84/100          │
│  The Redwood Canopy Treehouse                   │
│  Guerneville, California · Airbnb               │
│  $289/night · Unique Stays spoke                │
│                                                 │
│  "Suspended 40ft in ancient redwoods with       │
│   a glass floor and outdoor soaking tub."       │
│                                                 │
│  Tags: Treehouse · Hot Tub · Redwood Forest     │
│                                                 │
│  [✓ APPROVE]              [✗ DENY]              │
└─────────────────────────────────────────────────┘
```

Each button is a signed HMAC webhook URL that expires in 48 hours. Clicking **Approve** triggers the publishing workflow. Clicking **Deny** opens a one-question form asking for a reason code (5 options, takes 3 seconds).

---

## The Publishing Workflow (Post-Approval)

When you click **Approve**, the following happens automatically within 60 seconds:

1. **n8n webhook receives the approval** with the property ID
2. **Airtable record status** is updated to "Approved"
3. **GitHub Actions workflow** is triggered via the GitHub API, which:
   - Adds the new listing object to `stays-data.ts`
   - Commits the change with message `feat: add [Property Name] to [spoke] collection`
   - Pushes to the `main` branch on GitHub
4. **Cloudflare Pages** detects the push and rebuilds the site (takes ~45 seconds)
5. **Confirmation email** is sent to you: "✓ [Property Name] is now live on UniqueStaysUSA.com"

The entire approve-to-live cycle takes under 2 minutes with zero manual steps.

---

## Tool Stack & Cost Breakdown

| Tool | Purpose | Cost |
|---|---|---|
| **Apify** | Nightly scraping of Airbnb + VRBO | ~$8/month (200 results/night) |
| **OpenAI GPT-4o** | Image + text scoring (~80 calls/night) | ~$4/month |
| **n8n** (self-hosted on Oracle Free) | Workflow orchestration | $0 |
| **Airtable** | Approval queue UI | $0 (free tier) |
| **Neon PostgreSQL** | Deduplication database | $0 (free tier) |
| **Resend** | Transactional email (digest + confirmations) | $0 (free tier, 3k emails/month) |
| **GitHub Actions** | Auto-commit approved listings | $0 (2,000 min/month free) |
| **Cloudflare Pages** | Site rebuild on commit | $0 |
| **Total** | | **~$12/month** |

---

## Implementation Roadmap

### Phase 1 — Foundation (Week 1–2)

The first step is setting up the Airtable base with the schema described above and building the n8n workflow that populates it. This can be done manually at first — paste a listing URL into n8n, have it call GPT-4o to score it, and write the result to Airtable. This validates the scoring quality before automating the discovery layer.

**Deliverables:** Airtable base configured, n8n scoring workflow working, morning email template designed.

### Phase 2 — Automation (Week 3–4)

Configure the Apify actors to run nightly and pipe their output into the n8n scoring workflow. Set up the HMAC-signed approve/deny webhook URLs and test the full loop: scrape → score → email → approve → publish.

**Deliverables:** Fully automated nightly pipeline running, first batch of 15–20 auto-discovered listings approved and live.

### Phase 3 — Refinement (Month 2)

After 30 days of approvals and denials, you will have a labeled dataset of ~400 properties (approved vs. denied with reasons). Use this to fine-tune the scoring prompts — specifically, adjust the weights for the criteria where your deny reasons cluster. For example, if 40% of denials are "Not unique enough," increase the structural uniqueness weight in the scoring prompt.

**Deliverables:** Refined scoring model, <20% false positive rate (properties that reach your inbox but get denied).

### Phase 4 — Scale (Month 3+)

Add additional data sources: direct booking platforms (Hipcamp, Glamping Hub, Tentrr), Instagram hashtag monitoring for newly-listed unique properties, and a community submission form on the site where hosts can submit their own listings for consideration.

**Deliverables:** 3+ additional data sources, community submission pipeline, 30–40 candidates/night.

---

## Scoring Model: Calibration Guide

The following table shows how the scoring model should classify different property types, based on the editorial criteria for UniqueStaysUSA:

| Property Type | Expected Score Range | Primary Spoke |
|---|---|---|
| Geodesic dome with stargazing deck | 78–92 | Unique |
| Treehouse, 30ft+ elevation | 75–90 | Unique |
| Converted lighthouse | 72–88 | Unique |
| Cave dwelling | 70–85 | Unique |
| Houseboat with private deck | 68–82 | Unique |
| Converted barn with modern interior | 65–78 | Unique |
| A-frame cabin, mountain views | 60–75 | Unique |
| Luxury cabin, fast WiFi, standing desk | 62–76 | Work-Friendly |
| Dog-friendly farmhouse, fenced 2 acres | 58–72 | Pet-Friendly |
| Property with Tesla charger + hot tub | 60–74 | EV-Ready |
| Standard house with RV hookup | 52–65 | RV-Ready |
| Standard 3BR house, no unique features | 20–40 | Discard |
| Apartment or condo | 0–25 | Hard Discard |

---

## Alternative Delivery Channels

While email is the recommended primary channel, the approval workflow can be adapted for other interfaces with minimal changes:

**Telegram Bot:** n8n sends a Telegram message with the property photo, score card, and two inline buttons (✓ / ✗). This is the fastest approval experience — you can approve a listing in 2 seconds from your phone without opening email. Recommended as a secondary channel once the email workflow is stable.

**Airtable Mobile App:** The Airtable Interface Designer produces a mobile-optimized view that works well on iOS/Android. This is the best option if you want to review the full batch at once rather than one-by-one in email.

**Custom Admin Page:** Once the site migrates to the Payload CMS architecture, a custom admin page at `uniquestaysusa.com/admin/queue` can display the approval queue directly in the site's backend, eliminating the need for a separate Airtable subscription entirely.

---

## Data Quality & Legal Considerations

**Scraping legality:** Apify's Airbnb and VRBO scrapers operate on publicly available listing data. The scraped data is used for editorial curation (linking to the original listing), not for reproducing or rehosting the content. This is consistent with how editorial directories, review sites, and comparison engines operate. Airbnb's ToS prohibits automated data collection, but enforcement against editorial directories that link back to listings is effectively non-existent. The risk is low and the mitigation is simple: always link to the original listing, never reproduce full listing text, and use scraped data only for scoring and discovery.

**Image usage:** Property photos displayed on UniqueStaysUSA should be fetched directly from the platform's CDN at display time (as currently implemented), not downloaded and re-hosted. This keeps the site legally clean and ensures photos are always current.

**Affiliate disclosure:** All pages that link to Airbnb, VRBO, or Wander should include a standard affiliate disclosure statement. This is an FTC requirement and is already planned for the site footer.

---

## References

[1] Apify Airbnb Scraper — https://apify.com/tri_angle/airbnb-scraper  
[2] n8n Human-in-the-Loop Approval Flow — https://n8n.io/workflows/9039-create-secure-human-in-the-loop-approval-flows-with-postgres-and-telegram/  
[3] Airtable Reviews and Approvals — https://blog.airtable.com/reviews-approvals-in-airtable/  
[4] n8n Social Media Approval Workflow — https://n8n.io/workflows/8700-automate-social-media-content-creation-and-publishing-with-ai-and-human-approval-flow/  
[5] Bright Data — Best Airbnb Scrapers 2026 — https://brightdata.com/blog/web-data/best-airbnb-scrapers
