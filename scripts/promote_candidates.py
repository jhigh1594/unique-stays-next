"""Promote pending candidate stays directly to stays, bypassing the hook."""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

BASE_URL = os.environ.get("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000")
API_KEY = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PAYLOAD_ADMIN_API_KEY", "")
DELAY = int(sys.argv[2]) if len(sys.argv) > 2 else 3


def api(method, path, data=None, timeout=60):
    headers = {
        "Authorization": f"users API-Key {API_KEY}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method=method)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read())
        except (urllib.error.URLError, ConnectionRefusedError, OSError) as e:
            if attempt < 2:
                print(f"  retry {attempt+1}: {e}", flush=True)
                time.sleep(10 * (attempt + 1))
            else:
                raise


def slugify(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:80]


def get_lookups():
    """Cache category and spoke IDs."""
    cats = api("GET", "/api/categories?depth=0&limit=50")
    spokes = api("GET", "/api/spokes?depth=0&limit=20")
    cat_map = {d.get("slug"): d["id"] for d in cats["docs"]}
    spoke_map = {d.get("slug"): d["id"] for d in spokes["docs"]}
    default_cat = cats["docs"][0]["id"] if cats["docs"] else None
    return cat_map, spoke_map, default_cat


def promote_candidate(candidate, cat_map, spoke_map, default_cat):
    doc = candidate
    title = doc.get("title", "")
    source_url = doc.get("sourceUrl", "")
    slug = slugify(title)

    # Check if stay already exists
    existing = api("GET", f"/api/stays?where[slug][equals]={slug}&depth=0&limit=1")
    if existing["totalDocs"] > 0:
        return "duplicate"

    existing2 = api("GET", f"/api/stays?where[affiliateUrl][equals]={source_url}&depth=0&limit=1")
    if existing2["totalDocs"] > 0:
        return "duplicate"

    # Build spoke list
    target_spoke_slug = doc.get("targetSpoke") or "unique"
    spoke_id = spoke_map.get(target_spoke_slug)
    unique_spoke_id = spoke_map.get("unique")

    spoke_ids = []
    if spoke_id:
        spoke_ids.append(spoke_id)
    if unique_spoke_id and unique_spoke_id != spoke_id and (doc.get("noveltyScore") or 0) >= 6:
        spoke_ids.append(unique_spoke_id)
    if not spoke_ids and unique_spoke_id:
        spoke_ids.append(unique_spoke_id)

    # Parse spoke fields
    spoke_fields = {}
    sf = doc.get("spokeFields")
    if isinstance(sf, str):
        try:
            spoke_fields = json.loads(sf)
        except Exception:
            pass
    elif isinstance(sf, dict):
        spoke_fields = sf

    # Build stay data
    stay_data = {
        "slug": slug,
        "title": title,
        "location": doc.get("location") or "Unknown",
        "state": doc.get("state") or "Unknown",
        "region": doc.get("region") or "West",
        "category": default_cat,
        "spokes": spoke_ids,
        "platform": doc.get("platform") or "Direct",
        "affiliateUrl": source_url,
        "imageUrl": doc.get("imageUrl") or "",
        "price": doc.get("price") or 0,
        "rating": doc.get("rating"),
        "reviewCount": doc.get("reviewCount"),
        "sleeps": 1,
        "bedrooms": 0,
        "description": doc.get("scrapedDescription") or "",
        "tags": [{"tag": a["amenity"]} for a in (doc.get("scrapedAmenities") or []) if a.get("amenity")],
        "featured": False,
        "editorsPick": False,
        "isNew": True,
        "needsReview": True,
        "reviewReason": "Auto-promoted from candidate via batch script",
    }

    # Remove None values
    stay_data = {k: v for k, v in stay_data.items() if v is not None}

    # Add spoke-specific group fields
    if target_spoke_slug == "work-friendly":
        stay_data["workFriendly"] = {
            "wifiSpeed": spoke_fields.get("wifiSpeed", ""),
            "hasDesk": spoke_fields.get("hasDesk", False),
        }
    elif target_spoke_slug == "pet-friendly":
        stay_data["petDetails"] = {
            "petFriendly": spoke_fields.get("petFriendly", True),
            "petPolicy": spoke_fields.get("petPolicy", ""),
        }
    elif target_spoke_slug == "rv-ready":
        stay_data["rvDetails"] = {
            "rvHookup": spoke_fields.get("rvHookup", False),
            "rvInfo": spoke_fields.get("rvInfo", ""),
        }
    elif target_spoke_slug == "ev-ready":
        stay_data["evDetails"] = {
            "evCharger": spoke_fields.get("evCharger", False),
            "evInfo": spoke_fields.get("evInfo", ""),
        }

    # Create stay as draft
    result = api("POST", "/api/stays?draft=true&override-access=true", stay_data)
    return result.get("doc", {}).get("id", "ok")


def main():
    print("Caching lookups...", flush=True)
    cat_map, spoke_map, default_cat = get_lookups()
    print(f"Categories: {len(cat_map)}, Spokes: {len(spoke_map)}", flush=True)

    print("Fetching pending candidates...", flush=True)
    data = api("GET", "/api/candidate-stays?depth=0&limit=500&fields=id,status")
    docs = data["docs"]
    pending = [d for d in docs if d.get("status") == "pending"]
    print(f"Pending: {len(pending)}", flush=True)
    if not pending:
        print("Nothing to promote.")
        return

    # Fetch full details for pending candidates
    print("Fetching full candidate details...", flush=True)
    pending_ids = [d["id"] for d in pending]
    candidates = []
    page_size = 50
    for i in range(0, len(pending_ids), page_size):
        batch = pending_ids[i:i+page_size]
        id_filter = ",".join(str(x) for x in batch)
        chunk = api("GET", f"/api/candidate-stays?where[id][in]={id_filter}&depth=0&limit={page_size}")
        candidates.extend(chunk["docs"])
        print(f"  fetched {len(candidates)}/{len(pending_ids)}", flush=True)

    print(f"Loaded {len(candidates)} candidates. Starting promotion...", flush=True)

    ok = 0
    dup = 0
    fail = 0
    for i, cand in enumerate(candidates, 1):
        cid = cand["id"]
        try:
            result = promote_candidate(cand, cat_map, spoke_map, default_cat)
            if result == "duplicate":
                dup += 1
                print(f"[{i}/{len(candidates)}] DUP id={cid}", flush=True)
            else:
                ok += 1
                print(f"[{i}/{len(candidates)}] OK id={cid} -> stay (ok={ok} dup={dup} fail={fail})", flush=True)
                # Mark candidate as approved
                api("PATCH", f"/api/candidate-stays/{cid}", {"status": "approved", "reviewedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")})
        except Exception as e:
            fail += 1
            print(f"[{i}/{len(candidates)}] FAIL id={cid}: {str(e)[:100]}", flush=True)
        if i < len(candidates):
            time.sleep(DELAY)

    print(f"\nDONE: ok={ok} dup={dup} fail={fail} total={len(candidates)}")


if __name__ == "__main__":
    main()
