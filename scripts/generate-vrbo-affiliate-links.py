#!/usr/bin/env python3
"""Generate Expedia Group affiliate links for all VRBO listings that need them.

Reads VRBO listings from Payload CMS, generates affiliate links via the
expedia-group CLI (one at a time — the API rejects batches), and patches
the affiliate URLs back into Payload.

Usage:
    python3 scripts/generate-vrbo-affiliate-links.py [--dry-run]
"""
import json
import subprocess
import sys
import time
import urllib.request
import urllib.error
import argparse

BASE_URL = "http://localhost:3003"
PARTNER_ID = "f822dc10-dd1d-483f-9917-93b526aaab70"
CAMREF = "1100l5K5tH"
CREATIVEREF = "1101l63118"
CLI_PATH = subprocess.getoutput("echo $HOME") + "/go/bin/expedia-group"
DELAY = 0.5  # seconds between requests to respect rate limit


def fetch_vrbo_listings():
    """Fetch all VRBO listings from Payload, return only those needing affiliate links."""
    all_stays = []
    page = 1
    while True:
        url = (
            f"{BASE_URL}/api/stays?where%5Bplatform%5D%5Bequals%5D=VRBO"
            f"&depth=0&limit=100&fields=id,slug,title,affiliateUrl&page={page}"
        )
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read())
        all_stays.extend(data["docs"])
        if not data.get("hasNextPage"):
            break
        page += 1

    # Filter: only direct VRBO URLs (not already affiliate links)
    needs_link = []
    for s in all_stays:
        url = s.get("affiliateUrl", "") or ""
        if "vrbo.com/affiliate" in url or "vrbo.com/affiliates" in url:
            continue
        if "vrbo.com" in url or url:
            needs_link.append(s)
    return needs_link


def generate_affiliate_link(stay):
    """Generate a single affiliate link for one listing."""
    slug = stay["slug"][:50]
    title = stay.get("title", slug)[:100]
    url = stay.get("affiliateUrl", "")

    request_body = {
        "camref": CAMREF,
        "creativeref": CREATIVEREF,
        "landingPages": [
            {
                "generateShortLink": True,
                "label": slug,
                "title": title,
                "type": "STAY",
                "url": url,
            }
        ],
        "partnerId": PARTNER_ID,
    }

    result = subprocess.run(
        [CLI_PATH, "links", "create-affiliate-links", "--stdin", "--json"],
        input=json.dumps(request_body),
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        return None, result.stderr[:300]

    resp = json.loads(result.stdout)
    urls = resp.get("data", {}).get("affiliateUrls", [])
    if not urls:
        return None, "no affiliateUrls in response"
    return urls[0].get("url"), None


def update_payload(stay_id, affiliate_url, auth_token=None, api_key=None):
    """PATCH a single stay with the new affiliate URL."""
    payload = json.dumps({"affiliateUrl": affiliate_url}).encode()
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"users API-Key {api_key}"
    elif auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    req = urllib.request.Request(
        f"{BASE_URL}/api/stays/{stay_id}",
        data=payload,
        headers=headers,
        method="PATCH",
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status == 200


def main():
    parser = argparse.ArgumentParser(description="Generate VRBO affiliate links")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without updating Payload")
    parser.add_argument("--token", type=str, help="Payload API token (Bearer token from /api/users/login)")
    parser.add_argument("--api-key", type=str, help="Payload API key (from user settings in admin)")
    args = parser.parse_args()

    auth_token = args.token or None
    api_key = args.api_key or None

    print("=== VRBO Affiliate Link Generator ===")
    print(f"Partner:  {PARTNER_ID}")
    print(f"Campaign: camref={CAMREF} creativeRef={CREATIVEREF}")
    print(f"CLI:      {CLI_PATH}")
    print()

    listings = fetch_vrbo_listings()
    total = len(listings)
    print(f"VRBO listings needing affiliate links: {total}")
    if not listings:
        print("Nothing to do.")
        return
    print()

    generated = 0
    failed = 0
    updated = 0
    update_failed = 0

    for i, stay in enumerate(listings, 1):
        slug = stay["slug"][:45]
        stay_id = stay["id"]
        original_url = stay.get("affiliateUrl", "")

        affiliate_url, err = generate_affiliate_link(stay)

        if err:
            print(f"  [{i:2}/{total}] FAIL [{stay_id:4}] {slug:45s} | {err[:100]}")
            failed += 1
        else:
            generated += 1
            if args.dry_run:
                print(f"  [{i:2}/{total}] WOULD [{stay_id:4}] {slug:45s} -> {affiliate_url}")
            else:
                try:
                    if update_payload(stay_id, affiliate_url, auth_token, api_key):
                        print(f"  [{i:2}/{total}] OK   [{stay_id:4}] {slug:45s} -> {affiliate_url}")
                        updated += 1
                    else:
                        print(f"  [{i:2}/{total}] FAIL [{stay_id:4}] {slug:45s} | Payload PATCH failed")
                        update_failed += 1
                except Exception as e:
                    print(f"  [{i:2}/{total}] ERR  [{stay_id:4}] {slug:45s} | {e}")
                    update_failed += 1

        time.sleep(DELAY)

    print()
    if args.dry_run:
        print(f"=== Dry Run: {generated}/{total} links generated, {failed} failed ===")
    else:
        print(f"=== Done: {updated} updated, {update_failed} update failures, {failed} link failures ===")


if __name__ == "__main__":
    main()
