#!/usr/bin/env python3
"""
Location data migration for Unique Stays.

Parses existing `location` strings into structured fields (city, state, stateCode).
Normalizes inconsistent state values (e.g. "CO" → "Colorado").
Geocodes via Nominatim to get coordinates.
Writes structured fields back via Payload API.

Usage:
  python3 scripts/migrate-locations.py          # dry run (default)
  python3 scripts/migrate-locations.py --apply   # actually update records
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse

API_BASE = os.environ.get('PAYLOAD_API', 'https://www.uniquestaysusa.com')
API_KEY = os.environ.get('PAYLOAD_API_KEY', '4a46b8b5d09bebf8bec3238dbffebce514fe55af3798cca3')
APPLY = '--apply' in sys.argv

# ── State mapping ────────────────────────────────────────────
STATE_MAP = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
}
CODE_TO_NAME = {v: k for k, v in STATE_MAP.items()}

# ── Geocoding cache (in-memory for single run) ───────────────
geocode_cache = {}

def geocode(city: str, state: str) -> dict | None:
    """Geocode via Nominatim. Returns {'lat': float, 'lng': float} or None."""
    key = f"{city}, {state}"
    if key in geocode_cache:
        return geocode_cache[key]
    
    query = urllib.parse.quote(f"{city}, {state}, USA")
    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1&countrycodes=us"
    
    req = urllib.request.Request(url, headers={
        'User-Agent': 'UniqueStaysUSA-LocationMigration/1.0',
        'Accept': 'application/json',
    })
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read())
            if results:
                coords = {'lat': float(results[0]['lat']), 'lng': float(results[0]['lon'])}
            else:
                coords = None
    except Exception as e:
        print(f"    ⚠️  Geocoding failed for '{key}': {e}")
        coords = None
    
    geocode_cache[key] = coords
    time.sleep(1.1)  # Nominatim rate limit: 1 req/sec
    return coords


def parse_location(raw: str) -> tuple[str | None, str | None]:
    """
    Parse a location string into (city, state_name).
    Returns (None, None) if unparseable.
    """
    if not raw:
        return None, None
    
    # Clean common prefixes
    cleaned = raw.strip()
    cleaned = re.sub(r'^(Map\s*\n?|View in a map\s*\n?)', '', cleaned).strip()
    
    if cleaned.lower() == 'unknown':
        return None, None
    
    # Try "City, ST" or "City, State" pattern
    match = re.match(r'^(.+?),\s*([A-Za-z\s]+)$', cleaned)
    if match:
        city = match.group(1).strip()
        state_raw = match.group(2).strip()
        
        # Normalize state
        if len(state_raw) == 2 and state_raw.upper() in CODE_TO_NAME:
            return city, CODE_TO_NAME[state_raw.upper()]
        elif state_raw in STATE_MAP:
            return city, state_raw
        else:
            # Try case-insensitive match
            for name in STATE_MAP:
                if name.lower() == state_raw.lower():
                    return city, name
            return city, state_raw  # best effort
    
    # If no comma, could be just a city or just a state
    return cleaned, None


def normalize_state(raw_state: str | None, parsed_state: str | None) -> tuple[str | None, str | None]:
    """
    Returns (state_name, state_code) from whatever we have.
    Uses both the raw `state` field and the parsed state from location.
    """
    # Try parsed state first (from location string), then raw field
    for candidate in [parsed_state, raw_state]:
        if not candidate:
            continue
        candidate = candidate.strip()
        
        # Already a full name
        if candidate in STATE_MAP:
            return candidate, STATE_MAP[candidate]
        
        # It's a code
        if len(candidate) == 2 and candidate.upper() in CODE_TO_NAME:
            return CODE_TO_NAME[candidate.upper()], candidate.upper()
        
        # Case-insensitive match
        for name in STATE_MAP:
            if name.lower() == candidate.lower():
                return name, STATE_MAP[name]
    
    return None, None


def fetch_with_retry(url, headers, timeout=30, max_retries=5, method='GET', data=None):
    """HTTP request with retry logic for flaky dev server."""
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, data=data, method=method, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp
        except Exception as e:
            if attempt < max_retries - 1:
                wait = 5 * (attempt + 1)
                print(f"    ⚠️  Retry {attempt+1}/{max_retries} after error: {e}")
                time.sleep(wait)
            else:
                raise


def fetch_all_stays() -> list[dict]:
    """Fetch all stays from Payload API."""
    all_docs = []
    page = 1
    while True:
        url = f"{API_BASE}/api/stays?limit=100&page={page}&depth=0"
        headers = {
            'Authorization': f'users API-Key {API_KEY}',
            'User-Agent': 'UniqueStaysUSA-LocationMigration/1.0',
        }
        resp = fetch_with_retry(url, headers)
        data = json.loads(resp.read())
        all_docs.extend(data['docs'])
        if data['nextPage'] is None:
            break
        page = data['nextPage']
    return all_docs


def update_stay(stay_id: int, fields: dict) -> bool:
    """Update a stay record via Payload API."""
    url = f"{API_BASE}/api/stays/{stay_id}"
    body = json.dumps(fields).encode()
    headers = {
        'Authorization': f'users API-Key {API_KEY}',
        'Content-Type': 'application/json',
        'User-Agent': 'UniqueStaysUSA-LocationMigration/1.0',
    }
    try:
        resp = fetch_with_retry(url, headers, timeout=15, max_retries=3, method='PATCH', data=body)
        return resp.status == 200
    except Exception as e:
        print(f"    ❌ Update failed for stay {stay_id}: {e}")
        return False


def main():
    print(f"{'APPLY MODE' if APPLY else 'DRY RUN — use --apply to write changes'}")
    print(f"Fetching all stays from {API_BASE}...\n")
    
    stays = fetch_all_stays()
    print(f"Found {len(stays)} stays\n")
    
    stats = {
        'updated': 0,
        'skipped_clean': 0,
        'needs_manual': 0,
        'geocode_success': 0,
        'geocode_fail': 0,
        'errors': 0,
    }
    needs_manual = []
    
    for stay in stays:
        sid = stay['id']
        slug = stay.get('slug', '?')
        raw_location = stay.get('location', '')
        raw_state = stay.get('state', '')
        
        existing_city = stay.get('city')
        existing_state_code = stay.get('stateCode')
        existing_coords = stay.get('coordinates')
        
        # Parse location string
        parsed_city, parsed_state = parse_location(raw_location)
        
        # Normalize state
        state_name, state_code = normalize_state(raw_state, parsed_state)
        
        # Build update
        updates = {}
        
        # City
        if parsed_city and not existing_city:
            updates['city'] = parsed_city
        elif not parsed_city and not existing_city:
            pass  # truly unknown — flag below
        
        # State normalization
        if state_name and raw_state != state_name:
            updates['state'] = state_name
        if state_code and not existing_state_code:
            updates['stateCode'] = state_code
        
        # Clean location display string
        clean_location = raw_location.strip()
        clean_location = re.sub(r'^(Map\s*\n?|View in a map\s*\n?)', '', clean_location).strip()
        if clean_location != raw_location.strip():
            updates['location'] = clean_location
        
        # Geocoding (only if we have city + state and no existing coords)
        if parsed_city and state_name and not existing_coords:
            coords = geocode(parsed_city, state_name)
            if coords:
                updates['coordinates'] = coords
                stats['geocode_success'] += 1
            else:
                stats['geocode_fail'] += 1
        
        # Check if anything needs manual review
        no_city = not parsed_city and not existing_city
        no_state = not state_name
        is_unknown = raw_location.strip().lower() == 'unknown' or not raw_location.strip()
        
        if (no_city or no_state or is_unknown) and not existing_city:
            stats['needs_manual'] += 1
            needs_manual.append({
                'id': sid,
                'slug': slug,
                'location': raw_location,
                'state': raw_state,
                'parsed_city': parsed_city,
                'parsed_state': parsed_state,
            })
        
        if not updates:
            stats['skipped_clean'] += 1
            continue
        
        # Log the change
        changes = []
        if 'city' in updates:
            changes.append(f"city: None → \"{updates['city']}\"")
        if 'state' in updates:
            changes.append(f"state: \"{raw_state}\" → \"{updates['state']}\"")
        if 'stateCode' in updates:
            changes.append(f"stateCode: None → \"{updates['stateCode']}\"")
        if 'location' in updates:
            changes.append(f"location: cleaned")
        if 'coordinates' in updates:
            changes.append(f"coordinates: ({updates['coordinates']['lat']:.4f}, {updates['coordinates']['lng']:.4f})")
        
        print(f"  [{sid:3d}] {slug[:50]}")
        for c in changes:
            print(f"        {c}")
        
        if APPLY:
            success = update_stay(sid, updates)
            if success:
                stats['updated'] += 1
            else:
                stats['errors'] += 1
        else:
            stats['updated'] += 1  # would update
    
    # ── Summary ───────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"{'WOULD UPDATE' if not APPLY else 'UPDATED'}: {stats['updated']}")
    print(f"Skipped (already clean): {stats['skipped_clean']}")
    print(f"Needs manual review: {stats['needs_manual']}")
    print(f"Geocoded successfully: {stats['geocode_success']}")
    print(f"Geocode failures: {stats['geocode_fail']}")
    print(f"Errors: {stats['errors']}")
    
    if needs_manual:
        print(f"\n{'='*60}")
        print(f"STAYS NEEDING MANUAL REVIEW ({len(needs_manual)}):")
        print(f"{'='*60}")
        for s in needs_manual[:30]:
            print(f"  [{s['id']:3d}] {s['slug'][:50]}")
            print(f"        location=\"{s['location']}\" state=\"{s['state']}\"")
            if s['parsed_city']:
                print(f"        parsed: city=\"{s['parsed_city']}\" state=\"{s['parsed_state']}\"")
        
        if len(needs_manual) > 30:
            print(f"  ... and {len(needs_manual) - 30} more")
        
        # Write full list to file for review
        with open('/data/workspace/unique-stays-next/scripts/manual-review-locations.json', 'w') as f:
            json.dump(needs_manual, f, indent=2)
        print(f"\n  Full list written to scripts/manual-review-locations.json")


if __name__ == '__main__':
    main()
