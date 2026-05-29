#!/usr/bin/env node
/**
 * Location data migration — runs directly against the database.
 * Bypasses the flaky Next.js dev server.
 * 
 * Usage:
 *   node scripts/migrate-locations-direct.mjs          # dry run
 *   node scripts/migrate-locations-direct.mjs --apply   # actually update records
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

const STATE_MAP = {
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
};
const CODE_TO_NAME = Object.fromEntries(Object.entries(STATE_MAP).map(([k,v]) => [v,k]));

// Load manual review overrides
let manualOverrides = {};
try {
  manualOverrides = JSON.parse(readFileSync('scripts/manual-review-locations.json', 'utf8'));
  // Convert array to lookup by id
  if (Array.isArray(manualOverrides)) {
    manualOverrides = Object.fromEntries(manualOverrides.map(m => [m.id, m]));
  }
} catch { /* no overrides file */ }

function parseLocation(raw) {
  if (!raw) return [null, null];
  let cleaned = raw.trim().replace(/^(Map\s*\n?|View in a map\s*\n?)/, '').trim();
  if (cleaned.toLowerCase() === 'unknown') return [null, null];

  const match = cleaned.match(/^(.+?),\s*([A-Za-z\s]+)$/);
  if (match) {
    const city = match[1].trim();
    const stateRaw = match[2].trim();
    if (stateRaw.length === 2 && stateRaw.toUpperCase() in CODE_TO_NAME) {
      return [city, CODE_TO_NAME[stateRaw.toUpperCase()]];
    } else if (stateRaw in STATE_MAP) {
      return [city, stateRaw];
    }
    for (const name of Object.keys(STATE_MAP)) {
      if (name.toLowerCase() === stateRaw.toLowerCase()) return [city, name];
    }
    return [city, stateRaw];
  }
  return [cleaned, null];
}

function normalizeState(rawState, parsedState) {
  for (const candidate of [parsedState, rawState]) {
    if (!candidate) continue;
    const c = candidate.trim();
    if (c in STATE_MAP) return [c, STATE_MAP[c]];
    if (c.length === 2 && c.toUpperCase() in CODE_TO_NAME) return [CODE_TO_NAME[c.toUpperCase()], c.toUpperCase()];
    for (const name of Object.keys(STATE_MAP)) {
      if (name.toLowerCase() === c.toLowerCase()) return [name, STATE_MAP[name]];
    }
  }
  return [null, null];
}

