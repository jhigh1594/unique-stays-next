"""Payload CMS REST API client for stay discovery scripts.

Follows the pattern from generate-vrbo-affiliate-links.py:
uses urllib.request with no external dependencies.
"""

import json
import os
import ssl
import urllib.request
import urllib.error
from typing import Any

BASE_URL = os.environ.get("NEXT_PUBLIC_SERVER_URL", "http://localhost:3003")
API_KEY = os.environ.get("PAYLOAD_ADMIN_API_KEY", "")


def _headers(api_key: str | None = None) -> dict[str, str]:
    h = {"Content-Type": "application/json"}
    key = api_key or API_KEY
    if key:
        h["Authorization"] = f"users API-Key {key}"
    return h


def _request(method: str, path: str, api_key: str | None = None, data: dict | None = None) -> dict:
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=_headers(api_key), method=method)
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx) as resp:
        return json.loads(resp.read())


def get_existing_urls(api_key: str | None = None) -> tuple[set[str], set[str]]:
    """Return (stay_affiliate_urls, candidate_source_urls) for dedup."""
    stay_urls = set()
    page = 1
    while True:
        data = _request("GET", f"/api/stays?depth=0&limit=500&fields=affiliateUrl&page={page}", api_key=api_key)
        stay_urls.update(d["affiliateUrl"] for d in data["docs"] if d.get("affiliateUrl"))
        if not data.get("hasNextPage"):
            break
        page += 1

    candidate_urls = set()
    page = 1
    while True:
        data = _request("GET", f"/api/candidate-stays?depth=0&limit=500&fields=sourceUrl&page={page}", api_key=api_key)
        candidate_urls.update(d["sourceUrl"] for d in data["docs"] if d.get("sourceUrl"))
        if not data.get("hasNextPage"):
            break
        page += 1

    return stay_urls, candidate_urls


def get_spoke_id(slug: str, api_key: str | None = None) -> str | None:
    """Look up a spoke's Payload ID by slug."""
    data = _request("GET", f"/api/spokes?where[slug][equals]={slug}&depth=0&limit=1", api_key=api_key)
    return data["docs"][0]["id"] if data["docs"] else None


def get_category_id(slug: str, api_key: str | None = None) -> str | None:
    """Look up a category's Payload ID by slug."""
    data = _request("GET", f"/api/categories?where[slug][equals]={slug}&depth=0&limit=1", api_key=api_key)
    return data["docs"][0]["id"] if data["docs"] else None


def create_candidate(candidate: dict[str, Any], api_key: str | None = None) -> dict:
    """Write a candidate stay to the candidate-stays collection."""
    return _request("POST", "/api/candidate-stays", api_key=api_key, data=candidate)


def get_all_stays_brief(api_key: str | None = None) -> list[dict]:
    """Fetch all stays with title + affiliateUrl for fuzzy dedup."""
    stays = []
    page = 1
    while True:
        data = _request("GET", f"/api/stays?depth=0&limit=500&fields=title,affiliateUrl&page={page}", api_key=api_key)
        stays.extend(data["docs"])
        if not data.get("hasNextPage"):
            break
        page += 1
    return stays
