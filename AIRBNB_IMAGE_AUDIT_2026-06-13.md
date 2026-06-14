# Airbnb Image Health Audit — 2026-06-13

> **STATUS: 17 heroes FIXED (2026-06-13).** Re-sourced each from `airbnb-pp-cli` real photo #0
> → R2 `stays/{slug}.jpg` → `imageUrl`. Re-verified: all 17 now dist 0 (photo-identical) vs their
> listing's real set. Gallery issues + delisted/malformed URLs still open (see Recommended Fix).

Trigger: `sage-canyon-cliff-house-co` hero showed a tropical kitchen, not the Cortez cliff house.
Method: `airbnb-pp-cli` = ground-truth photo set per listing (50–60 captioned photos).
Each stored hero/gallery image compared to its listing's full real set by:
- **muscache URL** → UUID substring match (definitive, no download)
- **R2 image** → dHash (9×8) vs **full** real set, Hamming ≤ 12/64 = match

Threshold validated: 2 spot-checked mismatches (dist 16 & 26) depict the *right structure type*
(e.g. a dome for a dome listing) but a **different property** — invisible to a glance, caught only
by perceptual comparison. Clean bimodal gap: matches at dist 0–4, mismatches at 16–26.

## Summary

| Metric | Count |
|---|---|
| Total Airbnb stays | 192 |
| Audited | 182 |
| Skipped (6 delisted + 4 bad affiliateUrl) | 10 |
| Hero OK | 165 |
| **Hero wrong-property** | **17 (9.3%)** |
| ↳ all 17 are R2 heroes (`stays/{slug}.jpg`) | 17 |
| ↳ muscache heroes wrong | 0 |
| Gallery OK | 181 |
| Gallery wrong-property (1 stay, 4/7 imgs) | 1 |
| Gallery duplicate-only (correct property, repeated imgs) | 1 |

## Root Cause

Two pipelines write stay images, with very different fidelity:

- **Gallery** (`galleryImages`, key `stays/{slug}/gallery-N.jpg`) — `fetch-gallery-images.ts`
  → `airbnb-pp-cli`. **Accurate.** Only 1 of 182 listings corrupted.
- **Hero** (`imageUrl`, key `stays/{slug}.jpg`) — `fix-hero-images.ts` (Firecrawl) +
  `backfill-missing-images.ts` (crawl4ai). Firecrawl/crawl4ai on Airbnb return
  wrong-property-but-plausible images (scrape noise, redirects, "similar homes" carousels,
  or img-tag fallback). 17 heroes show a different house.

The existing `scripts/audit-image-health.ts` checks **liveness + R2 hosting only** — it cannot
flag a live, valid R2 image that shows the *wrong* house. That is why 17 wrong heroes persisted.

ID clustering: **all 17 mismatches are stay IDs 154–373; zero in IDs 1–153.** The hero bug is
concentrated in later-imported batches.

## Hero Mismatches (17) — re-scrape these

