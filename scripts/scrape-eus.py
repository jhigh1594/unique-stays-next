#!/usr/bin/env python3
"""
Scrape Enjoy Unique Stays listings via Browserbase remote browser.
Uses the 'browse' CLI to navigate, scroll, and extract structured listing data.
Output: JSON file with all 168 listings.
"""

import json
import re
import subprocess
import sys
import time

BROWSERBASE_API_KEY = "bb_live_AcmAnN8JpfzXBnA0LLd8p6SOXj8"
EUS_RENTALS_URL = "https://www.enjoyuniquestays.com/rentals/"
OUTPUT_FILE = "/data/workspace/unique-stays-next/data/eus-listings.json"


def browse_cmd(*args, timeout=60):
    """Run a browse CLI command and return stdout."""
    env = {"BROWSERBASE_API_KEY": BROWSERBASE_API_KEY, "PATH": "/home/openclaw/.local/node_modules/.bin:/usr/bin:/bin"}
    result = subprocess.run(
        ["browse", *args],
        capture_output=True, text=True, timeout=timeout, env=env
    )
    return result.stdout


def extract_listings_from_snapshot(snapshot_text):
    """Parse the accessibility snapshot to extract listing cards."""
    listings = []
    
    # Each listing card follows this pattern in the snapshot:
    # button: 1 of 5 Previous slide Next slide NAME RATING Starting at $PRICE LOCATION TYPE GUESTS BEDS BATHS
    # Then detail lines with heading, rating, price, location, type, guests, beds, baths
    
    # Extract from the "button" lines which have a compact format
    # Pattern: "NAME RATING Starting at $PRICE LOCATION TYPE GUESTS BEDS BATHS"
    pattern = r'button: \d+ of 5 Previous slide Next slide (.+?) (\d+\.?\d*) Starting at \$(\d+) (\w[\w\s]*?) (\w+) (\d+) (\d+) (\d+\.?\d*)'
    
    matches = re.findall(pattern, snapshot_text)
    for m in matches:
        name = m[0].strip()
        rating = float(m[1])
        price = int(m[2])
        location = m[3].strip()
        prop_type = m[4].strip()
        guests = int(m[5])
        bedrooms = int(m[6])
        bathrooms = float(m[7])
        
        listings.append({
            "name": name,
            "rating": rating,
            "price_per_night": price,
            "location": location,
            "property_type": prop_type,
            "max_guests": guests,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "source": "enjoyuniquestays.com",
            "source_url": "",  # will be filled from individual listing pages
        })
    
    return listings


def main():
    all_listings = []
    
    print("Opening EUS rentals page...")
    # Page should already be open from earlier, but let's navigate fresh
    browse_cmd("open", EUS_RENTALS_URL)
    time.sleep(3)
    
    # Set sort to "Random" to get different listings each load? No — use default (Featured)
    # Actually, let's sort by "Newest First" to get consistent ordering
    # The default "Featured" sort shows 50, then LOAD MORE for the rest
    
    page = 1
    while True:
        print(f"\nExtracting page {page}...")
        snapshot = browse_cmd("snapshot", "--compact")
        
        listings = extract_listings_from_snapshot(snapshot)
        new_listings = [l for l in listings if l["name"] not in {x["name"] for x in all_listings}]
        
        print(f"  Found {len(listings)} listings in snapshot, {len(new_listings)} new")
        all_listings.extend(new_listings)
        
        # Check if LOAD MORE button exists
        if "LOAD MORE" in snapshot:
            print(f"  Clicking LOAD MORE... (total so far: {len(all_listings)})")
            try:
                browse_cmd("click", "LOAD MORE")
                time.sleep(3)  # Wait for new listings to load
            except Exception as e:
                print(f"  Failed to click LOAD MORE: {e}")
                break
            page += 1
            if page > 10:  # Safety limit
                print("  Safety limit reached")
                break
        else:
            print("  No LOAD MORE button found — all listings loaded")
            break
    
    print(f"\nTotal listings extracted: {len(all_listings)}")
    
    # Save to file
    with open(OUTPUT_FILE, "w") as f:
        json.dump(all_listings, f, indent=2)
    print(f"Saved to {OUTPUT_FILE}")
    
    # Summary stats
    types = {}
    locations = {}
    prices = []
    for l in all_listings:
        t = l["property_type"]
        loc = l["location"]
        types[t] = types.get(t, 0) + 1
        locations[loc] = locations.get(loc, 0) + 1
        prices.append(l["price_per_night"])
    
    print(f"\nProperty types: {json.dumps(types, indent=2)}")
    print(f"\nLocations: {json.dumps(locations, indent=2)}")
    if prices:
        print(f"\nPrice range: ${min(prices)} - ${max(prices)}, avg: ${sum(prices)//len(prices)}")


if __name__ == "__main__":
    main()
