#!/usr/bin/env python3
"""
Backfill bathrooms field by scraping listing pages with crawl4ai.
Extracts bathroom count from Airbnb/VRBO/Wander listing pages.

Usage:
  python scripts/backfill-bathrooms-c4ai.py [--chunk N] [--chunk-size N] [--delay N] [--dry-run] [--force]
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path

# Add project root for dotenv
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# ── CLI args ──────────────────────────────────────────────────
args = sys.argv[1:]

def get_arg(name):
    try:
        idx = args.index(f"--{name}")
        return args[idx + 1] if idx + 1 < len(args) else None
    except ValueError:
        return None

chunk = int(get_arg("chunk") or 0)
chunk_size = int(get_arg("chunk-size") or "25")
delay = int(get_arg("delay") or "3000")
dry_run = "--dry-run" in args
force = "--force" in args

DATABASE_URI = os.environ.get("DATABASE_URI")
NEXT_PUBLIC_SERVER_URL = os.environ.get("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000")
PAYLOAD_SECRET = os.environ.get("PAYLOAD_SECRET")

if not DATABASE_URI or not PAYLOAD_SECRET:
    print("Error: DATABASE_URI and PAYLOAD_SECRET required in .env.local")
    sys.exit(1)

# ── Fetch stays from Payload ───────────────────────────────────
import urllib.request
import urllib.parse

def fetch_stays():
    """Fetch all stays from Payload API."""
    all_stays = []
    page = 1
    while True:
        params = urllib.parse.urlencode({
            "limit": "100",
            "page": str(page),
            "depth": "0",
            "sort": "id",
        })
        url = f"{NEXT_PUBLIC_SERVER_URL}/api/stays?{params}"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"users API-Key {PAYLOAD_SECRET}")

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())

        docs = data.get("docs", [])
        if not docs:
            break
        all_stays.extend(docs)
        if len(docs) < 100:
            break
        page += 1

    return all_stays

# ── Bathroom extraction ───────────────────────────────────────
def extract_bathrooms_from_html(html: str, url: str) -> int | None:
    """Extract bathroom count from listing page HTML."""
    text = html.lower()

    # Airbnb: "1 private bath", "1 bath", "2 shared baths"
    # Also "1 bedroom · 2 beds · 1 private bath"
    if "airbnb.com" in url:
        patterns = [
            r'"bathrooms"\s*:\s*(\d+(?:\.\d+)?)',
            r'"numberOfBathrooms"\s*:\s*"?(\d+)',
            r'"(\d+)\s*(?:private\s+|shared\s+|half\s+)?baths?"',
            r'(\d+)\s*(?:private\s+|shared\s+|half\s+)?bath(?:s)?(?:\s*[·,.<"\]])',
            r'(\d+)\s*(?:private\s+|shared\s+|half\s+)?bath(?:room)?s?\b',
        ]
    else:
        # VRBO / Wander / generic
        patterns = [
            r'"bathrooms"\s*:\s*(\d+(?:\.\d+)?)',
            r'bathrooms?\s*[:=]\s*"?(\d+(?:\.\d+)?)',
            r'(\d+)\s*(?:private\s+|shared\s+|half\s+)?bath(?:room)?s?\b',
            r'bath(?:room)?\s*(\d+(?:\.\d+)?)',
        ]

    for pat in patterns:
        matches = re.findall(pat, text)
        for m in matches:
            try:
                val = float(m)
                if 0.5 <= val <= 20:
                    return int(val) if val == int(val) else val
            except ValueError:
                continue

    return None


def extract_bathrooms_from_markdown(md: str, url: str) -> int | None:
    """Extract bathroom count from crawled markdown content."""
    text = md.lower()

    patterns = [
        r'(\d+)\s*(?:private\s+|shared\s+|half\s+)?bath(?:room)?s?\b',
        r'bath(?:room)?s?\s*[:\-\s]*(\d+(?:\.\d+)?)',
        r'"(\d+)\s*(?:private\s+|shared\s+|half\s+)?bath',
    ]

    for pat in patterns:
        matches = re.findall(pat, text)
        for m in matches:
            try:
                val = float(m)
                if 0.5 <= val <= 20:
                    return int(val) if val == int(val) else val
            except ValueError:
                continue

    return None


# ── Update stay via Payload API ────────────────────────────────
def update_stay(stay_id: str, bathrooms: float):
    """PATCH a stay's bathrooms field."""
    url = f"{NEXT_PUBLIC_SERVER_URL}/api/stays/{stay_id}"
    payload = json.dumps({"bathrooms": bathrooms}).encode()

    req = urllib.request.Request(url, data=payload, method="PATCH")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"users API-Key {PAYLOAD_SECRET}")

    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

