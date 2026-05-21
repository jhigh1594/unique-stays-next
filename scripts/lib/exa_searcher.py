"""Exa semantic search integration for listing URL discovery.

Uses Exa's neural search to find unique vacation rental listings
that Airbnb/VRBO search pages don't surface through popularity ranking.
"""

import os
import re

from exa_py import Exa

from spoke_discovery_config import detect_platform, PLATFORM_DOMAINS

EXA_API_KEY = os.environ.get("EXA_API_KEY", "")


def _get_client() -> Exa:
    key = os.environ.get("EXA_API_KEY", "")
    if not key:
        raise ValueError("EXA_API_KEY not set")
    return Exa(key)


def search_listings(queries: list[str], results_per_query: int = 10) -> list[dict]:
    """Run semantic search queries and return listing URLs with metadata.

    Includes Exa snippet text as 'description' and 'title' from the search
    result, so candidates can be created even if crawl extraction fails.
    """
    client = _get_client()
    collected = []
    seen_urls = set()

    for query in queries:
        print(f"  Exa search: {query[:60]}...")
        try:
            results = client.search_and_contents(
                query,
                type="neural",
                num_results=results_per_query,
                text={"maxCharacters": 1000},
                include_domains=["airbnb.com", "vrbo.com", "hipcamp.com", "wander.com"],
            )

            for result in results.results:
                url = result.url
                if not url or url in seen_urls:
                    continue

                # Filter to actual listing pages
                if not _is_listing_url(url):
                    continue

                seen_urls.add(url)
                platform = detect_platform(url)

                # Extract title and description from Exa text
                title = ""
                description = ""
                if hasattr(result, "text") and result.text:
                    lines = [l.strip() for l in result.text.split("\n") if l.strip()]
                    if lines and len(lines[0]) < 200:
                        title = lines[0]
                    description = result.text[:1000]

                collected.append({
                    "url": url,
                    "title": title,
                    "description": description,
                    "platform": platform,
                    "source_search_url": f"exa:{query}",
                })

            print(f"    Found {sum(1 for c in collected if c['source_search_url'] == f'exa:{query}')} listings")

        except Exception as e:
            print(f"    Exa error: {e}")

    return collected


def search_direct_bookings(
    queries: list[str],
    results_per_query: int = 10,
) -> list[dict]:
    """Search for direct booking properties — excludes major platform domains.

    Returns independent property websites with their own booking engines.
    """
    client = _get_client()
    collected = []
    seen_urls = set()

    exclude_domains = list(PLATFORM_DOMAINS) + [
        "google.com", "facebook.com", "instagram.com", "youtube.com",
        "pinterest.com", "yelp.com", "reddit.com", "twitter.com", "x.com",
        "linkedin.com", "tiktok.com", "wikipedia.org",
    ]

    for query in queries:
        print(f"  Exa direct booking search: {query[:60]}...")
        try:
            results = client.search_and_contents(
                query,
                type="neural",
                num_results=results_per_query,
                text={"maxCharacters": 1500},
                exclude_domains=exclude_domains,
            )

            for result in results.results:
                url = result.url
                if not url or url in seen_urls:
                    continue

                # Skip non-booking pages (blogs, news, etc.)
                if _is_non_booking_url(url):
                    continue

                # Skip non-US domains
                if _is_non_us_url(url):
                    continue

                seen_urls.add(url)

                title = ""
                description = ""
                if hasattr(result, "text") and result.text:
                    lines = [l.strip() for l in result.text.split("\n") if l.strip()]
                    if lines and len(lines[0]) < 200:
                        title = lines[0]
                    description = result.text[:1500]

                # Check if text contains booking-related signals
                text_lower = (title + " " + description).lower()
                is_booking = any(sig in text_lower for sig in [
                    "book now", "reserve", "check availability", "book direct",
                    "book your stay", "booking", "nightly rate", "per night",
                    "rental", "cabin", "lodge", "glamping", "retreat",
                ])

                if not is_booking and not _has_booking_footprint(url):
                    continue

                collected.append({
                    "url": url,
                    "title": title,
                    "description": description,
                    "platform": "Direct",
                    "source_search_url": f"exa-direct:{query}",
                })

            query_count = sum(1 for c in collected if c["source_search_url"] == f"exa-direct:{query}")
            print(f"    Found {query_count} direct booking sites")

        except Exception as e:
            print(f"    Exa direct booking error: {e}")

    return collected


def _is_listing_url(url: str) -> bool:
    """Check if URL is a vacation rental listing page."""
    patterns = [
        r"airbnb\.com/rooms/\d+",
        r"vrbo\.com/\d+",
        r"hipcamp\.com/(en-US/)?(land|campgrounds|rv-parks)/",
        r"wander\.com/stays/",
    ]
    return any(re.search(p, url) for p in patterns)


def _is_non_booking_url(url: str) -> bool:
    """Filter out URLs that are clearly not property booking sites."""
    non_booking_patterns = [
        r"\.(gov|edu|org)/",
        r"wikipedia\.org",
        r" Medium\.com",
        r"medium\.com",
        r"tripadvisor\.",
        r"yelp\.com",
        r"reddit\.com",
        r"pinterest\.",
        r"facebook\.com",
        r"instagram\.com",
        r"youtube\.com",
        r"tiktok\.com",
        r"\.(png|jpg|jpeg|pdf|doc)$",
        r"/blog/|/news/|/article/",
        r"amazon\.com",
        r"etsy\.com",
        r"zillow\.com",
        r"realtor\.com",
        r"airbnb\.(co\.uk|com\.au|ca|de|fr|es|it|jp)/help",
    ]
    return any(re.search(p, url, re.IGNORECASE) for p in non_booking_patterns)


def _has_booking_footprint(url: str) -> bool:
    """Check if URL belongs to a known independent booking platform."""
    booking_platforms = [
        "ownerrez.com", "lodgify.com", "firelightcamp.com",
        "beyonder.com", "hostfully.com", "bookingsync.com",
        "beds24.com", "webchalet.com",
    ]
    return any(bp in url.lower() for bp in booking_platforms)


def _is_non_us_url(url: str) -> bool:
    """Filter out non-US property sites based on TLD and domain patterns."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    domain = parsed.netloc.lower()

    # Known non-US TLDs
    non_us_tlds = [
        ".co.uk", ".co.nz", ".co.za", ".co.jp", ".co.kr",
        ".com.au", ".com.br", ".com.mx", ".com.ar",
        ".no", ".se", ".dk", ".fi",  # Scandinavia
        ".de", ".fr", ".it", ".es", ".pt", ".nl", ".be", ".at", ".ch",
        ".ie", ".pl", ".cz", ".hu", ".gr",
        ".cn", ".jp", ".kr", ".tw", ".hk", ".sg", ".th", ".vn", ".ph",
        ".in", ".id", ".my",
        ".cl", ".pe", ".ec",
        ".nz", ".au",
        ".ca",  # Canada — could include but generally not US vacation rentals
        ".il", ".ae", ".sa",
        ".ru", ".ua",
    ]
    for tld in non_us_tlds:
        if domain.endswith(tld) or f"{tld}/" in url:
            return True

    return False
