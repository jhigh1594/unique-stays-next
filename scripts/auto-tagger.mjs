#!/usr/bin/env node
/**
 * Auto-Tagger: Assigns spoke and category metadata to stays based on tags, titles, and descriptions.
 * 
 * Spoke rules:
 *   1 (Unique Stays)   — all stays get this
 *   2 (Work-Friendly)   — has desk/workspace + wifi/internet/starlink tags
 *   3 (Pet-Friendly)    — has pet/dog/cat tags OR petDetails.petFriendly
 *   4 (RV-Ready)        — has rv tag OR rvDetails.rvHookup
 *   5 (EV-Ready)        — has ev charger/charging tag OR evDetails.evCharger
 * 
 * Category rules:
 *   Title/description keywords → category mapping
 * 
 * Usage:
 *   node auto-tagger.mjs              # Tag all stays
 *   node auto-tagger.mjs --spokes     # Only spoke tagging
 *   node auto-tagger.mjs --categories # Only category tagging  
 *   node auto-tagger.mjs --dry-run    # Preview changes
 *   node auto-tagger.mjs --stay 123   # Single stay
 */

import { readFileSync } from 'fs';

const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '4a46b8b5d09bebf8bec3238dbffebce514fe55af3798cca3';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SPOKES_ONLY = args.includes('--spokes');
const CATEGORIES_ONLY = args.includes('--categories');
const SINGLE_STAY = args.includes('--stay') ? args[args.indexOf('--stay') + 1] : null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function hasTag(stay, patterns) {
  const tags = (stay.tags || []).map(t => (t.tag || t).toLowerCase());
  return patterns.some(p => tags.some(t => t.includes(p.toLowerCase())));
}

function hasSpoke(stay, id) {
  return (stay.spokes || []).some(sp => (typeof sp === 'object' ? sp.id : sp) === id);
}

function getTitleAndDesc(stay) {
  return `${stay.title || ''} ${stay.description || ''} ${stay.body || ''} ${stay.vibe || ''}`.toLowerCase();
}

// ─── Spoke Rules ────────────────────────────────────────────────────

function computeSpokes(stay) {
  const current = (stay.spokes || []).map(sp => typeof sp === 'object' ? sp.id : sp);
  const spokes = new Set(current);
  
  // Every stay should have Unique Stays (1)
  spokes.add(1);

  // Work-Friendly (2): desk/workspace + wifi/internet
  const hasWorkSpace = hasTag(stay, ['desk', 'workspace', 'dedicated workspace']);
  const hasConnectivity = hasTag(stay, ['wifi', 'internet', 'starlink', 'fast wifi', 'unlimited wifi']);
  if (hasWorkSpace && hasConnectivity) {
    spokes.add(2);
  }
  // Also check workFriendly field
  if (stay.workFriendly?.hasDesk && hasConnectivity) {
    spokes.add(2);
  }

  // Pet-Friendly (3): pet/dog/cat tags or petDetails
  if (hasTag(stay, ['pet', 'dog', 'cat', 'pet-friendly', 'dog-friendly', 'dogs and cats', 'pets allowed', 'pets welcome'])) {
    spokes.add(3);
  }
  if (stay.petDetails?.petFriendly) {
    spokes.add(3);
  }

  // RV-Ready (4): rv tag or rvDetails
  if (hasTag(stay, ['rv', 'rv hookup', 'rv friendly'])) {
    spokes.add(4);
  }
  if (stay.rvDetails?.rvHookup) {
    spokes.add(4);
  }

  // EV-Ready (5): ev charger/charging tag or evDetails
  if (hasTag(stay, ['ev charger', 'ev charging', 'level 2 ev', 'ev charger (level 2)', 'electric vehicle'])) {
    spokes.add(5);
  }
  if (stay.evDetails?.evCharger) {
    spokes.add(5);
  }

  return [...spokes].sort((a, b) => a - b);
}

// ─── Category Rules ─────────────────────────────────────────────────

const CATEGORY_RULES = [
  { id: 1, keywords: ['treehouse', 'tree house', 'tree home', 'in the trees', 'suspended in trees', 'tree tower'] },
  { id: 2, keywords: ['geodesic dome', 'dome home', 'glamping dome', 'glass dome', 'bubble dome', 'stargazing dome'] },
  { id: 3, keywords: ['houseboat', 'house boat', 'floating home', 'boat house', 'floating house', 'barge'] },
  { id: 4, keywords: ['lighthouse', 'light house', 'light keeper', 'lighthouse keeper'] },
  { id: 5, keywords: ['converted barn', 'barn conversion', 'barn loft', 'renovated barn', 'barn stay', 'bank barn'] },
  { id: 6, keywords: ['cave', 'cave dwelling', 'cave house', 'cave hotel', 'underground home', 'cave home', 'cenote', 'troglodyte', 'yorking in the hill'] },
  { id: 7, keywords: ['a-frame', 'a frame', 'aframe', 'a-framed'] },
  { id: 8, keywords: ['tiny home', 'tiny house', 'micro home', 'micro cabin', 'compact cabin'] },
  { id: 9, keywords: ['glamping', 'glamp', 'safari tent', 'yurt', 'tipi', 'tepee', 'teepee', 'bell tent', 'canvas tent', 'luxury tent', 'tent with', 'wall tent', 'glampground'] },
  { id: 10, keywords: ['castle', 'chateau', 'manor', 'palace', 'estate', 'fortress', 'mansion', 'villa'] },
];