# ── Main ───────────────────────────────────────────────────────
async def main():
    print("Fetching stays from Payload...")
    stays = fetch_stays()
    print(f"  Total: {len(stays)}")

    # Filter: need bathrooms data (all have default=1, so --force or check)
    if not force:
        stays = [s for s in stays if s.get("bathrooms") is None or s.get("bathrooms", 0) <= 0 or s.get("bathrooms") == 1]

    # Skip Direct (no scrape target)
    direct = [s for s in stays if s.get("platform") == "Direct"]
    stays = [s for s in stays if s.get("platform") != "Direct"]
    print(f"  Processing: {len(stays)} (skipped {len(direct)} Direct){' (dry run)' if dry_run else ''}")

    # Apply chunk
    if chunk > 0:
        start = (chunk - 1) * chunk_size
        stays = stays[start:start + chunk_size]
        print(f"  Chunk {chunk}, size {chunk_size}")

    if not stays:
        print("  No stays to process.")
        return

    # Browser config — headless, minimal
    browser_config = BrowserConfig(
        headless=True,
        browser_type="chromium",
    )
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        word_count_threshold=50,
        extraction_strategy=None,
    )

    processed = 0
    succeeded = 0
    failed = 0
    skipped = 0
    failures = []
    results = []  # {id, slug, bathrooms}

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for stay in stays:
            slug = stay.get("slug", "?")
            affiliate_url = stay.get("affiliateUrl", "")
            processed += 1

            if not affiliate_url:
                failed += 1
                failures.append((slug, "no affiliateUrl"))
                print(f"✗ {slug}: no URL")
                continue

            try:
                result = await crawler.arun(
                    url=affiliate_url,
                    config=run_config,
                )

                if not result.success:
                    failed += 1
                    failures.append((slug, f"crawl failed: {result.error_message}"))
                    print(f"✗ {slug}: crawl failed ({result.error_message})")
                    continue

                # Try markdown first (cleaner), then raw HTML
                bathrooms = None
                if result.markdown:
                    bathrooms = extract_bathrooms_from_markdown(result.markdown, affiliate_url)
                if bathrooms is None and result.html:
                    bathrooms = extract_bathrooms_from_html(result.html, affiliate_url)

                if bathrooms is None:
                    skipped += 1
                    print(f"⊘ {slug} (no bathroom count found)")
                    continue

                print(f"✓ {slug}: bathrooms={bathrooms}")
                succeeded += 1
                results.append({"id": stay["id"], "slug": slug, "bathrooms": bathrooms})

                if not dry_run:
                    update_stay(str(stay["id"]), bathrooms)

            except Exception as e:
                failed += 1
                msg = str(e)
                failures.append((slug, msg))
                print(f"✗ {slug}: {msg}")

            # Rate limit
            if delay > 0 and processed < len(stays):
                await asyncio.sleep(delay / 1000)

    # Write results JSON for Node to apply
    if results:
        with open("/tmp/bathrooms-results.json", "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n  Results written to /tmp/bathrooms-results.json")

    # ── Report ──────────────────────────────────────────────────
    print(f"\n{'='*40}")
    print(f"  Total:     {len(stays)}")
    print(f"  Succeeded: {succeeded}")
    print(f"  Failed:    {failed}")
    print(f"  Skipped:   {skipped}")

    if failures:
        print(f"\n✗ Failures ({len(failures)}):")
        for slug, err in failures:
            print(f"  - {slug}: {err[:80]}")

    if not dry_run and succeeded > 0:
        print(f"\n✓ Updated {succeeded} stays with bathroom counts")

async def scrape_single(url: str):
    """Scrape a single URL and print bathroom count."""
    browser_config = BrowserConfig(headless=True, browser_type="chromium")
    run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, word_count_threshold=50)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        try:
            result = await crawler.arun(url=url, config=run_config)
            if not result.success:
                print("null")
                return

            bathrooms = None
            if result.markdown:
                bathrooms = extract_bathrooms_from_markdown(result.markdown, url)
            if bathrooms is None and result.html:
                bathrooms = extract_bathrooms_from_html(result.html, url)

            print(bathrooms if bathrooms is not None else "null")
        except Exception:
            print("null")

if __name__ == "__main__":
    # Single URL scrape mode (--scrape <url>)
    if "--scrape" in args:
        scrape_url = args[args.index("--scrape") + 1]
        asyncio.run(scrape_single(scrape_url))
    else:
        asyncio.run(main())
