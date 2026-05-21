#!/usr/bin/env python3
"""Spoke-specific stay discovery pipeline using crawl4ai.

Discovers vacation rental listings for underpopulated spoke categories
(work-friendly, pet-friendly, rv-ready, ev-ready), extracts structured
data including spoke-specific fields, scores for novelty, and writes
candidates to the Payload candidate-stays collection.

Usage:
    .venv-crawl/bin/python scripts/discover-spoke-stays.py --spoke work-friendly --limit 50
    .venv-crawl/bin/python scripts/discover-spoke-stays.py --spoke pet-friendly --pilot
    .venv-crawl/bin/python scripts/discover-spoke-stays.py --spoke rv-ready --source hipcamp --limit 30
    .venv-crawl/bin/python scripts/discover-spoke-stays.py --spoke ev-ready --resume
    .venv-crawl/bin/python scripts/discover-spoke-stays.py --spoke unique --source direct --limit 30
    .venv-crawl/bin/python scripts/discover-spoke-stays.py --spoke unique --source direct --pilot
"""

import argparse
import asyncio
import json
import os
import sys
import time
from difflib import SequenceMatcher

# Add scripts/lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))

from payload_client import get_existing_urls, get_all_stays_brief, create_candidate, get_spoke_id  # noqa: E402
from spoke_discovery_config import (  # noqa: E402
    SPOKES, SEARCH_URLS, EXA_QUERIES, EXA_DIRECT_BOOKING_QUERIES,
    CURATION_SITES, detect_platform,
)
from spoke_extractor import collect_urls_from_search, extract_batch  # noqa: E402
from spoke_scorer import score_batch  # noqa: E402
from exa_searcher import search_listings, search_direct_bookings  # noqa: E402
from direct_booking_searcher import crawl_curation_sites  # noqa: E402

PROGRESS_DIR = "/tmp"
MIN_NOVELTY_SCORE = 4
BATCH_SIZE = 10


def normalize_title(title: str) -> str:
    return "".join(c.lower() for c in title if c.isalnum() or c == " ").strip()


def title_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_title(a), normalize_title(b)).ratio()


def clean_url(url: str) -> str:
    """Strip query params and trailing slashes for dedup."""
    url = url.split("?")[0].split("#")[0].rstrip("/")
    return url


def dedup_listings(
    discovered: list[dict],
    existing_stay_urls: set[str],
    existing_candidate_urls: set[str],
    existing_stays: list[dict],
) -> list[dict]:
    """Three-layer dedup: URL exact, URL canonical, fuzzy title."""
    canonical_stays = {clean_url(u) for u in existing_stay_urls}
    canonical_candidates = {clean_url(u) for u in existing_candidate_urls}
    existing_titles = [normalize_title(s.get("title", "")) for s in existing_stays]

    unique = []
    for listing in discovered:
        url = listing.get("url") or listing.get("sourceUrl", "")
        canonical = clean_url(url)

        # Layer 1: exact URL
        if url in existing_stay_urls or url in existing_candidate_urls:
            continue
        # Layer 2: canonical URL
        if canonical in canonical_stays or canonical in canonical_candidates:
            continue
        # Layer 3: fuzzy title (>0.85 similarity)
        title = listing.get("title", "")
        if title and any(title_similarity(title, t) > 0.85 for t in existing_titles if t):
            continue

        unique.append(listing)

    return unique


def validate_spoke_fields(data: dict, spoke: str) -> bool:
    """Check if at least one spoke-specific field is populated."""
    spoke_field_map = {
        "work-friendly": ["wifiSpeed", "hasDesk"],
        "pet-friendly": ["petFriendly", "petPolicy"],
        "rv-ready": ["rvHookup", "rvInfo"],
        "ev-ready": ["evCharger", "evInfo"],
    }
    fields = spoke_field_map.get(spoke, [])
    return any(data.get(f) for f in fields)


