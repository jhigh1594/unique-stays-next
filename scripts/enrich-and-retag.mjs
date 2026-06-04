#!/usr/bin/env node
/**
 * Deep Enrichment + Retag
 * 
 * For stays with only the Unique Stays spoke, fetches full listing data
 * from airbnb-pp-cli / wander-pp-cli to discover pet policies, workspace
 * amenities, RV hookups, and EV chargers that weren't in the original tags.
 * Then re-runs the auto-tagger logic to assign spokes.
 * 
 * Usage:
 *   node enrich-and-retag.mjs              # Enrich all underspoke'd stays
 *   node enrich-and-retag.mjs --dry-run    # Preview only
 */

import { execSync } from 'child_process';

const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '4a46b8b5d09bebf8bec3238dbffebce514fe55af3798cca3';
const BIN_PATH = `${process.env.HOME}/bin:${process.env.HOME}/go/bin`;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function exec(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: 45000,
      env: { ...process.env, PATH: `${BIN_PATH}:${process.env.PATH}` }
    }).trim();
  } catch (e) {
    return null;
  }
}

// ─── Airbnb Enrichment ─────────────────────────────────────────────

function extractFromAirbnb(json, key) {
  // Extract from the raw SSR JSON which has duplicate keys
  const re = new RegExp(`"${key}"\\s*:\\s*"?([^",\\n}]+)"?`, 'g');
  const matches = [];
  let m;
  while ((m = re.exec(json)) !== null) {
    matches.push(m[1].replace(/"/g, '').trim());
  }
  return [...new Set(matches)];
}

function extractNumFromAirbnb(json, key) {
  const vals = extractFromAirbnb(json, key);
  return vals.length > 0 ? parseFloat(vals[0]) || 0 : 0;
}

function analyzeAirbnbListing(json) {
  const lower = (json || '').toLowerCase();
  const policies = extractFromAirbnb(json, 'policies').join(' ').toLowerCase();
  const amenities = json || ''; // We'll search the raw JSON
  
  return {
    petFriendly: lower.includes('pets allowed') || lower.includes('pet friendly') || 
                 lower.includes('pets are allowed') || policies.includes('pet'),
    hasWorkspace: lower.includes('dedicated workspace') || lower.includes('workspace'),
    hasWifi: lower.includes('wifi') || lower.includes('internet'),
    hasEVCharger: lower.includes('ev charger') || lower.includes('ev charging'),
    hasRVHookup: lower.includes('rv hookup') || lower.includes('rv friendly'),
  };
}

// ─── Wander Enrichment ─────────────────────────────────────────────

function analyzeWanderProperty(json) {
  try {
    const prop = JSON.parse(json);
    const amenities = (prop.amenities || []).join(' ').toLowerCase();
    return {
      petFriendly: amenities.includes('pet') || amenities.includes('dog'),
      hasWorkspace: amenities.includes('workspace') || amenities.includes('desk'),
      hasWifi: amenities.includes('wifi') || amenities.includes('internet'),
      hasEVCharger: amenities.includes('ev charger') || amenities.includes('ev charging'),
      hasRVHookup: amenities.includes('rv'),
    };
  } catch {
    return null;
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function patchStay(id, updates) {
  const res = await fetch(`${ADMIN_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `users API-Key ${API_KEY}`,
    },
    body: JSON.stringify(updates),
  });
  return res.ok;
}

async function run() {
  console.log('=== Deep Enrichment + Retag ===\n');
  if (DRY_RUN) console.log('🔍 DRY RUN — no changes will be made\n');

  // Fetch all stays
  const res = await fetch(`${ADMIN_BASE}?limit=500&depth=0`, {
    headers: { 'Authorization': `users API-Key ${API_KEY}` },
  });
  const data = await res.json();
  const docs = data.docs;

  // Filter to stays with only Unique Stays spoke
  const underspoke = docs.filter(s => {
    const spokes = s.spokes || [];
    return spokes.length === 1 && spokes[0] === 1;
  });
  console.log(`Total stays: ${docs.length}`);
  console.log(`Underspoke (only Unique Stays): ${underspoke.length}\n`);

  const platformGroups = {};
  underspoke.forEach(s => {
    platformGroups[s.platform] = platformGroups[s.platform] || [];
    platformGroups[s.platform].push(s);
  });
  Object.entries(platformGroups).forEach(([p, stays]) => {
    console.log(`  ${p}: ${stays.length} stays`);
  });
  console.log();

  let enriched = 0;
  let retagged = 0;
  let errors = 0;

  // ─── Process Airbnb stays ──────────────────────────────────────
  const airbnbStays = platformGroups['Airbnb'] || [];
  console.log(`━━━ Airbnb (${airbnbStays.length} stays) ━━━`);

  for (let i = 0; i < airbnbStays.length; i++) {
    const stay = airbnbStays[i];
    const roomId = stay.affiliateUrl?.match(/\/rooms\/(\d+)/)?.[1];
    if (!roomId) {
      console.log(`  [${stay.id}] No room ID — skipping`);
      continue;
    }

    console.log(`  [${i+1}/${airbnbStays.length}] Room ${roomId} — ${stay.title?.substring(0, 40)}`);

    const json = exec(`airbnb-pp-cli airbnb-listing get ${roomId} --agent`);
    if (!json) {
      console.log(`    ✗ Fetch failed`);
      errors++;
      await sleep(500);
      continue;
    }

    const analysis = analyzeAirbnbListing(json);
    const updates = {};
    const newTags = [];
    const newSpokes = [1]; // Always keep Unique Stays

    if (analysis.petFriendly) {
      newTags.push({ tag: 'Pet Friendly' });
      newSpokes.push(3);
    }
    if (analysis.hasWorkspace && analysis.hasWifi) {
      newTags.push({ tag: 'Desk' });
      newTags.push({ tag: 'Wifi' });
      newSpokes.push(2);
    }
    if (analysis.hasRVHookup) {
      newTags.push({ tag: 'RV' });
      newSpokes.push(4);
    }
    if (analysis.hasEVCharger) {
      newTags.push({ tag: 'EV Charger' });
      newSpokes.push(5);
    }

    if (newSpokes.length > 1 || newTags.length > 0) {
      const existingTags = (stay.tags || []).map(t => ({ tag: t.tag || t }));
      // Merge tags (dedupe by lowercase)
      const tagSet = new Map();
      [...existingTags, ...newTags].forEach(t => {
        tagSet.set((t.tag || t).toLowerCase(), { tag: t.tag || t });
      });
      updates.tags = [...tagSet.values()];
      updates.spokes = [...new Set(newSpokes)].sort((a, b) => a - b);

      const spokeNames = { 2: 'Work-Friendly', 3: 'Pet-Friendly', 4: 'RV-Ready', 5: 'EV-Ready' };
      const added = updates.spokes.filter(id => id !== 1).map(id => spokeNames[id]);
      const tagAdded = newTags.map(t => t.tag);

      if (DRY_RUN) {
        console.log(`    📋 Would add: spokes [${added.join(', ')}], tags [${tagAdded.join(', ')}]`);
      } else {
        const ok = await patchStay(stay.id, updates);
        if (ok) {
          console.log(`    ✅ +spokes: ${added.join(', ')} | +tags: ${tagAdded.join(', ')}`);
          retagged++;
        } else {
          console.log(`    ✗ Patch failed`);
          errors++;
        }
      }
    } else {
      console.log(`    — No new spokes qualify`);
    }

    enriched++;
    await sleep(200);
  }

  // ─── Process Wander stays ──────────────────────────────────────
  const wanderStays = platformGroups['Wander'] || [];
  if (wanderStays.length > 0) {
    console.log(`\n━━━ Wander (${wanderStays.length} stays) ━━━`);
    for (const stay of wanderStays) {
      const slug = stay.affiliateUrl?.split('/').pop();
      console.log(`  [${stay.id}] ${slug}`);

      const json = exec(`wander-pp-cli get ${slug} --agent`);
      if (!json) {
        console.log(`    ✗ Fetch failed`);
        errors++;
        continue;
      }

      const analysis = analyzeWanderProperty(json);
      if (!analysis) {
        console.log(`    ✗ Parse failed`);
        errors++;
        continue;
      }

      const newSpokes = [1];
      const newTags = [];

      if (analysis.petFriendly) {
        newTags.push({ tag: 'Pet Friendly' });
        newSpokes.push(3);
      }
      if (analysis.hasWorkspace && analysis.hasWifi) {
        newTags.push({ tag: 'Desk' }, { tag: 'Wifi' });
        newSpokes.push(2);
      }
      if (analysis.hasEVCharger) {
        newTags.push({ tag: 'EV Charger' });
        newSpokes.push(5);
      }

      if (newSpokes.length > 1 || newTags.length > 0) {
        const existingTags = (stay.tags || []).map(t => ({ tag: t.tag || t }));
        const tagSet = new Map();
        [...existingTags, ...newTags].forEach(t => {
          tagSet.set((t.tag || t).toLowerCase(), { tag: t.tag || t });
        });
        const updates = {
          tags: [...tagSet.values()],
          spokes: [...new Set(newSpokes)].sort((a, b) => a - b),
        };

        if (DRY_RUN) {
          console.log(`    📋 Would patch:`, JSON.stringify(updates.spokes), JSON.stringify(updates.tags.map(t => t.tag)));
        } else {
          const ok = await patchStay(stay.id, updates);
          if (ok) {
            console.log(`    ✅ Patched`);
            retagged++;
          } else {
            console.log(`    ✗ Patch failed`);
            errors++;
          }
        }
      } else {
        console.log(`    — No new spokes qualify`);
      }
      enriched++;
    }
  }

  // ─── Summary ───────────────────────────────────────────────────
  console.log(`\n━━━ Summary ━━━`);
  console.log(`  Enriched: ${enriched}`);
  console.log(`  Retagged: ${retagged}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Remaining underspoke: ${underspoke.length - retagged} (VRBO/Direct with no auto-source)`);
  if (DRY_RUN) console.log('\n  (dry run — no changes were made)');
}

run().catch(console.error);
