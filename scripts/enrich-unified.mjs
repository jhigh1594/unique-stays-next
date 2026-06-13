#!/usr/bin/env node
/**
 * Unified Stay Enrichment Pipeline
 * 
 * Uses airbnb-pp-cli and wander-pp-cli to enrich stays with:
 * - Pricing (from Wander daily rates, Airbnb via Puppeteer)
 * - Metadata (bedrooms, bathrooms, rating, review count, amenities, coordinates)
 * - Platform-specific data
 * 
 * Usage:
 *   node enrich-unified.mjs                    # Enrich all missing data
 *   node enrich-unified.mjs --platform Wander  # Only Wander stays
 *   node enrich-unified.mjs --platform Airbnb  # Only Airbnb stays
 *   node enrich-unified.mjs --price-only       # Only fill $0 prices
 *   node enrich-unified.mjs --meta-only        # Only fill missing metadata
 *   node enrich-unified.mjs --dry-run          # Show what would change
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';
const BIN_PATH = `${process.env.HOME}/bin:${process.env.HOME}/go/bin`;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PRICE_ONLY = args.includes('--price-only');
const META_ONLY = args.includes('--meta-only');
const platformFilter = args.find(a => a.startsWith('--platform='))?.split('=')[1]
  || (args.includes('--platform') ? args[args.indexOf('--platform') + 1] : null);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function exec(cmd) {
  try {
    return execSync(cmd, { 
      encoding: 'utf8', 
      timeout: 60000,
      env: { ...process.env, PATH: `${BIN_PATH}:${process.env.PATH}` }
    }).trim();
  } catch (e) {
    return null;
  }
}

async function apiFetch(path, opts = {}) {
  const url = `${ADMIN_BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `users API-Key ${API_KEY}`,
      ...(opts.headers || {})
    }
  });
  if (!res.ok && !opts.silent) {
    console.error(`  API ${opts.method || 'GET'} ${path} → ${res.status}`);
  }
  return res;
}

// ─── Wander Enrichment ─────────────────────────────────────────────

async function enrichWanderStay(stay) {
  const slug = stay.affiliateUrl?.split('/').pop();
  if (!slug || !slug.startsWith('wander-')) {
    console.log(`  Skipping ${stay.id} — no Wander slug`);
    return null;
  }

  console.log(`  Fetching Wander data for ${slug}...`);
  const json = exec(`wander-pp-cli get ${slug} --agent`);
  if (!json) {
    console.error(`  ✗ Failed to fetch ${slug}`);
    return null;
  }

  let prop;
  try {
    prop = JSON.parse(json);
  } catch {
    console.error(`  ✗ Invalid JSON for ${slug}`);
    return null;
  }

  const updates = {};
  let changed = false;

  // Price: use nightly minimum
  if (stay.price === 0 && prop.nightlyMin > 0) {
    updates.price = Math.round(prop.nightlyMin);
    changed = true;
  }

  // Bedrooms
  if (!stay.bedrooms && prop.bedrooms > 0) {
    updates.bedrooms = prop.bedrooms;
    changed = true;
  }

  // Sleeps
  if ((!stay.sleeps || stay.sleeps <= 1) && prop.sleeps > 1) {
    updates.sleeps = prop.sleeps;
    changed = true;
  }

  // Coordinates (GeoJSON format: [longitude, latitude])
  if (prop.latitude && prop.longitude && !stay.coordinates) {
    updates.coordinates = [prop.longitude, prop.latitude];
    changed = true;
  }

  // City/State if missing
  if (prop.city && (!stay.city || stay.city === 'Unknown')) {
    updates.city = prop.city;
    changed = true;
  }
  if (prop.state && (!stay.state || stay.state === 'Unknown')) {
    updates.state = prop.state;
    changed = true;
  }

  // Rating (Wander doesn't expose ratings in .md)

  // Description (if missing or short)
  if (prop.description && (!stay.body || stay.body.length < 50)) {
    updates.body = prop.description;
    changed = true;
  }

  // Tags from amenities
  if (prop.amenities?.length > 0 && (!stay.tags || stay.tags.length < 3)) {
    const tagMap = {
      'Pool outdoor': 'Pool', 'Hot tub': 'Hot Tub', 'Wifi': 'Wifi',
      'Air conditioning': 'Ac', 'Free parking': 'Parking',
      'Kitchen': 'Kitchen', 'Fireplace': 'Fireplace', 'Washer': 'Laundry',
      'Dryer': 'Laundry', 'Patio': 'Patio', 'Balcony': 'Balcony',
      'Gym': 'Gym', 'Bbq area': 'Bbq', 'Mountain view': 'Mountain View',
      'Waterfront': 'Waterfront', 'Garden': 'Garden',
    };
    const tags = prop.amenities
      .map(a => tagMap[a] || null)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(t => ({ tag: t }));
    if (tags.length > 0) {
      updates.tags = tags;
      changed = true;
    }
  }

  // Title (if missing or generic)
  if (prop.name && (!stay.title || stay.title.length < 10)) {
    updates.title = prop.name;
    changed = true;
  }

  if (!changed) {
    console.log(`  ✓ ${slug} — no enrichment needed`);
    return null;
  }

  return updates;
}

// ─── Airbnb Enrichment ─────────────────────────────────────────────

async function enrichAirbnbStay(stay) {
  const roomId = stay.affiliateUrl?.match(/\/rooms\/(\d+)/)?.[1];
  if (!roomId) {
    console.log(`  Skipping ${stay.id} — no Airbnb room ID`);
    return null;
  }

  console.log(`  Fetching Airbnb data for room ${roomId}...`);
  const json = exec(`airbnb-pp-cli airbnb-listing get ${roomId} --agent`);
  if (!json) {
    console.error(`  ✗ Failed to fetch room ${roomId}`);
    return null;
  }

  // Parse the JSON — it may have duplicate keys, so we extract what we need via string ops
  const extract = (key) => {
    const m = json.match(new RegExp(`"${key}"\\s*:\\s*"?([^",\\n}]+)"?`));
    return m ? m[1].replace(/"/g, '') : null;
  };
  const extractNum = (key) => {
    const v = extract(key);
    return v ? parseFloat(v.replace(/[^0-9.]/g, '')) || 0 : 0;
  };

  const updates = {};
  let changed = false;

  // Title
  const title = extract('title');
  if (title && title.length > 5 && (!stay.title || stay.title.length < 10)) {
    updates.title = title;
    changed = true;
  }

  // Person capacity (sleeps)
  const sleeps = extractNum('personCapacity');
  if (sleeps > 1 && (!stay.sleeps || stay.sleeps <= 1)) {
    updates.sleeps = Math.round(sleeps);
    changed = true;
  }

  // Star rating
  const rating = extractNum('starRating');
  if (rating > 0 && !stay.rating) {
    updates.rating = rating;
    changed = true;
  }

  // Review count
  const reviewCount = extractNum('reviewCount');
  if (reviewCount > 0 && !stay.reviewCount) {
    updates.reviewCount = Math.round(reviewCount);
    changed = true;
  }

  // Coordinates (GeoJSON: [lng, lat])
  const lat = extractNum('latitude');
  const lng = extractNum('longitude');
  if (lat && lng && !stay.coordinates) {
    updates.coordinates = [lng, lat];
    changed = true;
  }

  // City
  const city = extract('city');
  if (city && (!stay.city || stay.city === 'Unknown')) {
    updates.city = city;
    changed = true;
  }

  if (!changed) {
    console.log(`  ✓ Room ${roomId} — no enrichment needed`);
    return null;
  }

  return updates;
}

// ─── Main Pipeline ─────────────────────────────────────────────────

async function run() {
  console.log('=== Unified Stay Enrichment Pipeline ===\n');
  if (DRY_RUN) console.log('🔍 DRY RUN — no changes will be made\n');
  if (platformFilter) console.log(`Platform filter: ${platformFilter}\n`);

  // Fetch all stays
  console.log('Fetching stays...');
  const res = await apiFetch('?limit=500&depth=0');
  const data = await res.json();
  console.log(`Total: ${data.totalDocs} stays\n`);

  // Categorize
  const stays = data.docs;
  const wanderStays = stays.filter(s => s.platform === 'Wander');
  const airbnbStays = stays.filter(s => s.platform === 'Airbnb');
  const vrboStays = stays.filter(s => s.platform === 'VRBO');
  const directStays = stays.filter(s => s.platform === 'Direct');

  console.log(`Platforms: Airbnb=${airbnbStays.length}, VRBO=${vrboStays.length}, Wander=${wanderStays.length}, Direct=${directStays.length}\n`);

  // Identify what needs enrichment
  const needsPrice = stays.filter(s => s.price === 0);
  const needsMeta = stays.filter(s => 
    !s.bedrooms || s.sleeps <= 1 || !s.rating || !s.reviewCount
  );

  console.log(`Needs pricing: ${needsPrice.length}`);
  console.log(`Needs metadata: ${needsMeta.length}\n`);

  let patched = 0;
  let skipped = 0;
  let errors = 0;

  // ─── Enrich Wander Stays ───────────────────────────────────────
  if (!platformFilter || platformFilter === 'Wander') {
    console.log('━━━ Wander Enrichment ━━━');
    for (const stay of wanderStays) {
      try {
        const updates = await enrichWanderStay(stay);
        if (updates) {
          const fields = Object.keys(updates).join(', ');
          if (DRY_RUN) {
            console.log(`  📋 Would patch ${stay.id}: ${fields}`);
          } else {
            const res = await apiFetch(`/${stay.id}`, {
              method: 'PATCH',
              body: JSON.stringify(updates),
            });
            if (res.ok) {
              console.log(`  ✅ Patched ${stay.id}: ${fields}`);
              patched++;
            } else {
              console.error(`  ✗ Patch failed ${stay.id}: ${res.status}`);
              errors++;
            }
          }
        } else {
          skipped++;
        }
      } catch (e) {
        console.error(`  ✗ Error on ${stay.id}: ${e.message}`);
        errors++;
      }
      await sleep(500); // Rate limit
    }
    console.log();
  }

  // ─── Enrich Airbnb Stays (only $0 or missing meta) ─────────────
  if (!platformFilter || platformFilter === 'Airbnb') {
    const airbnbNeeds = airbnbStays.filter(s => 
      s.price === 0 || !s.bedrooms || s.sleeps <= 1 || !s.rating
    );
    
    if (airbnbNeeds.length > 0 && !PRICE_ONLY) {
      console.log(`━━━ Airbnb Enrichment (${airbnbNeeds.length} stays) ━━━`);
      for (const stay of airbnbNeeds) {
        try {
          const updates = await enrichAirbnbStay(stay);
          if (updates) {
            const fields = Object.keys(updates).join(', ');
            if (DRY_RUN) {
              console.log(`  📋 Would patch ${stay.id}: ${fields}`);
            } else {
              const res = await apiFetch(`/${stay.id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
              });
              if (res.ok) {
                console.log(`  ✅ Patched ${stay.id}: ${fields}`);
                patched++;
              } else {
                console.error(`  ✗ Patch failed ${stay.id}: ${res.status}`);
                errors++;
              }
            }
          } else {
            skipped++;
          }
        } catch (e) {
          console.error(`  ✗ Error on ${stay.id}: ${e.message}`);
          errors++;
        }
        await sleep(1000); // Rate limit for Airbnb SSR
      }
      console.log();
    } else if (airbnbNeeds.length === 0) {
      console.log('━━━ Airbnb — all enriched ✓ ━━━\n');
    }
  }

  // ─── Summary ───────────────────────────────────────────────────
  console.log('━━━ Summary ━━━');
  console.log(`  Patched: ${patched}`);
  console.log(`  Skipped (no change needed): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  if (DRY_RUN) console.log('\n  (dry run — no changes were made)');
}

run().catch(console.error);