// Geocoding
const geocodeCache = {};
async function geocode(city, state) {
  const key = `${city}, ${state}`;
  if (key in geocodeCache) return geocodeCache[key];
  
  const query = encodeURIComponent(`${city}, ${state}, USA`);
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`, {
      headers: { 'User-Agent': 'UniqueStaysUSA-LocationMigration/1.0' }
    });
    const results = await resp.json();
    const coords = results.length > 0 
      ? { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
      : null;
    geocodeCache[key] = coords;
    await new Promise(r => setTimeout(r, 1100)); // Nominatim rate limit
    return coords;
  } catch (e) {
    console.log(`    ⚠️  Geocoding failed for '${key}': ${e.message}`);
    geocodeCache[key] = null;
    return null;
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URI || 'postgresql://neondb_owner:npg_0qBFTlycuQ7f@ep-little-silence-aper8xyh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';
  const sql = postgres(connectionString);

  console.log(APPLY ? 'APPLY MODE' : 'DRY RUN — use --apply to write changes');
  console.log('Fetching all stays from database...\n');

  const stays = await sql`SELECT id, slug, location, city, state, state_code, ST_AsGeoJSON(coordinates) as coords_json FROM stays ORDER BY id DESC`;
  console.log(`Found ${stays.length} stays\n`);

  const stats = { updated: 0, skipped_clean: 0, needs_manual: 0, geocode_success: 0, geocode_fail: 0, errors: 0 };
  const needsManual = [];

  for (const stay of stays) {
    const { id, slug, location: rawLocation, city: existingCity, state: rawState, state_code: existingStateCode, coords_json } = stay;
    
    let existingCoords = null;
    if (coords_json) {
      try {
        const gj = JSON.parse(coords_json);
        existingCoords = { lat: gj.coordinates[1], lng: gj.coordinates[0] };
      } catch {}
    }

    const [parsedCity, parsedState] = parseLocation(rawLocation);
    const [stateName, stateCode] = normalizeState(rawState, parsedState);

    // Check for manual override
    const override = manualOverrides[id];
    
    const changes = {};

    // City
    const finalCity = override?.city || parsedCity;
    if (finalCity && !existingCity) {
      changes.city = finalCity;
    }

    // State normalization
    if (stateName && rawState !== stateName) {
      changes.state = stateName;
    }
    if (stateCode && !existingStateCode) {
      changes.state_code = stateCode;
    }

    // Clean location
    const cleanLocation = (rawLocation || '').trim().replace(/^(Map\s*\n?|View in a map\s*\n?)/, '').trim();
    if (cleanLocation !== (rawLocation || '').trim() && cleanLocation) {
      changes.location = cleanLocation;
    }

    // Geocoding (only if we have city + state and no existing coords)
    if (finalCity && stateName && !existingCoords) {
      const coords = await geocode(finalCity, stateName);
      if (coords) {
        changes.coordinates = coords;
        stats.geocode_success++;
      } else {
        stats.geocode_fail++;
      }
    }

    // Manual review check
    const noCity = !finalCity && !existingCity;
    const noState = !stateName;
    const isUnknown = !rawLocation || rawLocation.trim().toLowerCase() === 'unknown';
    if ((noCity || noState || isUnknown) && !existingCity) {
      stats.needs_manual++;
      needsManual.push({ id, slug, location: rawLocation, state: rawState, parsed_city: parsedCity, parsed_state: parsedState });
    }

    if (Object.keys(changes).length === 0) {
      stats.skipped_clean++;
      continue;
    }

    // Log
    console.log(`  [${id}] ${slug?.slice(0,50)}`);
    if (changes.city) console.log(`        city: ${changes.city}`);
    if (changes.state) console.log(`        state: ${rawState} → ${changes.state}`);
    if (changes.state_code) console.log(`        state_code: ${changes.state_code}`);
    if (changes.location) console.log(`        location: cleaned`);
    if (changes.coordinates) console.log(`        coordinates: (${changes.coordinates.lat.toFixed(4)}, ${changes.coordinates.lng.toFixed(4)})`);

    if (APPLY) {
      try {
        if (changes.coordinates) {
          await sql`UPDATE stays SET
            city = COALESCE(${changes.city || null}, city),
            state = COALESCE(${changes.state || null}, state),
            state_code = COALESCE(${changes.state_code || null}, state_code),
            location = COALESCE(${changes.location || null}, location),
            coordinates = ST_SetSRID(ST_MakePoint(${changes.coordinates.lng}, ${changes.coordinates.lat}), 4326)
          WHERE id = ${id}`;
        } else {
          await sql`UPDATE stays SET
            city = COALESCE(${changes.city || null}, city),
            state = COALESCE(${changes.state || null}, state),
            state_code = COALESCE(${changes.state_code || null}, state_code),
            location = COALESCE(${changes.location || null}, location)
          WHERE id = ${id}`;
        }
        stats.updated++;
      } catch (e) {
        console.log(`    ❌ Update failed for stay ${id}: ${e.message}`);
        stats.errors++;
      }
    } else {
      stats.updated++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${APPLY ? 'UPDATED' : 'WOULD UPDATE'}: ${stats.updated}`);
  console.log(`Skipped (already clean): ${stats.skipped_clean}`);
  console.log(`Needs manual review: ${stats.needs_manual}`);
  console.log(`Geocoded successfully: ${stats.geocode_success}`);
  console.log(`Geocode failures: ${stats.geocode_fail}`);
  console.log(`Errors: ${stats.errors}`);

  if (needsManual.length > 0) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`STAYS NEEDING MANUAL REVIEW (${needsManual.length}):`);
    console.log(`${'='.repeat(60)}`);
    for (const s of needsManual.slice(0, 30)) {
      console.log(`  [${s.id}] ${s.slug?.slice(0,50)}`);
      console.log(`        location="${s.location}" state="${s.state}"`);
    }
    if (needsManual.length > 30) console.log(`  ... and ${needsManual.length - 30} more`);
  }

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
