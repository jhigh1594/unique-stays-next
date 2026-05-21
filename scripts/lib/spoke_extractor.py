"""crawl4ai extraction wrappers for spoke-specific stay discovery.

Phase A: CSS extraction on search result pages to collect listing URLs.
Phase B: JSON-LD extraction on individual listing pages for structured data.
Spoke fields enriched via keyword scanning; scoring uses Z.AI via Anthropic proxy.
"""

import asyncio
import json
import os
import re

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig

from spoke_discovery_config import EXTRACTION_PROMPTS, LISTING_SCHEMA, detect_platform, scan_keywords


# CSS selectors for search result pages
_SEARCH_SELECTORS = {
    "airbnb": {
        "listing_links": 'a[href*="/rooms/"]',
    },
    "vrbo": {
        "listing_links": 'a[href*="/vrbo.com/"], a[href*="/ vacationrentals.com/"]',
    },
    "hipcamp": {
        "listing_links": 'a[href*="/campgrounds/"], a[href*="/search/"]',
    },
    "generic": {
        "listing_links": 'a[href]',
    },
}


async def collect_urls_from_search(
    urls: list[str],
    delay_s: float = 3.0,
) -> list[dict]:
    """Phase A: Crawl search result pages and extract listing URLs.

    Returns list of {url, source_search_url, platform}.
    """
    collected = []
    seen_urls = set()

    config = CrawlerRunConfig(
        word_count_threshold=10,
        js_only=True,
        wait_for="css:div[itemprop='itemListElement']",
        delay_before_return_html=5,
    )

    async with AsyncWebCrawler() as crawler:
        for search_url in urls:
            print(f"  Crawling search page: {search_url[:80]}...")
            try:
                result = await crawler.arun(url=search_url, crawler_run_config=config)
                if not result.success:
                    print(f"    Failed: {result.error_message[:100]}")
                    continue

                platform = detect_platform(search_url)

                # Extract room/listing IDs directly from HTML
                html = result.html or ""
                room_ids = set(re.findall(r'/rooms/(\d+)', html))
                vrbo_ids = set(re.findall(r'vrbo\.com/(\d+)', html))

                for rid in room_ids:
                    url = f"https://www.airbnb.com/rooms/{rid}"
                    if url not in seen_urls:
                        seen_urls.add(url)
                        collected.append({
                            "url": url,
                            "source_search_url": search_url,
                            "platform": "Airbnb",
                        })

                for rid in vrbo_ids:
                    rid_clean = rid.rstrip("ha")
                    url = f"https://www.vrbo.com/{rid}"
                    if url not in seen_urls:
                        seen_urls.add(url)
                        collected.append({
                            "url": url,
                            "source_search_url": search_url,
                            "platform": "VRBO",
                        })

                # Fallback: extract href links for other platforms
                href_pattern = re.compile(r'href="([^"]*)"')
                links = href_pattern.findall(html)
                for href in links:
                    full_url = _normalize_url(href, search_url)
                    if not full_url or full_url in seen_urls:
                        continue
                    if _is_listing_url(full_url, platform):
                        seen_urls.add(full_url)
                        collected.append({
                            "url": full_url,
                            "source_search_url": search_url,
                            "platform": detect_platform(full_url),
                        })

                print(f"    Found {len([c for c in collected if c['source_search_url'] == search_url])} listing URLs")

            except Exception as e:
                print(f"    Error: {e}")

            await asyncio.sleep(delay_s)

    return collected


async def extract_listing(
    url: str,
    spoke: str,
    crawler: AsyncWebCrawler,
    delay_s: float = 2.0,
) -> dict | None:
    """Phase B: Extract structured data from a single listing page.

    Strategy: Crawl with JS rendering, extract from JSON-LD + markdown,
    enrich spoke fields via keyword scanning.
    """
    data = await _extract_with_strategy(url, spoke, crawler)

    return data


