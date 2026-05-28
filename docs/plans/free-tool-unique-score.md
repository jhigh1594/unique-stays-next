# Plan: Free Tool — "Unique Score" (Host Tool)

**Created:** May 27, 2026
**Status:** Planning
**Priority:** Build second (requires scraping pipeline + image analysis)

---

## Problem Frame

Unique stay hosts operate blind. They don't know how their listing compares to competitors, whether their photos are good enough, if their pricing is leaving money on the table, or what guests actually care about. Beyond Pricing and AirDNA exist for generic STR hosts, but nothing is built for the unique stays vertical. That's our wedge.

We need a free tool where hosts paste their Airbnb listing URL and get an instant 0-100 "Unique Score" with actionable insights. It captures host email and listing data — the supply side of our flywheel.

---

## Evaluation Scorecard

| Factor | Score | Notes |
|--------|-------|-------|
| Search demand exists | 4 | "airbnb listing grader," "how good is my airbnb listing" — moderate volume |
| Audience match to buyers | 5 | Exact audience — unique stay hosts who want more bookings |
| Uniqueness vs. existing | 5 | Beyond Pricing's Listing Lens exists but is paid + generic. Nothing for unique stays |
| Natural path to product | 5 | Score → "improve your score" → host dashboard / featured listing |
| Build feasibility | 3 | Requires scraping pipeline, image analysis, NLP scoring |
| Maintenance burden (inverse) | 3 | Airbnb scraping is fragile; needs ongoing maintenance |
| Link-building potential | 4 | Hosts share scores in Facebook groups and Reddit |
| Share-worthiness | 4 | "I scored 72 on my Unique Score — what did you get?" |
| **Total** | **33/40** | Strong candidate, higher build complexity |

---

## What It Does

Host enters their Airbnb listing URL. Tool scrapes listing data, compares it against our benchmark database (352+ curated unique stays), and returns a free scorecard.

### The 5 Dimensions

| Dimension | Weight | What We Measure |
|-----------|--------|----------------|
| 📸 Photos | 25% | Count, hero shot quality, unique feature visibility, lighting |
| ✍️ Copy | 20% | Hook quality, sensory language, story-first structure, AI-ism detection |
| 💰 Pricing | 20% | Position vs. comparable stays (same category, same state) |
| ⭐ Guest Signals | 20% | Review sentiment analysis — what guests praise, what they complain about |
| 🏆 Position | 15% | Ranking vs. comparable unique stays in region |

### Result Page

```
Your Unique Score: 67/100

📸 Photos — 72/100
  ✅ 18 photos (above average for your category)
  ⚠️ Your hero shot is an exterior photo. Top-rated stays in your
     category lead with the most dramatic interior angle.
  💡 Swap photo 1 and 3 — put the hot tub view first.

✍️ Copy — 54/100
  ✅ Description length is good (180 words)
  ⚠️ Your title starts with "Cozy cabin near..." — so do 847 other
     listings in your state. Top-rated unique stays lead with the
     experience, not the location.
  ⚠️ Zero sensory language detected. Words like "silence," "creek,"
     "fog" appear in 73% of 4.9+ rated unique stays but not in yours.
  💡 Rewrite your opening line. Don't describe the cabin — describe
     the moment someone arrives.

💰 Pricing — 78/100
  ✅ $195/night is within market range for treehouses in Georgia
  ⚠️ You're priced 12% below comparable stays with similar ratings.
     Based on your review score and amenities, you could charge $220-235.
  💡 That's $25-40/night you're leaving on the table.

⭐ Guest Signals — 81/100
  ✅ Guests consistently praise: hot tub, privacy, fairy lights
  ⚠️ 23% of reviews mention "hard to find" — add detailed directions
  💡 Your top 3 praise words don't appear in your listing description.
     Add "hot tub," "private," and "fairy lights" to your first paragraph.

🏆 Competitive Position — 55/100
  ⚠️ There are 8 treehouses within 50 miles rated above 4.9
  ⚠️ The #1 ranked treehouse in your state has 3x more photos
     and a title that leads with the experience
  💡 See exactly what the top 3 are doing differently →

[Get Your Full Report — $49] [Share My Score]
```

---

## Technical Design

