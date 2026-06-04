---
date: 2026-05-30
topic: unique-score-host-tool
---

# Unique Score — Host-Focused Free Tool

## Summary

A free tool where unique stay hosts paste their Airbnb, VRBO, or Wander listing URL and receive an instant "Unique Score" — a multimodal AI evaluation of their listing's quality, feel, and guest experience. Free tier reveals Visual Story and Standout Factor scores with observations. $19 one-time payment unlocks all 5 dimensions with specific improvement recommendations.

---

## Problem Frame

Unique stay hosts operate blind. They don't know whether their photos create desire or indifference. They don't know if their copy reads like a love letter or a spec sheet. They don't know if their listing looks like every other cabin within 50 miles. Guest expectations for unique stays are rising — 4.8 stars is the floor, not the ceiling — and hosts have no way to benchmark themselves against the stays that guests can't stop talking about.

Beyond Pricing's Listing Lens (the closest competitor) has been discontinued. Generic STR tools like Hostaway and iGMS focus on property management, not listing quality. Nobody is building for the unique stays vertical, and nobody is using multimodal AI to evaluate listings the way a discerning guest actually experiences them.

The cost of not knowing is real: hosts with forgettable listings get fewer bookings, lower rankings, and cheaper nightly rates than their experience deserves. A 10-point improvement in listing quality can mean the difference between a $150/night listing and a $220/night listing.

---

## Actors

- A1. **Host:** Unique stay host (treehouse, dome, A-frame, airstream, cabin, etc.) who wants to improve their listing and attract more bookings
- A2. **Traveler (secondary):** Indirect beneficiary — better listings mean better guest experiences on Unique Stays USA

---

## Key Flows

- F1. **Free Score Flow**
  - **Trigger:** Host lands on Unique Score page
  - **Actors:** A1
  - **Steps:** Host pastes listing URL (Airbnb, VRBO, or Wander) → system scrapes photos + text from listing page → multimodal AI analyzes listing across 5 dimensions → results page shows overall score (blurred), Visual Story score, Standout Factor score, 2-3 observations per free dimension, and one improvement suggestion per free dimension → 3 locked dimension cards visible with upsell CTA
  - **Outcome:** Host sees enough value to share or pay. Email captured between free results and upsell.
  - **Covered by:** R1, R2, R3, R4, R5

- F2. **Paid Report Flow**
  - **Trigger:** Host clicks "Unlock Full Report — $19" on results page
  - **Actors:** A1
  - **Steps:** Host enters email (if not already captured) → payment via Stripe → full report unlocks on-screen with all 5 dimension scores, specific recommendations per dimension, and benchmarking context → report delivered via email
  - **Outcome:** Host receives actionable improvement plan. Host email added to "Host Leads" list.
  - **Covered by:** R6, R7, R8

- F3. **Share Flow**
  - **Trigger:** Host clicks "Share My Score" on results page
  - **Actors:** A1, A2
  - **Steps:** System generates shareable result card (OG image with overall score + free dimension scores) → host shares to social media → viewer clicks through to Unique Score tool
  - **Outcome:** Viral loop. Each share drives new hosts to the tool.
  - **Covered by:** R9

---

## Requirements

**Input and Scraping**

- R1. Accept listing URLs from Airbnb, VRBO, and Wander. Validate URL format before processing. Reject invalid or unsupported URLs with a clear error message.
- R2. Scrape listing page to extract: all photo URLs, listing title, description, amenity list, review snippets (if available), and host-visible metadata (rating, review count, property type). Graceful degradation — if reviews are unavailable, the Guest Confidence dimension adjusts accordingly.
- R3. Scrape timeout of 30 seconds. Show loading state with progress indication during scrape + analysis. Total turnaround from URL paste to score display under 60 seconds.

**Multimodal AI Analysis**

- R4. Feed all extracted data (photos + text + metadata) to a multimodal model in a single structured prompt. Model returns structured JSON with scores and observations for all 5 dimensions simultaneously.
- R5. The 5 scoring dimensions, their weights, and what the model evaluates:

  | Dimension | Weight | What the model evaluates |
  |-----------|--------|------------------------|
  | Visual Story | 25% | Photos — hero shot impact, sequence, lighting, showing the experience vs. the structure, would a guest screenshot this? |
  | Standout Factor | 20% | Differentiation — does this listing look different from generic stays in the same category? Are unique features visible and prominent? |
  | Written Story | 20% | Copy — hook quality, sensory language, narrative energy vs. spec-sheet listing, AI-ism detection |
  | Guest Confidence | 20% | Reviews + amenities + completeness — can a guest trust what they're getting? Are key amenities listed? Is information thorough? |
  | Experience Depth | 15% | Beyond the bed — nearby activities, atmosphere details, seasonal magic, does this feel like a reason to travel? |

- Each dimension score is 0-100, with 2-3 specific observations and 1 concrete improvement suggestion per dimension.

**Free Tier Display**

- R6. Free tier reveals: Visual Story score, Standout Factor score, observations and suggestions for both dimensions. Overall score shown as blurred/locked. Remaining 3 dimensions shown as locked cards with dimension name and lock icon.
- R7. Email capture field positioned between free results and paid upsell. Labeled "Send me my free scores" — not gated, not required. Optional.