async def _extract_with_strategy(
    url: str,
    spoke: str,
    crawler: AsyncWebCrawler,
) -> dict | None:
    """Run extraction via JSON-LD parsing, then markdown fallback for direct booking sites."""
    config = CrawlerRunConfig(
        word_count_threshold=10,
        js_only=False,
        delay_before_return_html=5,
    )

    try:
        result = await crawler.arun(url=url, crawler_run_config=config)
        if not result.success:
            err = result.error_message or ""
            if "429" in err or "rate" in err.lower():
                print(f"    Rate limited by LLM provider")
                return None
            print(f"    Crawl failed: {err[:100]}")
            return None

        html = result.html or ""
        md = result.markdown or ""

        # Try JSON-LD first (works for platform sites)
        data = _extract_from_jsonld(html)

        # Fallback: extract from HTML tags + markdown for direct booking sites
        if not data or not data.get("title"):
            data = _extract_from_html_and_markdown(html, md, url)

        if not data or not data.get("title"):
            print(f"    No extractable data found")
            return None

        # Enrich with spoke-specific keyword scanning
        full_text = md + " " + html
        keyword_fields = scan_keywords(full_text, spoke)
        for key, val in keyword_fields.items():
            if key not in data or not data[key]:
                data[key] = val

        data["sourceUrl"] = url
        data["platform"] = detect_platform(url)
        return data

    except Exception as e:
        print(f"    Extraction error: {e}")
        return None


def _extract_from_jsonld(html: str) -> dict | None:
    """Extract listing data from JSON-LD structured data in HTML."""
    jsonld_blocks = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>',
        html, re.DOTALL,
    )

    rental = None
    product = None
    for block in jsonld_blocks:
        try:
            parsed = json.loads(block)
            if parsed.get("@type") == "VacationRental":
                rental = parsed
            elif parsed.get("@type") == "Product":
                product = parsed
        except (json.JSONDecodeError, TypeError):
            continue

    source = rental or product
    if not source:
        return None

    data = {
        "title": source.get("name", ""),
        "description": source.get("description", ""),
    }

    # Extract from VacationRental schema
    if rental:
        geo = rental.get("geo", {})
        if geo:
            addr = geo.get("address", {})
            if isinstance(addr, dict):
                data["location"] = f"{addr.get('addressLocality', '')}, {addr.get('addressRegion', '')}".strip(", ")
                data["state"] = addr.get("addressRegion", "")

        # Images
        images = rental.get("image", [])
        if isinstance(images, list) and images:
            img = images[0] if isinstance(images[0], str) else images[0].get("url", "")
            data["imageUrl"] = img
        elif isinstance(images, str):
            data["imageUrl"] = images

    # Extract from Product schema
    if product:
        offers = product.get("offers", {})
        if isinstance(offers, dict):
            price = offers.get("price", "")
            if price:
                try:
                    data["price"] = float(str(price).replace(",", ""))
                except ValueError:
                    pass

        agg_rating = product.get("aggregateRating", {})
        if isinstance(agg_rating, dict):
            data["rating"] = float(agg_rating.get("ratingValue", 0))
            data["reviewCount"] = int(agg_rating.get("reviewCount", 0))

    # Extract amenities from HTML keywords
    amenity_keywords = [
        "wifi", "wi-fi", "internet", "kitchen", "parking", "air conditioning",
        "pool", "hot tub", "washer", "dryer", "heating", "tv", "workspace",
        "desk", "pet", "dog", "cat", "ev charger", "ev charging", "tesla",
        "rv", "hookup", "fireplace", "grill", "gym", " balcony", "patio",
    ]
    text_lower = html.lower()
    amenities = [kw.strip().title() for kw in amenity_keywords if kw in text_lower]
    if amenities:
        data["amenities"] = list(set(amenities))

    # Try to extract bedrooms/sleeps from description
    desc = data.get("description", "")
    sleeps_match = re.search(r'(\d+)\s*(?:guests?|sleeps?)', desc, re.IGNORECASE)
    if sleeps_match:
        data["sleeps"] = int(sleeps_match.group(1))
    bedroom_match = re.search(r'(\d+)\s*(?:bedroom|br\b)', desc, re.IGNORECASE)
    if bedroom_match:
        data["bedrooms"] = int(bedroom_match.group(1))

    return data


