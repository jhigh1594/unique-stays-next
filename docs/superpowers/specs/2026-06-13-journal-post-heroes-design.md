# Journal Post Hero Images — Design

**Date:** 2026-06-13
**Status:** Approved (all 21 rows) — execute dry-run, then live
**Scope:** Add hero images to the 21 published journal posts that lack them.

## Problem

23 published posts; only 2 have a `heroImage`. The other 21 render hero-less on
`/journal` index cards, `/journal/{slug}` pages, and social/OG image tags.

`heroImage` is an `upload → media` relation (not a URL string), R2-backed. The
`media` collection auto-generates a 1600×900 `hero` size on upload.

## Source decision

Real stay **gallery** photos — accurate (~99%, airbnb-pp-cli pipeline), already on
R2 (`pub-…r2.dev/stays/{slug}/gallery-N.jpg`), and on-brand with the 2 existing
heroes (which are real stay photos). NOT the scraped `imageUrl` hero (~9%
wrong-property per 2026-06-13 audit) and NOT stock/AI.

Gallery images are stored as `imageUrl` strings (not media docs), so each hero is
downloaded and uploaded as a fresh media record, then referenced.

## Matching rules

- **Linked posts (10):** prefer a linked stay that also matches the post theme
  (category/tag/region); fall back to any linked stay with gallery. Respects
  editorial curation.
- **Unlinked posts (11):** exact-token tag/category/region predicate per post,
  then rank by quality `editorsPick(2)+featured(1)+rating+reviewCount`.
- **Diversify:** no stay reused across posts (greedy, process in slug order).
- **Min gallery:** ≥2 images (avoids thin single-photo stays).
- All 21 resolved to distinct, thematically-appropriate, high-quality stays.

## Approved mapping (21)

| Post | Stay hero | Rationale |
|------|-----------|-----------|
| romantic-cabin-getaways-couples | basecamp-treeloft-mo | linked, EP, 692 reviews |
| hidden-untouched-places-usa | willow-treehouse-ny | off-grid, No WiFi, pond |
| alternatives-overcrowded-destinations | treefarm-silo-lapine-or | secluded Oregon silo |
| quiet-great-lakes-summer-guide | turtle-yurts-bayfield-wi | linked, Lake Superior |
| undiscovered-summer-vacation-spots-usa | secluded-intown-treehouse-ga | linked, EP |
| cool-weather-summer-escapes-america | glamping-montana | linked, Glacier NP |
| lakefront-unique-stays-water-cabins-domes-aframes | tugboat-private-lake-va | Private Lake houseboat |
| halloween-getaways-unique-stays | meadowlark-treehouse-mt | forest treehouse, Glacier |
| thanksgiving-getaways-unique-stays | sauna-aframe-saugerties-ny | Catskills a-frame |
| snow-globe-stays | desert-dome-ut | Dark Sky, sauna, hot tub |
| october-unique-stays | bar-harbor-treehouse-me | Acadia, fireplace, NE fall |
| fishing-cabins-unique-stays-anglers | lake-vermilion-houseboat-mn | houseboat, Boundary Waters, Fishing |
| unique-stays-near-national-forests | wander-arch-cape-forest | old-growth forest a-frame |
| stargazing-getaways-dark-sky-unique-stays | romantic-mountain-dome-nc | Stargazing from Bed |
| extraordinary-treehouses-america | treehouse-point-temple-wa | Pete Nelson design |
| best-unique-stays-joshua-tree | wander-joshua-tree-starfall | linked, Joshua Tree |
| skip-the-crowds-national-park-alternatives | tiny-community-lancaster-pa | linked |
| remote-workers-guide-unique-stays | wander-lake-bomoseen | linked, Wifi, VT |
| unique-stays-with-pools | autocamp-yosemite-ca | linked, Pool |
| glamping-for-beginners | dreamy-yurt-steamboat-co | linked, yurt, Rockies |
| best-aframe-cabins-america | wander-bend-retreat | real a-frame |

## Implementation

New script `scripts/set-post-heroes-batch.ts`, run via
`pnpm exec tsx --env-file=.env.local`. Writes directly to **prod Neon** (DATABASE_URI)
and **prod R2** (R2_ACCESS_KEY_ID/SECRET) — same path as existing hero scripts.

Per post:
1. Find post by slug (`depth:0`). If `heroImage` already set → skip (idempotent).
2. Find stay by slug (`depth:1`). Take `galleryImages[0].imageUrl` (R2).
3. Download bytes → `payload.create media` (`alt` = stay title + location) → R2
   upload, generates hero size. Filename `{postSlug}-hero.jpg`.
4. `payload.update blog-posts { heroImage: media.id }`.
5. Revalidate prod cache: POST `https://www.uniquestaysusa.com/api/revalidate`
   with `x-revalidate-secret` for tags `journal:{slug}` (per post) and `journal`
   (index, once at end). Hardcode prod URL — `.env.local`'s `NEXT_PUBLIC_SERVER_URL`
   is localhost, which the existing `upload-hero.ts` lib wrongly targets.
6. Verify: re-fetch post, assert `heroImage.url` is R2 + HTTP 200.

`--dry` flag: log the planned (post → stay → gallery URL) for every row, no writes.

## Safety

- Idempotent (skips posts already hero'd; safe to re-run).
- One prod revalidate at end for the `journal` index tag.
- Existing 2 heroes untouched.
- Rollback: set `heroImage` to null per post via PATCH (or delete media).

## Verification

- `GET /api/blog-posts?depth=1` → confirm 23/23 have R2 `heroImage.url`.
- Load `/journal` (cards) + 2-3 `/journal/{slug}` pages; confirm heroes render.
- OG image tags on a post page resolve.