function computeCategory(stay) {
  const currentCat = stay.category?.id || stay.category;
  const text = getTitleAndDesc(stay);
  
  // If already categorized (not default 10), keep it unless we find a better match
  // Only recategorize stays in category 10 (the default/catch-all)
  if (currentCat && currentCat !== 10) return currentCat;
  
  // Check rules in order — first match wins
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.id;
    }
  }
  
  return currentCat || 10; // Keep existing if no match
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
  console.log('=== Auto-Tagger: Spoke & Category Assignment ===\n');
  if (DRY_RUN) console.log('🔍 DRY RUN — no changes will be made\n');

  // Load stays
  let stays;
  if (SINGLE_STAY) {
    const res = await fetch(`${ADMIN_BASE}/${SINGLE_STAY}?depth=0`, {
      headers: { 'Authorization': `users API-Key ${API_KEY}` },
    });
    stays = [await res.json()];
  } else {
    const res = await fetch(`${ADMIN_BASE}?limit=500&depth=0`, {
      headers: { 'Authorization': `users API-Key ${API_KEY}` },
    });
    const data = await res.json();
    stays = data.docs;
  }
  console.log(`Processing ${stays.length} stays\n`);

  const spokeNames = { 1: 'Unique Stays', 2: 'Work-Friendly', 3: 'Pet-Friendly', 4: 'RV-Ready', 5: 'EV-Ready' };
  const catNames = {
    1: 'Treehouses', 2: 'Geodesic Domes', 3: 'Houseboats', 4: 'Lighthouses',
    5: 'Converted Barns', 6: 'Cave Dwellings', 7: 'A-Frame Cabins',
    8: 'Tiny Homes', 9: 'Glamping', 10: 'Castles & Estates'
  };

  let totalPatched = 0;
  let spokeChanges = 0;
  let catChanges = 0;
  let noChanges = 0;

  for (const stay of stays) {
    const updates = {};

    // Spoke computation
    if (!CATEGORIES_ONLY) {
      const newSpokes = computeSpokes(stay);
      const currentSpokes = (stay.spokes || []).map(sp => typeof sp === 'object' ? sp.id : sp).sort((a,b) => a-b);
      
      if (JSON.stringify(newSpokes) !== JSON.stringify(currentSpokes)) {
        updates.spokes = newSpokes;
      }
    }

    // Category computation
    if (!SPOKES_ONLY) {
      const newCat = computeCategory(stay);
      const currentCat = stay.category?.id || stay.category;
      if (newCat !== currentCat) {
        updates.category = newCat;
      }
    }

    if (Object.keys(updates).length === 0) {
      noChanges++;
      continue;
    }

    // Build change description
    const changes = [];
    if (updates.spokes) {
      const added = updates.spokes.filter(id => !hasSpoke(stay, id));
      const addedNames = added.map(id => spokeNames[id]).join(', ');
      changes.push(`+spokes: ${addedNames}`);
    }
    if (updates.category) {
      changes.push(`category: ${catNames[stay.category?.id || stay.category]} → ${catNames[updates.category]}`);
    }

    if (DRY_RUN) {
      console.log(`📋 [${stay.id}] ${stay.title?.substring(0, 40)} | ${changes.join(' | ')}`);
      totalPatched++;
      if (updates.spokes) spokeChanges++;
      if (updates.category) catChanges++;
    } else {
      const ok = await patchStay(stay.id, updates);
      if (ok) {
        console.log(`✅ [${stay.id}] ${stay.title?.substring(0, 40)} | ${changes.join(' | ')}`);
        totalPatched++;
        if (updates.spokes) spokeChanges++;
        if (updates.category) catChanges++;
      } else {
        console.error(`✗ [${stay.id}] patch failed`);
      }
      await sleep(50);
    }
  }

  console.log(`\n━━━ Summary ━━━`);
  console.log(`  Total processed: ${stays.length}`);
  console.log(`  ${DRY_RUN ? 'Would patch' : 'Patched'}: ${DRY_RUN ? (stays.length - noChanges) : totalPatched}`);
  console.log(`  Spoke changes: ${spokeChanges || (stays.length - noChanges)}`);
  console.log(`  Category changes: ${catChanges}`);
  console.log(`  No changes needed: ${noChanges}`);
  if (DRY_RUN) console.log('\n  (dry run — no changes were made)');
}

run().catch(console.error);