def _extract_from_html_and_markdown(html: str, md: str, url: str) -> dict | None:
    """Extract listing data from HTML tags + page markdown for direct booking sites.

    Priority: <title> tag > <h1> tag > markdown heading > URL path segment.
    Used as fallback when JSON-LD is absent (most independent property sites).
    """
    if not md or len(md) < 100:
        return None

    lines = [l.strip() for l in md.split("\n") if l.strip()]
    if not lines:
        return None

    # Skip patterns — navigation noise that should not become a title
    nav_patterns = [
        r'^\[(?:Skip|Menu|Toggle|Open|Close|Cart|Logo)',
        r'^\[!\[',  # image inside link
        r'^\[\s*\d+\s*\]',  # cart count [ 0 ]
        r'^\[?\d{3,}',  # phone numbers
        r'^(?:top of page|back to top|scroll)',
        r'^Accept\s+(all|cookies)',
        r'^Manage\s+cookies',
        r'^\*\s+\[',  # markdown list items with links: * [Something]
        r'^\*\s+\[Home\]',
        r'^(?:Home|About|Contact|Book|Reserve|Gallery|Overview|LODGING|BOOK|Our Story)$',
        r'^\[ (?:Skip|TO|Menu|Toggle)',
        r'^Cart reserved',
        r'^Single Night Stays',
        r'^\(\d{3}\)',  # phone number (307) 730-4868
        r'^CANOPY CLUB',
        r'^Use tab to navigate',
        r'^Open Menu',
        r'^BOOK YOUR STAY',
        r'^WELCOME TO',
    ]
    nav_re = re.compile('|'.join(nav_patterns), re.IGNORECASE)

    # Strip markdown link syntax from lines for title extraction
    def _strip_md_links(text: str) -> str:
        """Remove markdown link syntax: [text](url) → text, ![alt](url) → ''"""
        text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
        text = re.sub(r'\[([^\]]*)\]\(.*?\)', r'\1', text)
        return text.strip()

    def _clean_title(raw: str) -> str:
        """Clean a raw title: strip suffixes, site names, nav text."""
        # Remove common suffixes from HTML titles
        for sep in [' | ', ' - ', ' — ', ' – ']:
            if sep in raw:
                parts = raw.split(sep)
                # Take the part that's NOT a generic site name
                for part in parts:
                    p = part.strip()
                    if len(p) > 5 and len(p) < 100:
                        return p
                return parts[0].strip()
        return raw.strip()

    # Try HTML <title> first
    title = ""
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    if title_match:
        raw_title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
        # Decode HTML entities
        raw_title = raw_title.replace('&amp;', '&').replace('&ndash;', '–').replace('&mdash;', '—')
        if raw_title and len(raw_title) > 3 and len(raw_title) < 200:
            cleaned = _clean_title(raw_title)
            # Skip generic titles
            generic = {'home', 'welcome', 'untitled', 'document', 'page', 'vacation home'}
            if cleaned.lower() not in generic and len(cleaned) > 5:
                title = cleaned

    # Try <h1> if title is empty or looks like nav
    if not title:
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        if h1_match:
            raw_h1 = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()
            if raw_h1 and 5 < len(raw_h1) < 150 and not nav_re.match(raw_h1):
                title = raw_h1

    # Try markdown headings
    if not title:
        for line in lines[:30]:
            clean = _strip_md_links(line.lstrip("#").strip())
            # Remove leading bullets/asterisks
            clean = re.sub(r'^[*\-\+]\s+', '', clean).strip()
            if not clean or len(clean) <= 5 or len(clean) > 150:
                continue
            if nav_re.match(line.lstrip("#").strip()):
                continue
            # Skip lines that became empty after stripping links
            if not clean or clean.lower() in ('skip to content', 'skip to main content'):
                continue
            title = clean
            break

    # Fallback: try to extract from URL path segments
    if not title:
        from urllib.parse import urlparse
        path = urlparse(url).path.strip("/")
        if path:
            # Take last meaningful path segment, convert to title case
            segments = [s for s in path.split("/") if s and not s.isdigit()]
            if segments:
                title = segments[-1].replace("-", " ").replace("_", " ").title()

    # Description: first substantial paragraph
    description = ""
    for line in lines:
        clean = line.strip()
        if len(clean) > 50 and not clean.startswith("#") and not clean.startswith("!"):
            description = clean[:800]
            break

    # Location: look for city/state patterns
    location = ""
    state = ""
    loc_patterns = [
        r'(?:located|situated|nestled)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})',
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:[A-Z][a-z]+\s+)?[A-Z]{2})',
    ]
    for pattern in loc_patterns:
        match = re.search(pattern, md[:2000])
        if match:
            location = match.group(1).strip()
            parts = location.split(",")
            if len(parts) >= 2:
                state = parts[-1].strip()
            break

    # Price: look for nightly rates
    price = None
    price_match = re.search(r'\$(\d{2,4})\s*(?:/|per)\s*night', md[:3000], re.IGNORECASE)
    if price_match:
        try:
            price = float(price_match.group(1))
        except ValueError:
            pass

    # Sleeps/bedrooms
    sleeps = None
    bedrooms = None
    sleeps_match = re.search(r'(\d+)\s*(?:guests?|sleeps?|sleeps up to)', md[:3000], re.IGNORECASE)
    if sleeps_match:
        sleeps = int(sleeps_match.group(1))
    bedroom_match = re.search(r'(\d+)\s*(?:bedroom|br\b|bed)', md[:3000], re.IGNORECASE)
    if bedroom_match:
        bedrooms = int(bedroom_match.group(1))

    # Amenities from text
    amenity_keywords = [
        "wifi", "wi-fi", "internet", "kitchen", "parking", "air conditioning",
        "pool", "hot tub", "washer", "dryer", "heating", "tv", "workspace",
        "desk", "pet", "dog", "cat", "ev charger", "ev charging", "tesla",
        "rv", "hookup", "fireplace", "grill", "gym", "balcony", "patio",
        "kayak", "fishing", "hiking", "bike", "sauna", "fire pit",
    ]
    text_lower = md[:5000].lower()
    amenities = [kw.strip().title() for kw in amenity_keywords if kw in text_lower]

    # Image: look for first large image
    image_url = ""
    img_match = re.search(r'!\[.*?\]\((https?://[^\s)]+)\)', md)
    if img_match:
        image_url = img_match.group(1)

    data = {"title": title}
    if description:
        data["description"] = description
    if location:
        data["location"] = location
    if state:
        data["state"] = state
    if price:
        data["price"] = price
    if sleeps:
        data["sleeps"] = sleeps
    if bedrooms:
        data["bedrooms"] = bedrooms
    if amenities:
        data["amenities"] = list(set(amenities))
    if image_url:
        data["imageUrl"] = image_url

    return data