def build_candidate(data: dict, spoke: str, novelty: dict) -> dict:
    """Build a candidate-stays record from extracted data."""
    spoke_fields = {}
    spoke_field_map = {
        "work-friendly": ["wifiSpeed", "hasDesk"],
        "pet-friendly": ["petFriendly", "petPolicy"],
        "rv-ready": ["rvHookup", "rvInfo"],
        "ev-ready": ["evCharger", "evInfo"],
    }
    for field in spoke_field_map.get(spoke, []):
        if data.get(field) is not None:
            spoke_fields[field] = data[field]

    # Build a rich description including spoke data for admin review
    desc_parts = []
    if data.get("description"):
        desc_parts.append(data["description"][:500])
    if data.get("amenities"):
        desc_parts.append(f"Amenities: {', '.join(data['amenities'][:20])}")
    for field, val in spoke_fields.items():
        if val:
            desc_parts.append(f"{field}: {val}")

    # Map state to region
    state_to_region = {
        "CT": "Northeast", "ME": "Northeast", "MA": "Northeast", "NH": "Northeast",
        "RI": "Northeast", "VT": "Northeast", "NJ": "Northeast", "NY": "Northeast",
        "PA": "Northeast", "IL": "Midwest", "IN": "Midwest", "IA": "Midwest",
        "KS": "Midwest", "MI": "Midwest", "MN": "Midwest", "MO": "Midwest",
        "NE": "Midwest", "ND": "Midwest", "OH": "Midwest", "SD": "Midwest", "WI": "Midwest",
        "AZ": "Southwest", "NM": "Southwest", "OK": "Southwest", "TX": "Southwest",
        "CA": "West", "CO": "West", "ID": "West", "MT": "West", "NV": "West",
        "OR": "West", "UT": "West", "WA": "West", "WY": "West",
        "AL": "South", "AR": "South", "DE": "South", "FL": "South", "GA": "South",
        "KY": "South", "LA": "South", "MD": "South", "MS": "South", "NC": "South",
        "SC": "South", "TN": "South", "VA": "South", "WV": "South",
        "AK": "West", "HI": "West", "DC": "South",
    }

    # Try to extract state from location
    state = data.get("state", "")
    location = data.get("location", "")
    if not state and "," in location:
        state = location.split(",")[-1].strip()

    # Normalize state abbreviations and full names
    state_upper = state.upper()
    state_to_abbr = {
        "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
        "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
        "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
        "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
        "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
        "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS",
        "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
        "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
        "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
        "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
        "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT",
        "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV",
        "WISCONSIN": "WI", "WYOMING": "WY", "DISTRICT OF COLUMBIA": "DC",
    }
    abbr = state_to_abbr.get(state_upper, state_upper)
    region = state_to_region.get(abbr, "West")

    return {
        "sourceUrl": data.get("sourceUrl", ""),
        "platform": data.get("platform", detect_platform(data.get("sourceUrl", ""))),
        "title": data.get("title", ""),
        "location": location,
        "state": state,
        "region": region,
        "price": data.get("price"),
        "rating": data.get("rating"),
        "reviewCount": data.get("reviewCount"),
        "imageUrl": data.get("imageUrl", ""),
        "scrapedDescription": "\n".join(desc_parts)[:2000],
        "scrapedAmenities": [{"amenity": a} for a in (data.get("amenities") or [])[:30]],
        "noveltyScore": novelty.get("score", 0),
        "noveltyReason": novelty.get("reason", ""),
        "status": "pending",
        "discoveredAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        # Spoke-specific fields for auto-promotion
        "targetSpoke": spoke,
        "spokeFields": json.dumps(spoke_fields),
    }


