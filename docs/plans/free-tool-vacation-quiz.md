# Plan: Free Tool — "Where Should My Next Vacation Be?" (Traveler Tool)

**Created:** May 27, 2026
**Status:** Planning
**Priority:** Build first (simpler, no scraping required)

---

## Problem Frame

Travelers looking for unique stays spend hours scrolling Airbnb without a clear way to find "the one." The paradox of choice is real when you're searching for something extraordinary — filters help you narrow by price and location, but they can't tell you which stay will feel magical.

We need a free, shareable tool that matches travelers to curated unique stays from our database and captures their email in the process.

---

## Evaluation Scorecard

| Factor | Score | Notes |
|--------|-------|-------|
| Search demand exists | 4 | "where should I vacation quiz," "unique stay finder" — moderate volume, low competition |
| Audience match to buyers | 5 | Exact audience — people planning trips who want unique stays |
| Uniqueness vs. existing | 5 | No one does this for unique stays. Airbnb has categories but no quiz/match tool |
| Natural path to product | 5 | Result = curated stays with affiliate booking links |
| Build feasibility | 4 | Query engine against Payload database, React component, no scraping needed |
| Maintenance burden (inverse) | 4 | Low — data stays in Payload, no external API dependency |
| Link-building potential | 5 | Quiz results are inherently shareable ("I got a tugboat!") |
| Share-worthiness | 5 | High — people share quiz results on social, text to travel partners |
| **Total** | **37/40** | Strong candidate |

---

## What It Does

A 5-question quiz that matches travelers to curated unique stays from our database. Each result includes:
- 3-5 ranked stay matches with match scores
- A short narrative for each stay
- A suggested weekend itinerary
- Affiliate booking links
- Email capture ("Save your results" / "Get matched stays delivered to your inbox")

### Questions

1. **Occasion** — Romantic getaway / Solo reset / Friends weekend / Family adventure
2. **Vibe** — Deep woods / Waterfront / Desert silence / Mountain views / Off-grid
3. **Distance** — Within 2 hours / Half-day drive / Fly anywhere
4. **Budget** — Under $150/night / $150-300 / $300-500 / $500+
5. **Must-have** — Views / Privacy / Hot tub / Near hiking / Pet-friendly / Off-grid/WiFi-free

### Result Page

```
Your Next Vacation: A Tugboat on a Private Lake

Top Matches:
1. 🏆 Renovated Tugboat — Louisa, Virginia (94% match)
   "There's an island in the middle of the lake. It's yours if you row to it."
   $225/night · 4.98⭐ · Book →

2. Secluded Treehouse — Atlanta, Georgia (87% match)
   "You cross a rope bridge and the city stops existing."
   $195/night · 4.97⭐ · Book →

3. Lakeside Dome — Broken Bow, Oklahoma (82% match)
   ...

Your Weekend Itinerary:
Friday: Arrive at the tugboat by 4pm. Row to the island before sunset.
Saturday: Kayak the lake. Hike the trails. Visit the local vineyard.
Sunday: Coffee on the dock. Check out by 11am.

[Save These Results] [Share With Your Travel Partner]
```

---

## Technical Design

### Data Source
- Payload CMS stays collection (352 stays currently)
- Each stay has: category (slug), location, price, rating, reviewCount, tags, vibe, description, heroImage
- Need to add: coordinates (for distance calculation), amenities (for must-have matching)

### Matching Algorithm

```
score = 0

// Category match (25 points)
if stay.category matches vibe preference: score += 25

// Budget match (25 points)
if stay.price within budget range: score += 25
if stay.price within 10% of budget boundary: score += 15

// Distance match (25 points)
calculate haversine distance from user zip to stay coordinates
if within chosen radius: score += 25

// Must-have match (15 points)
if stay.tags includes must-have selection: score += 15

// Quality bonus (10 points)
score += (stay.rating / 5.0) * 10

return score
```

### Data Requirements (Gaps to Fill)

| Field | Current State | Action Needed |
|-------|--------------|---------------|
| Coordinates (lat/lng) | Not in current schema | Add `coordinates` field to stays collection; geocode from location string |
| Amenities | Partially in tags | Map existing tags to amenity categories |
| Occasion mapping | Doesn't exist | Create mapping: category + vibe + tags → occasion types |
| User location | Not captured | Ask for zip code in quiz (question 3) or use browser geolocation |