async def extract_batch(
    listings: list[dict],
    spoke: str,
    delay_s: float = 2.0,
) -> list[dict]:
    """Extract structured data from a batch of listing URLs sequentially."""
    results = []
    total = len(listings)

    async with AsyncWebCrawler() as crawler:
        for i, listing in enumerate(listings):
            url = listing["url"]
            print(f"  [{i+1}/{total}] Extracting: {url[:70]}...")

            data = await extract_listing(url, spoke, crawler, delay_s)
            if data:
                results.append(data)
                spoke_fields = _count_spoke_fields(data, spoke)
                print(f"    OK — {data.get('title', '?')[:40]} (spoke fields: {spoke_fields})")
            else:
                print(f"    SKIPPED")

            if delay_s > 0 and i < total - 1:
                await asyncio.sleep(delay_s)

    return results


def _normalize_url(href: str, base_url: str) -> str | None:
    """Normalize a URL found in HTML to a full URL."""
    if not href or href.startswith("#") or href.startswith("javascript:"):
        return None
    if href.startswith("/"):
        from urllib.parse import urljoin
        href = urljoin(base_url, href)
    if not href.startswith("https://"):
        return None
    return href


def _is_listing_url(url: str, platform: str) -> bool:
    """Check if a URL looks like a listing page."""
    patterns = {
        "airbnb": r"airbnb\.com/rooms/\d+",
        "vrbo": r"vrbo\.com/\d+",
        "hipcamp": r"hipcamp\.com/(en-US/)?(land|campgrounds|rv-parks)/",
    }
    if platform in patterns:
        return bool(re.search(patterns[platform], url))
    # Generic: just check it's a plausible listing URL
    return bool(re.search(r"/\d{4,}|/rooms/|/campground|/listing", url))


def _count_spoke_fields(data: dict, spoke: str) -> int:
    """Count how many spoke-specific fields are populated."""
    spoke_field_map = {
        "work-friendly": ["wifiSpeed", "hasDesk"],
        "pet-friendly": ["petFriendly", "petPolicy"],
        "rv-ready": ["rvHookup", "rvInfo"],
        "ev-ready": ["evCharger", "evInfo"],
    }
    fields = spoke_field_map.get(spoke, [])
    return sum(1 for f in fields if data.get(f))