### Data Flow

```
Airbnb URL → Scraper → Raw listing data
                              ↓
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
              Photo analysis  NLP scoring  Pricing comparison
                    ↓         ↓         ↓
                    └─────────┼─────────┘
                              ↓
                        Score calculation
                              ↓
                        Result page
```

### Scraping Layer

**Challenge:** Airbnb aggressively blocks scrapers. Options:

| Approach | Pros | Cons |
|----------|------|------|
| Direct scrape (requests + BeautifulSoup) | Simple, fast | Blocked by Cloudflare/Airbnb bot detection |
| Headless browser (Puppeteer/Playwright) | Can handle JS rendering | Resource-intensive, still detectable |
| Browserless (we have this!) | Already provisioned, cloud-based | 1K req/mo on free tier, still detectable |
| Airbnb public API (if available) | Clean data, no scraping | May not exist for public listings |
| User-paste approach | Zero scraping | Bad UX — hosts don't want to copy-paste |
| Third-party API (Airbnb data providers) | Reliable, maintained | Costs money ($0.01-0.10 per listing) |

**Recommended:** Start with Browserless (Puppeteer-core via WebSocket). We already have it provisioned. If Airbnb blocks, fall back to asking hosts to paste their listing URL and manually enter a few key data points.

### Photo Analysis

Use an image model (via API) to evaluate:
- **Hero shot quality:** Is the first photo the most visually striking, or is it a generic exterior?
- **Unique feature visibility:** Does the photo show the treehouse ropes? The dome exterior? The lake view?
- **Lighting/composition:** Basic quality signals

**Benchmark:** Compare against top-rated stays in the same category (our data).

### Copy Scoring (NLP)

Score listing title and description against our elite-copywriter framework:

| Signal | Points | Detection Method |
|--------|--------|-----------------|
| Title starts with experience, not "Cozy cabin near..." | +15 | Regex pattern matching against common generic openings |
| Sensory language present | +10 | Word list: silence, creek, fog, stars, moss, ferns, canopy, etc. |
| Story-first structure | +10 | First sentence contains second-person narrative ("You climb...") |
| No AI-isms detected | +5 | Flag: "immerse," "discover," "tapestry," "invitation," etc. |
| Description length 100-250 words | +5 | Character count |
| Price not mentioned in first line | +5 | Regex check |

**Total possible:** 50 points, normalized to 100.

### Pricing Intelligence

```
// Compare against our database
comparable_stays = stays.where(
  category == listing.category
  AND state == listing.state
  AND rating >= listing.rating - 0.1
)

percentile = percentile_rank(listing.price, comparable_stays.prices)

if percentile < 30:
  insight = "Priced below market — you could charge more"
if percentile > 70:
  insight = "Priced above market — ensure your experience justifies it"
```

### Review Sentiment

Extract recent reviews (if available via scraping or if we build a review collection pipeline):
- Identify top 3 praise themes
- Identify top 3 complaint themes
- Check if praise themes appear in listing description

**Fallback if reviews unavailable:** Skip this dimension and redistribute weight.

### Position Ranking

```
// Rank within category + state
ranked = stays.where(
  category == listing.category
  AND state == listing.state
).sort_by(rating * review_count_weight)

position = rank_of(listing, ranked)
total = len(ranked)
percentile = position / total
```

---

## Implementation Units

### Unit 1: Airbnb Scraping Pipeline
- **Files:** `src/lib/scraper/airbnb-listing.ts`, `src/app/api/scrape-listing/route.ts`
- **What:** Given an Airbnb URL, extract: title, description, photos (URLs), price, rating, review count, review snippets, location, property type. Use Browserless + Puppeteer.
- **Test:** Successfully scrapes 10 different Airbnb unique stay listings. Handles errors gracefully (blocked, 404, private listing).

### Unit 2: Photo Analysis Module
- **Files:** `src/lib/scoring/photo-analysis.ts`
- **What:** Takes array of photo URLs, returns: hero shot score, photo count score, unique feature visibility score. Uses image model API.
- **Test:** Scores a known high-quality listing (4.9+ rated) higher than a known mediocre listing.

