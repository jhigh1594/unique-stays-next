"""Direct booking property discovery via curated travel directories.

Crawls curation sites (Boutique Homes, Glamping.com, Dwell, etc.)
and extracts links to independent property websites that run their
own booking engines instead of listing on Airbnb/VRBO.
"""

import asyncio
import re

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig

from spoke_discovery_config import PLATFORM_DOMAINS, CURATION_SITES, detect_platform


def _is_platform_url(url: str) -> bool:
    """Check if URL belongs to a major booking platform."""
    for domain in PLATFORM_DOMAINS:
        if domain in url:
            return True
    return False


def _is_property_url(url: str) -> bool:
    """Heuristic: does this URL look like an independent property site?"""
    if not url.startswith("https://"):
        return False
    if _is_platform_url(url):
        return False
    # Skip social media, aggregators, blogs
    skip = [
        "facebook.com", "instagram.com", "twitter.com", "x.com",
        "youtube.com", "pinterest.com", "tiktok.com",
        "google.com", "reddit.com", "yelp.com",
        "amazon.com", "etsy.com", "zillow.com",
        "wikipedia.org", "medium.com",
    ]
    if any(s in url for s in skip):
        return False
    return True


async def crawl_curation_sites(
    sites: dict[str, str] | None = None,
    delay_s: float = 3.0,
) -> list[dict]:
    """Crawl curated directories and extract property website links.

    Args:
        sites: Dict of {name: url} for curation sites. Defaults to CURATION_SITES.
        delay_s: Delay between requests in seconds.

    Returns:
        List of {url, title, description, platform, source_search_url} dicts.
    """
    sites = sites or CURATION_SITES
    collected = []
    seen_urls = set()

    config = CrawlerRunConfig(
        word_count_threshold=10,
        js_only=False,
        delay_before_return_html=3,
    )

    async with AsyncWebCrawler() as crawler:
        for site_name, site_url in sites.items():
            print(f"  Crawling curation site: {site_name} ({site_url[:60]}...)")
            try:
                result = await crawler.arun(url=site_url, crawler_run_config=config)
                if not result.success:
                    print(f"    Failed: {(result.error_message or '')[:100]}")
                    continue

                html = result.html or ""
                md = result.markdown or ""

                # Extract all external links from the page
                href_pattern = re.compile(r'href="(https?://[^"]*)"')
                links = href_pattern.findall(html)

                site_results = 0
                for href in links:
                    if href in seen_urls:
                        continue

                    if not _is_property_url(href):
                        continue

                    # Skip non-US domains
                    if _is_non_us_url(href):
                        continue

                    seen_urls.add(href)

                    # Try to get surrounding text as context
                    title = _extract_link_title(html, href)
                    description = ""

                    collected.append({
                        "url": href,
                        "title": title,
                        "description": description,
                        "platform": "Direct",
                        "source_search_url": f"curation:{site_name}",
                    })
                    site_results += 1

                print(f"    Found {site_results} independent property links")

            except Exception as e:
                print(f"    Error crawling {site_name}: {e}")

            await asyncio.sleep(delay_s)

    return collected


def _extract_link_title(html: str, url: str) -> str:
    """Extract the link text for a URL from HTML."""
    escaped = re.escape(url)
    match = re.search(rf'href="{escaped}"[^>]*>([^<]+)', html)
    if match:
        title = match.group(1).strip()
        if len(title) < 200:
            return title
    return ""


async def crawl_single_site(
    url: str,
    name: str = "custom",
    delay_s: float = 3.0,
) -> list[dict]:
    """Crawl a single curation site URL for property links."""
    return await crawl_curation_sites({name: url}, delay_s=delay_s)


def _is_non_us_url(url: str) -> bool:
    """Filter out non-US property sites based on TLD."""
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.lower()
    non_us_tlds = [
        ".co.uk", ".co.nz", ".co.za", ".co.jp", ".co.kr",
        ".com.au", ".com.br", ".com.mx",
        ".no", ".se", ".dk", ".fi", ".de", ".fr", ".it", ".es", ".pt",
        ".nl", ".be", ".at", ".ch", ".ie", ".pl", ".cz", ".gr",
        ".cn", ".jp", ".kr", ".tw", ".hk", ".sg", ".th", ".in",
        ".cl", ".pe", ".nz", ".au", ".ca", ".il", ".ae", ".ru",
    ]
    return any(domain.endswith(tld) for tld in non_us_tlds)