### Frontend

- **Route:** `/vacation-quiz` or `/where-should-my-next-vacation-be`
- **Component:** React step-by-step quiz wizard
- **State management:** URL params (shareable results) or localStorage
- **Result page:** Static, indexable by Google (SSR or ISR via Next.js)
- **Mobile-first:** Most quiz traffic comes from mobile social sharing

### Email Capture

- Triggered by "Save Results" button
- Sends to Mailchimp/ConvertKit/Resend
- Auto-reply with full results + "Your Weekend Itinerary" PDF
- Adds to "Traveler Leads" segment

### SEO Structure

| Page | Target Keywords |
|------|----------------|
| `/vacation-quiz` | "vacation quiz," "where should I vacation," "unique stay finder" |
| `/vacation-quiz/results/romantic-treehouses` | "romantic treehouse getaways" |
| `/vacation-quiz/results/lakefront-under-300` | "lakefront cabins under $300" |
| Result pages (programmatic) | Long-tail match queries |

Result pages are the SEO play. Each unique combination of answers generates a shareable, indexable results page with curated stays. This is programmatic SEO through the quiz.

---

## Implementation Units

### Unit 1: Add Coordinates to Stays
- **Files:** Payload stays collection config, migration script
- **What:** Add `coordinates` field (lat/lng). Write script to geocode all 352 existing stays from their location strings using a free geocoding API (Nominatim).
- **Test:** All stays have valid coordinates; geocoding accuracy within 5 miles.

### Unit 2: Quiz Frontend Component
- **Files:** `src/app/(frontend)/vacation-quiz/page.tsx`, `src/components/VacationQuiz.tsx`
- **What:** 5-step wizard with progress indicator, animated transitions, mobile-optimized. Questions render as clickable cards (not dropdowns).
- **Test:** Quiz completes end-to-end on mobile and desktop. URL updates with answers for sharing.

### Unit 3: Matching Engine (API Route)
- **Files:** `src/app/api/vacation-quiz/route.ts`, `src/lib/matching-engine.ts`
- **What:** POST endpoint that takes quiz answers + zip code, queries Payload for stays, runs matching algorithm, returns top 5 with scores and narratives.
- **Test:** Returns ranked results. Scores reflect actual matches. Handles edge cases (0 results, 1 result).

### Unit 4: Results Page
- **Files:** `src/app/(frontend)/vacation-quiz/results/page.tsx`
- **What:** Displays matched stays with hero images, match scores, narratives, booking links. Includes "Save Results" email capture modal. Social share buttons.
- **Test:** Renders correctly with real data. Booking links contain affiliate tracking. Share button generates correct URL.

### Unit 5: Email Integration
- **Files:** `src/lib/email.ts` or API route
- **What:** Connect to email provider (Resend/Mailchimp). Send confirmation email with full results. Add to traveler segment.
- **Test:** Email sends. Subscriber appears in correct segment.

### Unit 6: SEO & Meta
- **Files:** `src/app/(frontend)/vacation-quiz/page.tsx` (metadata), `src/app/(frontend)/vacation-quiz/results/page.tsx` (metadata)
- **What:** Open Graph tags for social sharing. Dynamic meta descriptions based on quiz results. Structured data for rich snippets.
- **Test:** Shared link shows correct preview image and text on Twitter/LinkedIn/iMessage.

---

## Dependencies
- Geocoding API (Nominatim — free, rate-limited)
- Email provider (Resend recommended — free tier covers 100 emails/day)
- Payload API (existing)
- R2 image URLs (existing)

## Risks
- **Low inventory in certain categories:** If someone picks "desert silence" + "under $150" + "within 2 hours of Boston," we might return 0 results. Mitigation: expand radius automatically, show "closest matches" instead of exact matches.
- **Geocoding accuracy:** Location strings like "Mill Valley, California" are fine. Vague ones need fallback. Mitigation: manual review of geocoding results.

## Timeline
- Unit 1 (coordinates): 1 day
- Unit 2 (quiz UI): 2 days
- Unit 3 (matching engine): 1 day
- Unit 4 (results page): 1 day
- Unit 5 (email): 0.5 days
- Unit 6 (SEO): 0.5 days
- **Total: ~6 days** (can be done in a focused week)