**Paid Report ($19)**

- R8. $19 one-time payment unlocks: all 5 dimension scores with full observations and recommendations, overall score, benchmarking context (how the listing compares to top-rated unique stays in its category), and specific actionable improvements. Payment via Stripe. Report viewable on-screen and delivered via email.

**Sharing and SEO**

- R9. "Share My Score" generates an OG image card with the listing's overall score badge and free dimension scores. Share link goes to the results page (not the tool homepage). Results page is shareable via URL parameters but not publicly indexable (no programmatic SEO for host scores — these are private results).
- R10. The tool landing page (unique-stays-usa.com/unique-score) is indexable by Google and targets keywords: "airbnb listing grader," "unique stay score," "listing quality checker," "how good is my airbnb listing."

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given a valid Airbnb URL, when the host submits it, the system scrapes the listing within 30 seconds, extracts photos + title + description + amenities + reviews, and proceeds to analysis without error.
- AE2. **Covers R1.** Given a URL from an unsupported platform (e.g., Booking.com), when the host submits it, the system displays: "We currently support Airbnb, VRBO, and Wander listings."
- AE3. **Covers R2.** Given an Airbnb listing with no reviews, when scraped, the Guest Confidence dimension excludes review analysis and scores based on amenities and info completeness only.
- AE4. **Covers R6, R7.** Given a completed free analysis, the results page shows Visual Story and Standout Factor scores fully, overall score blurred, 3 locked dimensions, and an optional email field. Host can see their free scores without entering email.
- AE5. **Covers R8.** Given a host who has completed payment, the full report displays all 5 dimension scores with specific recommendations and is also sent to their email.

---

## Success Criteria

- **Host conversion:** 5%+ of free score users purchase the $19 full report within 7 days of receiving their score
- **Share rate:** 15%+ of users share their score via the share button
- **Tool traffic:** 500+ unique hosts use the tool in the first 30 days
- **Quality signal:** Hosts who implement recommendations and re-score show a measurable score improvement on re-analysis
- **Downstream handoff:** Planning receives clear enough scope that no product behavior needs to be invented — all dimensions, weights, free/paid boundaries, and flows are specified

---

## Scope Boundaries

- Pricing comparison / competitive pricing analysis — replaced by experience quality focus
- Ongoing monitoring or scheduled re-scoring — one-time score only for v1
- Host dashboard or portal — the tool is a standalone page, not an account-based system
- Listing rewrite generation (AI-generated copy alternatives) — deferred for v2
- Photo editing or enhancement suggestions — deferred for v2
- Booking widget or affiliate link on the score page — not in this tool's identity
- Mobile app — web-only, mobile-first responsive design

---

## Key Decisions

- **Multimodal AI over DOM parsing:** The model evaluates listing quality the way a guest would — by looking at photos and reading copy — rather than extracting structured fields and scoring against rules. This produces more nuanced, actionable feedback.
- **Visual Story + Standout Factor as free dimensions:** These are the most visceral and shareable dimensions. Visual Story creates emotional response ("my photos scored 42"), Standout Factor creates urgency ("I don't look different"). Together they drive both sharing and upsell.
- **$19 price point over $49:** Impulse-buy territory for hosts. Volume over margin at this stage. The tool is an acquisition channel first, revenue stream second.
- **Airbnb + VRBO + Wander support from day one:** Three platforms cover the vast majority of unique stay listings. Direct booking sites excluded due to unstructured page formats.
- **Email optional, not required for free scores:** Reduces friction. Hosts who skip email can still share. Email capture sits naturally between free value and paid upsell.

---

## Dependencies / Assumptions

- Browserless (existing provision) can reliably scrape Airbnb, VRBO, and Wander listing pages for photos + text. We confirmed Airbnb renders title, description, photos, rating, and review count in server-rendered HTML.
- A free or low-cost multimodal model (Gemini Flash, configured image model) can process 10-20 listing photos + text in a single API call and return structured JSON. Cost per analysis should be under $0.10.
- Stripe account is set up for $19 one-time payment processing.
- The "Host Leads" email list is maintained in Resend or a similar provider for future host-facing communication.
- Experience Depth dimension may score low across the board at launch if most listings lack activity/atmosphere content. Model calibration needed after first 50-100 analyses.

---

## Outstanding Questions

### Resolve Before Planning

- [Affects R8][Business decision] ~~Payment processor: is Stripe already configured for Unique Stays USA, or does this need setup?~~ **Resolved:** Stripe needs to be set up. Added to planning as a setup task.
- [Affects R4][Technical] ~~Which multimodal model to use for the analysis — Gemini Flash (free tier), the configured image model, or something else? Cost/quality trade-off needs a concrete answer.~~ **Resolved:** Gemini Flash.

### Deferred to Planning

- [Affects R2][Technical] Exact scraping strategy per platform — which DOM selectors, how to handle platform-specific rendering differences, error handling for blocked scrapes.
- [Affects R4][Needs research] Prompt engineering for the multimodal analysis — the structured prompt that produces consistent, calibrated scores needs iteration and testing against known-good and known-bad listings.
- [Affects R9][Technical] OG image generation approach for share cards — server-side image generation vs. pre-built templates.