def load_progress(spoke: str) -> dict:
    """Load progress from a previous run."""
    path = os.path.join(PROGRESS_DIR, f"discover-spoke-{spoke}-progress.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"scraped_urls": [], "written": 0, "failed": 0}


def save_progress(spoke: str, progress: dict):
    """Save progress for resume support."""
    path = os.path.join(PROGRESS_DIR, f"discover-spoke-{spoke}-progress.json")
    with open(path, "w") as f:
        json.dump(progress, f, indent=2)


async def run_pipeline(args):
    """Main pipeline execution."""
    spoke = args.spoke
    pilot = args.pilot
    limit = args.limit or 50
    source_filter = args.source
    force = args.force
    resume = args.resume

    print(f"{'='*60}")
    print(f"Spoke Discovery: {spoke}")
    print(f"Mode: {'PILOT (dry run)' if pilot else 'LIVE'}")
    print(f"Limit: {limit}")
    print(f"{'='*60}\n")

    # Phase 1a: Collect URLs from search pages
    print("Phase 1a: Collecting listing URLs from search pages...")
    search_urls = SEARCH_URLS.get(spoke, {})
    urls_to_crawl = []

    for platform, urls in search_urls.items():
        if source_filter and platform != source_filter:
            continue
        urls_to_crawl.extend(urls)

    discovered = []
    if urls_to_crawl:
        discovered = await collect_urls_from_search(urls_to_crawl, delay_s=3.0)
    print(f"  Collected {len(discovered)} listing URLs from search pages")

    # Phase 1b: Collect URLs from Exa semantic search
    exa_queries = EXA_QUERIES.get(spoke, [])
    if exa_queries and os.environ.get("EXA_API_KEY"):
        print("Phase 1b: Collecting listing URLs from Exa semantic search...")
        try:
            exa_results = search_listings(exa_queries, results_per_query=10)
            # Merge, dedup by URL
            seen = {d["url"] for d in discovered}
            before = len(exa_results)
            for r in exa_results:
                if r["url"] not in seen:
                    seen.add(r["url"])
                    discovered.append(r)
            print(f"  Exa found {before} URLs, {before - (before - len([r for r in exa_results if r['url'] not in {d['url'] for d in discovered[:len(discovered) - len(exa_results)]}]))} new after dedup with search pages")
        except Exception as e:
            print(f"  Exa search failed: {e}")

    # Phase 1c: Direct booking discovery (when --source direct or no source filter)
    is_direct_mode = source_filter == "direct"
    if (is_direct_mode or not source_filter) and os.environ.get("EXA_API_KEY"):
        print("Phase 1c: Discovering direct booking properties via Exa...")
        try:
            direct_queries = EXA_DIRECT_BOOKING_QUERIES
            if is_direct_mode:
                # In direct mode, use all queries; otherwise just a few
                pass
            else:
                direct_queries = direct_queries[:6]

            direct_results = search_direct_bookings(direct_queries, results_per_query=8)
            seen = {d["url"] for d in discovered}
            new_count = 0
            for r in direct_results:
                if r["url"] not in seen:
                    seen.add(r["url"])
                    discovered.append(r)
                    new_count += 1
            print(f"  Exa direct booking: {new_count} new independent property sites")
        except Exception as e:
            print(f"  Direct booking search failed: {e}")

    # Phase 1d: Curation site crawling
    if is_direct_mode or not source_filter:
        print("Phase 1d: Crawling curation sites for direct booking properties...")
        try:
            curation_results = await crawl_curation_sites(
                sites=CURATION_SITES, delay_s=3.0,
            )
            seen = {d["url"] for d in discovered}
            new_count = 0
            for r in curation_results:
                if r["url"] not in seen:
                    seen.add(r["url"])
                    discovered.append(r)
                    new_count += 1
            print(f"  Curation sites: {new_count} new property links")
        except Exception as e:
            print(f"  Curation site crawl failed: {e}")

    print(f"  Total collected: {len(discovered)} listing URLs\n")

    if not discovered:
        print("No listings found. Check search URLs or try different queries.")
        return

    # Phase 2: Dedup
    print("Phase 2: Deduplicating...")
    api_key = args.api_key or os.environ.get("PAYLOAD_ADMIN_API_KEY", "")
    existing_stay_urls, existing_candidate_urls = get_existing_urls(api_key)
    existing_stays = get_all_stays_brief(api_key)
    print(f"  Existing: {len(existing_stay_urls)} stays, {len(existing_candidate_urls)} candidates")

    before_dedup = len(discovered)
    discovered = dedup_listings(discovered, existing_stay_urls, existing_candidate_urls, existing_stays)
    print(f"  After dedup: {len(discovered)} unique ({before_dedup - len(discovered)} duplicates removed)\n")

    if not discovered:
        print("All discovered listings are duplicates. Try --force with different search URLs.")
        return

    # Resume support
    progress = load_progress(spoke) if resume else {"scraped_urls": [], "written": 0, "failed": 0}
    if resume and progress["scraped_urls"]:
        already_scraped = set(progress["scraped_urls"])
        discovered = [d for d in discovered if d["url"] not in already_scraped]
        print(f"  Resuming: skipping {len(already_scraped)} already-scraped URLs\n")

    # Cap at limit
    discovered = discovered[:limit * 3]  # over-collect since some will fail extraction/scoring

    # Phase 3: Extract listing data
    # Split into: crawlable (Airbnb + direct booking sites) and metadata-only (VRBO, Hipcamp)
    platform_domains = ["airbnb.com", "vrbo.com", "hipcamp.com", "wander.com"]
    crawlable = []
    metadata_only = []
    for d in discovered:
        url = d.get("url", "")
        is_platform = any(domain in url for domain in platform_domains)
        is_airbnb = "airbnb.com" in url
        # Crawl Airbnb pages and direct booking sites (they have extractable content)
        # VRBO/Hipcamp pages are harder to crawl; use metadata-only path
        if is_airbnb or (not is_platform):
            crawlable.append(d)
        else:
            metadata_only.append(d)

    print(f"Phase 3: Extracting data from {len(crawlable)} crawlable + {len(metadata_only)} metadata-only listings...")
    extracted = []

    if crawlable:
        crawled = await extract_batch(crawlable, spoke, delay_s=2.0)
        extracted.extend(crawled)

    # VRBO, Hipcamp, and other platforms: use Exa/search metadata directly
    for item in metadata_only:
        if item.get("title"):
            platform = item.get("platform", detect_platform(item.get("url", "")))
            description = item.get("description", "")

            # Extract location from Exa title pattern: "Title - Hipcamp in City, State"
            location = ""
            loc_match = __import__("re").search(r"(?:Hipcamp|VRBO|Airbnb)\s+in\s+(.+?)(?:\n|$)", description)
            if loc_match:
                location = loc_match.group(1).strip()

            # Scan description for spoke-specific fields
            from spoke_discovery_config import scan_keywords
            spoke_fields = scan_keywords(description + " " + item["title"], spoke)

            extracted.append({
                "title": item["title"],
                "description": description[:500],
                "sourceUrl": item["url"],
                "platform": platform,
                "location": location,
                "imageUrl": "",
                **spoke_fields,
            })

    print(f"  Extracted {len(extracted)} listings ({len(crawlable)} crawled, {len(metadata_only)} from metadata)\n")

    if not extracted:
        print("No listings extracted successfully.")
        return

    # Phase 4: Validate spoke fields
    print("Phase 4: Validating spoke-specific fields...")
    validated = []
    spoke_missing = 0
    for listing in extracted:
        if validate_spoke_fields(listing, spoke):
            validated.append(listing)
        else:
            spoke_missing += 1
            # Still include but flag for review
            listing["_spoke_fields_missing"] = True
            validated.append(listing)
    print(f"  {len(validated) - spoke_missing} with spoke fields, {spoke_missing} missing (included for review)\n")

    # Phase 5: Score novelty
    print(f"Phase 5: Scoring novelty (min score: {MIN_NOVELTY_SCORE})...")
    scored = score_batch(validated, delay_s=3.0)

    passing = [s for s in scored if s["novelty"]["score"] >= MIN_NOVELTY_SCORE]
    failing = [s for s in scored if s["novelty"]["score"] < MIN_NOVELTY_SCORE]
    print(f"  {len(passing)} passing (>= {MIN_NOVELTY_SCORE}), {len(failing)} below threshold\n")

    if not passing:
        print("No listings passed the novelty threshold.")
        for s in failing[:5]:
            print(f"  - {s.get('title', '?')[:50]}: score {s['novelty']['score']} — {s['novelty']['reason'][:80]}")
        return

    # Sort by score descending, take top N
    passing.sort(key=lambda x: x["novelty"]["score"], reverse=True)
    passing = passing[:limit]

    # Phase 6: Write candidates
    print(f"Phase 6: {'Would write' if pilot else 'Writing'} {len(passing)} candidates...")
    written = 0
    failed = 0

    for i, listing in enumerate(passing):
        candidate = build_candidate(listing, spoke, listing["novelty"])

        if pilot:
            print(f"  [{i+1}/{len(passing)}] WOULD WRITE: {listing.get('title', '?')[:50]} "
                  f"(score: {listing['novelty']['score']}, platform: {candidate['platform']})")
            written += 1
        else:
            try:
                create_candidate(candidate, args.api_key or os.environ.get("PAYLOAD_ADMIN_API_KEY", ""))
                print(f"  [{i+1}/{len(passing)}] OK: {listing.get('title', '?')[:50]} "
                      f"(score: {listing['novelty']['score']})")
                written += 1
                progress["scraped_urls"].append(listing.get("sourceUrl", ""))
                progress["written"] = progress.get("written", 0) + 1
            except Exception as e:
                err_body = ""
                if hasattr(e, 'read'):
                    err_body = e.read().decode()[:200]
                print(f"  [{i+1}/{len(passing)}] FAIL: {listing.get('title', '?')[:50]} — {e} {err_body}")
                failed += 1
                progress["failed"] = progress.get("failed", 0) + 1

        save_progress(spoke, progress)

    print(f"\n{'='*60}")
    print(f"{'PILOT ' if pilot else ''}Summary for {spoke}:")
    print(f"  URLs discovered:    {len(discovered)}")
    print(f"  After dedup:        {before_dedup}")
    print(f"  Extracted:          {len(extracted)}")
    print(f"  Scored passing:     {len(passing)}")
    print(f"  {'Would write' if pilot else 'Written'}:       {written}")
    print(f"  Failed:             {failed}")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description="Discover spoke-specific stay listings via crawl4ai")
    parser.add_argument("--spoke", required=True, choices=SPOKES, help="Target spoke category")
    parser.add_argument("--limit", type=int, default=50, help="Max candidates to write (default: 50)")
    parser.add_argument("--pilot", action="store_true", help="Dry run — extract and score but don't write")
    parser.add_argument("--source", type=str, help="Only crawl this source (airbnb, vrbo, hipcamp, direct)")
    parser.add_argument("--force", action="store_true", help="Skip dedup against existing candidates")
    parser.add_argument("--resume", action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--api-key", type=str, help="Payload admin API key (default: PAYLOAD_ADMIN_API_KEY from .env.local)")
    parser.add_argument("--min-score", type=int, default=MIN_NOVELTY_SCORE, help="Min novelty score threshold")
    args = parser.parse_args()

    # Load env vars from .env.local if present
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    os.environ.setdefault(key.strip(), val.strip().strip("\"'"))

    # Fall back to env var if --api-key not provided
    if not args.api_key:
        args.api_key = os.environ.get("PAYLOAD_ADMIN_API_KEY", "")

    if not args.api_key and not args.pilot:
        print("ERROR: No API key. Set PAYLOAD_ADMIN_API_KEY in .env.local or pass --api-key.")
        sys.exit(1)

    asyncio.run(run_pipeline(args))


if __name__ == "__main__":
    main()
