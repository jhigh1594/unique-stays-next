"""Scrape a URL using crawl4ai and output JSON with photo URLs.

Usage: python3 crawl4ai-scrape.py <url>

Outputs JSON: {"success": true, "photo_urls": [...]}
or:       {"success": false, "error": "..."}

crawl4ai verbose output is silenced so only JSON goes to stdout.
"""

import json
import sys
import os
import re

# Scroll to load lazy images, then extract all image srcs via JS
JS_SCROLL_AND_COLLECT = """
const sleep = ms => new Promise(r => setTimeout(r, ms));
const delay = 300;
const steps = 8;
for (let i = 0; i < steps; i++) {
    window.scrollBy(0, window.innerHeight);
    await sleep(delay);
}
window.scrollTo(0, 0);
await sleep(500);
const imgs = document.querySelectorAll('img');
const urls = [];
const seen = new Set();
for (const img of imgs) {
    let src = img.getAttribute('src') || img.getAttribute('data-src') || img.currentSrc || '';
    if (!src || src.startsWith('data:')) continue;
    try { src = new URL(src, window.location.href).href; } catch(e) { continue; }
    const clean = src.split('?')[0].split('#')[0];
    if (seen.has(clean)) continue;
    if (img.naturalWidth > 0 && img.naturalWidth < 50) continue;
    if (clean.match(/\\.(jpg|jpeg|png|webp|avif)$/i)) {
        seen.add(clean);
        urls.push(clean);
    }
}
return JSON.stringify(urls.slice(0, 30));
"""

async def main():
    url = sys.argv[1]

    # Silence crawl4ai's verbose print statements
    old_stdout = sys.stdout
    sys.stdout = open(os.devnull, 'w')

    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

    browser = BrowserConfig(
        headless=True,
        browser_type="chromium",
        use_managed_browser=False,
        enable_stealth=True,
        verbose=False,
    )
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_for_images=True,
        scan_full_page=True,
        scroll_delay=0.3,
        js_code=JS_SCROLL_AND_COLLECT,
        delay_before_return_html=1.0,
        verbose=False,
    )

    async with AsyncWebCrawler(config=browser) as crawler:
        result = await crawler.arun(url, config=config)

        # Restore stdout
        sys.stdout.close()
        sys.stdout = old_stdout

        if not result.success:
            print(json.dumps({"success": False, "error": result.error_message or "crawl failed"}))
            return

        photo_urls = []

        # 1. From JS execution result (scrolled page, best quality)
        #    js_execution_result is a dict: {'success': bool, 'results': [str, ...]}
        js_result = result.js_execution_result
        if js_result and isinstance(js_result, dict):
            js_returns = js_result.get('results', [])
            if js_returns:
                raw = str(js_returns[0])
                try:
                    photo_urls = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    # Fallback: regex extract from the string
                    photo_urls = re.findall(r'https?://[^\s"\'\\]+?\.(?:jpg|jpeg|png|webp|avif)', raw)

        # 2. From crawl4ai's media extraction
        if not photo_urls:
            media = result.media
            if media and media.get('images'):
                for img in media['images']:
                    src = img.get('src', '') or img.get('url', '')
                    if src:
                        clean = src.split('?')[0]
                        if clean not in photo_urls:
                            photo_urls.append(clean)

        # 3. Fallback: extract from HTML img tags
        if not photo_urls:
            html = result.html or ""
            img_tags = re.findall(r'<img[^>]+>', html)
            seen = set()
            for tag in img_tags:
                src_match = re.search(r'src="(https://[^"]+)"', tag)
                data_match = re.search(r'data-src="(https://[^"]+)"', tag)
                src = src_match.group(1) if src_match else (data_match.group(1) if data_match else None)
                if src:
                    clean = src.split('?')[0]
                    if clean not in seen and not any(x in src for x in ['avatar','logo','icon','button','badge','bat.bing','pixel','doubleclick']):
                        seen.add(clean)
                        photo_urls.append(clean)

        print(json.dumps({
            "success": True,
            "photo_urls": photo_urls[:30],
        }))

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