| Stay | Listing | dist |
|---|---|---|
| [nevada-city-dome-ca](https://www.uniquestaysusa.com/stays/nevada-city-dome-ca) | [869404143773279174](https://www.airbnb.com/rooms/869404143773279174) | 26 |
| [copper-fox-treehouse-vt](https://www.uniquestaysusa.com/stays/copper-fox-treehouse-vt) | [1025206498994795956](https://www.airbnb.com/rooms/1025206498994795956) | 23 |
| [sage-canyon-cliff-house-co](https://www.uniquestaysusa.com/stays/sage-canyon-cliff-house-co) | [33513388](https://www.airbnb.com/rooms/33513388) | 23 |
| [fox-wood-dome-ar](https://www.uniquestaysusa.com/stays/fox-wood-dome-ar) | [648903776956825503](https://www.airbnb.com/rooms/648903776956825503) | 22 |
| [shawnee-forest-dome-il](https://www.uniquestaysusa.com/stays/shawnee-forest-dome-il) | [1326574608417997424](https://www.airbnb.com/rooms/1326574608417997424) | 22 |
| [basecamp-treeloft-mo](https://www.uniquestaysusa.com/stays/basecamp-treeloft-mo) | [44119404](https://www.airbnb.com/rooms/44119404) | 21 |
| [skydome-hideaway-tx](https://www.uniquestaysusa.com/stays/skydome-hideaway-tx) | [667679648479911030](https://www.airbnb.com/rooms/667679648479911030) | 21 |
| [houseboat-sauna-ca](https://www.uniquestaysusa.com/stays/houseboat-sauna-ca) | [50129710](https://www.airbnb.com/rooms/50129710) | 21 |
| [indian-river-aframe-mi](https://www.uniquestaysusa.com/stays/indian-river-aframe-mi) | [898660299335253029](https://www.airbnb.com/rooms/898660299335253029) | 21 |
| [houseboat-mill-valley-ca](https://www.uniquestaysusa.com/stays/houseboat-mill-valley-ca) | [1394270622994162073](https://www.airbnb.com/rooms/1394270622994162073) | 20 |
| [hanksville-cave-home-ut](https://www.uniquestaysusa.com/stays/hanksville-cave-home-ut) | [32183107](https://www.airbnb.com/rooms/32183107) | 19 |
| [castle-flagstaff-az](https://www.uniquestaysusa.com/stays/castle-flagstaff-az) | [12384486](https://www.airbnb.com/rooms/12384486) | 18 |
| [bliss-ridge-farm-treehouse-vt](https://www.uniquestaysusa.com/stays/bliss-ridge-farm-treehouse-vt) | [44915530](https://www.airbnb.com/rooms/44915530) | 17 |
| [willow-treehouse-ny](https://www.uniquestaysusa.com/stays/willow-treehouse-ny) | [13761529](https://www.airbnb.com/rooms/13761529) | 17 |
| [pocono-castle-escape-room-pa](https://www.uniquestaysusa.com/stays/pocono-castle-escape-room-pa) | [46853667](https://www.airbnb.com/rooms/46853667) | 17 |
| [romantic-mountain-dome-nc](https://www.uniquestaysusa.com/stays/romantic-mountain-dome-nc) | [1184087128475768662](https://www.airbnb.com/rooms/1184087128475768662) | 16 |
| [morristown-barn-silo-vt](https://www.uniquestaysusa.com/stays/morristown-barn-silo-vt) | [20524559](https://www.airbnb.com/rooms/20524559) | 16 |

## Gallery Issues (1 confirmed + 1 duplicate)

- **[the-highland-grainbin-highland-cows-firepit](https://www.uniquestaysusa.com/stays/the-highland-grainbin-highland-cows-firepit)** — 4 of 7 wrong-property (idx 0,1,4,6; dist 21–23) + remaining 3 are duplicate copies of one photo. Re-scrape full gallery.
- **[luxury-glamping-dome-with-jacuzzi-mountain-view](https://www.uniquestaysusa.com/stays/luxury-glamping-dome-with-jacuzzi-mountain-view)** — all 7 gallery slots are the *same* photo (real#0). Correct property, but duplicated. (Initial g4 flag was a transient download false-positive.)

## Skipped — needs manual check (10)

**6 delisted** (Airbnb returns "listing not found" — likely dead affiliate links too):
sausalito-floating-home-ca (21852195), houseboat-nomad-pemaquid-me (23922247),
hobbit-house-pawling-ny (44528835), oceanview-3br-cor-ten-house (902127241685454731),
2-story-historic-carriage-house-on-estate (725382737583680023),
eccentric-geodesic-dome-home-near-downtown-hville (48564371).

**4 malformed affiliateUrl** (no `/rooms/<id>` — auto-gen slug from a search/result page):
northern-california-ca-vacation-rentals-5-out-of-5-airbnb, lighthouse-keeper-for-a-day,
el-albaic-n-spain-vacation-rentals-4-7-out-of-5-airbnb,
swim-in-the-ancestral-waters-hidden-underground-4-98.

## Recommended Fix

1. **17 heroes** — re-scrape via `airbnb-pp-cli` real photo #0 (the trusted gallery source),
   upload to `stays/{slug}.jpg`, set `imageUrl`. Stop using Firecrawl/crawl4ai for Airbnb heroes.
2. **the-highland-grainbin** — re-run `fetch-gallery-images.ts` on that slug.
3. **6 delisted** — confirm affiliate links 404; remove or re-source listings.
4. **4 malformed URLs** — fix `affiliateUrl` to real `/rooms/<id>` (or drop).
5. **Prevention** — DONE. Semantic check folded into `scripts/audit-image-health.ts`
   (`--semantic` flag) backed by `scripts/lib/image-semantic.ts`. Compares hero/gallery to
   `airbnb-pp-cli` ground truth via muscache-UUID or dHash; flags `hero_semantic_mismatch` /
   `gallery_semantic_mismatch`. Post-fix re-audit: **0 hero + 0 gallery semantic mismatches.**
   Fixer for any future finds: `scripts/tmp-fix-heroes.ts --pilot <slug,slug>`.