### Unit 3: Copy Scoring Module
- **Files:** `src/lib/scoring/copy-analysis.ts`
- **What:** Takes title + description, returns: hook quality score, sensory language score, structure score, AI-ism score. All rule-based NLP (no LLM needed for MVP).
- **Test:** Scores our hand-crafted captions (from the Instagram pipeline) higher than generic Airbnb descriptions.

### Unit 4: Pricing Comparison Module
- **Files:** `src/lib/scoring/pricing-analysis.ts`
- **What:** Takes listing price + category + location, queries Payload for comparable stays, returns: percentile rank, suggested price range, comparable stay examples.
- **Test:** Returns meaningful comparison for a known stay in our database.

### Unit 5: Score Calculator
- **Files:** `src/lib/scoring/calculate-score.ts`
- **What:** Aggregates all dimension scores with weights, generates insights (one per dimension), assembles result object.
- **Test:** Known input produces expected score range. Edge cases (missing data) handled gracefully.

### Unit 6: Frontend — Input Page
- **Files:** `src/app/(frontend)/unique-score/page.tsx`
- **What:** Clean landing page with Airbnb URL input. Value prop: "Find out how your unique stay stacks up." Examples of past scores. Social proof.
- **Test:** Accepts URL, validates format, shows loading state, navigates to results.

### Unit 7: Frontend — Results Page
- **Files:** `src/app/(frontend)/unique-score/results/page.tsx`
- **What:** Displays 5-dimension scorecard with insights. Email capture for "full report." Share button. CTA for featured listing / host dashboard.
- **Test:** Renders correctly with real scoring data. Share generates correct preview.

### Unit 8: Email Integration + Full Report
- **Files:** `src/lib/email/unique-score-report.ts`
- **What:** Send full report email (PDF or HTML) with detailed recommendations. Add to "Host Leads" segment.
- **Test:** Email sends with correct content. Subscriber added to correct segment.

---

## Monetization Path

| Stage | Free | Paid ($49 one-time or $29/mo) |
|-------|------|-------------------------------|
| Score | ✅ 0-100 overall + per-dimension | ✅ Same |
| Top insight per dimension | ✅ One actionable insight | ✅ Three per dimension |
| Photo rewrite suggestions | ❌ | ✅ Specific crop/angle suggestions |
| Copy rewrite | ❌ | ✅ AI-generated title + description alternatives |
| Pricing optimization | ❌ | ✅ Exact recommended price + seasonal adjustments |
| Competitive deep-dive | ❌ | ✅ Full comparison vs. top 3 competitors |
| Ongoing monitoring | ❌ | ✅ Monthly score updates + trend alerts |

The free tool is the acquisition channel. The paid report is the first revenue.

---

## Dependencies
- Browserless (existing — Puppeteer-core over WebSocket)
- Image analysis API (use configured image model)
- Payload API (existing — for benchmarking data)
- Email provider (Resend)
- Geocoding for distance calculations (Nominatim)

## Risks
- **Airbnb scraping fragility:** High risk. Airbnb changes their DOM regularly and blocks automated access. Mitigation: graceful fallback to manual input; long-term: build API partnership or use third-party data provider.
- **Image model cost:** Processing 10+ photos per listing at scale could get expensive. Mitigation: only analyze hero shot + top 3 photos in free tier; full analysis in paid tier.
- **Thin comparable data:** Some category/state combos may have <5 stays for comparison. Mitigation: expand to "similar categories" or "neighboring states" when sample is small.

## Timeline
- Unit 1 (scraping): 3 days (highest risk, most research needed)
- Unit 2 (photo analysis): 1 day
- Unit 3 (copy scoring): 1 day
- Unit 4 (pricing): 0.5 days
- Unit 5 (score calculator): 0.5 days
- Unit 6 (input page): 1 day
- Unit 7 (results page): 1 day
- Unit 8 (email): 0.5 days
- **Total: ~8-9 days** (1.5-2 weeks with scraping uncertainty)

---

## Build Order Recommendation

1. **Vacation Quiz first** (1 week) — simpler, no scraping, pure query engine
2. **Unique Score second** (1.5-2 weeks) — higher value but more complex

Both tools launch on the same marketing push: "Plan your next vacation AND see how your stay stacks up." One tweet, one Product Hunt launch, one Hacker News post.
