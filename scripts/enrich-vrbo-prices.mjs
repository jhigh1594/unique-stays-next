/**
 * VRBO Price Enrichment v2 — Robust Cross-Reference
 * 
 * Fixes:
 * - Reconnect browser per search (avoid detached frames)
 * - Handle missing state data
 * - Skip international listings
 * - Better Airbnb search matching
 */

import puppeteer from 'puppeteer-core';

const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';
const BASE = 'https://www.uniquestaysusa.com/api/stays';
const BL_TOKEN = '2UTr21YzqiZEcVBf67740acb023d9657bcc7b9a3408d631a8';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function extractRoomId(url) { return url?.match(/\/rooms\/(\d+)/)?.[1] || null; }

async function getBrowser() {
  return puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BL_TOKEN}`,
    defaultViewport: { width: 1280, height: 900 },
  });
}

async function searchAirbnbPrice(title, location) {
  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    
    // Search Airbnb for this property
    const query = `${title.replace(/[^\w\s]/g, '').substring(0, 40)} ${location || ''}`.trim();
    const searchUrl = `https://www.airbnb.com/s/${encodeURIComponent(query)}/homes?tab_id=home_tab&checkin=2026-06-05&checkout=2026-06-07&adults=2`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(5000);

    // Extract listings with prices
    const listings = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('[itemprop="itemListElement"]');
      
      for (const card of cards) {
        const text = card.textContent || '';
        const linkEl = card.querySelector('a[href*="/rooms/"]');
        
        // Extract price
        let price = null;
        const totalMatch = text.match(/\$([\d,]+)\s+for\s+(\d+)\s+night/);
        if (totalMatch) {
          price = Math.round(parseInt(totalMatch[1].replace(/,/g, '')) / parseInt(totalMatch[2]));
        }
        if (!price) {
          const dollarMatch = text.match(/\$([\d,]+)/);
          if (dollarMatch) price = parseInt(dollarMatch[1].replace(/,/g, ''));
        }
        
        // Extract title/name
        const titleEl = card.querySelector('[data-testid="listing-card-title"]');
        const name = titleEl?.textContent?.trim() || '';
        
        const roomId = linkEl?.href?.match(/\/rooms\/(\d+)/)?.[1] || '';
        
        if (price && price >= 30) {
          results.push({ name, price, roomId });
        }
      }
      return results;
    });

    await browser.close();

    // Find best name match
    const targetWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    let bestMatch = null;
    let bestSim = 0;
    
    for (const listing of listings) {
      const nameWords = listing.name.toLowerCase().split(/\s+/);
      const matchCount = targetWords.filter(w => nameWords.some(n => n.includes(w))).length;
      const sim = matchCount / targetWords.length;
      
      if (sim > bestSim && sim > 0.25) {
        bestSim = sim;
        bestMatch = listing;
      }
    }

    // Return best match, or if no good match, the average of all results
    if (bestMatch) {
      return { method: 'match', price: bestMatch.price, name: bestMatch.name, sim: bestSim };
    } else if (listings.length > 0) {
      const prices = listings.map(l => l.price).filter(p => p >= 30 && p <= 3000);
      if (prices.length > 0) {
        const avg = Math.round(prices.reduce((a,b) => a+b, 0) / prices.length);
        return { method: 'area-avg', price: avg, count: listings.length };
      }
    }
    
    return null;
  } catch(e) {
    try { await browser.close(); } catch {}
    return { error: e.message };
  }
}

async function run() {
  console.log('=== VRBO Price Enrichment — Cross-Reference ===\n');

  const res = await fetch(`${BASE}?limit=500&depth=0`, {
    headers: { 'Authorization': `users API-Key ${API_KEY}` }
  });
  const data = await res.json();

  // All Airbnb stays with prices (for fallback estimation)
  const airbnbByState = {};
  for (const s of data.docs) {
    if (s.platform === 'Airbnb' && s.price > 20 && s.state && s.state !== 'Unknown') {
      if (!airbnbByState[s.state]) airbnbByState[s.state] = [];
      airbnbByState[s.state].push(s.price);
    }
  }
  
  const stateMedian = {};
  for (const [state, prices] of Object.entries(airbnbByState)) {
    const sorted = [...prices].sort((a,b) => a-b);
    stateMedian[state] = sorted[Math.floor(sorted.length / 2)];
  }
  console.log(`State medians: ${Object.keys(stateMedian).length} states\n`);

  // VRBO stays needing prices
  const vrboNeeds = data.docs.filter(s => 
    (s.platform === 'VRBO' || s.affiliateUrl?.includes('vrbo.com')) && s.price === 0
  );
  console.log(`VRBO stays needing prices: ${vrboNeeds.length}\n`);

  const results = [];

  for (let i = 0; i < vrboNeeds.length; i++) {
    const stay = vrboNeeds[i];
    const title = stay.title || '';
    const state = stay.state || '';
    const location = [stay.city, state].filter(Boolean).join(', ');
    
    console.log(`[${i+1}/${vrboNeeds.length}] "${title.substring(0, 45)}" (${location || 'Unknown'})`);

    // Skip non-US listings
    const nonUSPatterns = /spain|greece|santorini|oia|italy|mexico|france|germany|portugal/i;
    if (nonUSPatterns.test(title) || (state === 'Unknown' && !location)) {
      // Use global median as fallback
      const allPrices = Object.values(airbnbByState).flat();
      const globalMedian = allPrices.sort((a,b) => a-b)[Math.floor(allPrices.length / 2)];
      console.log(`  Skipping (international/unknown) → using global median $${globalMedian}`);
      await patch(stay.id, { price: globalMedian });
      results.push({ id: stay.id, method: 'global-median', price: globalMedian });
      continue;
    }

    const result = await searchAirbnbPrice(title, location);
    
    if (result?.error) {
      console.log(`  Error: ${result.error.substring(0, 80)}`);
      results.push({ id: stay.id, method: 'error' });
    } else if (result?.method === 'match') {
      console.log(`  ✓ Airbnb match: "${result.name?.substring(0, 30)}" (${(result.sim*100).toFixed(0)}%) → $${result.price}/night`);
      await patch(stay.id, { price: result.price });
      results.push({ id: stay.id, method: 'airbnb-match', price: result.price });
    } else if (result?.method === 'area-avg') {
      console.log(`  ≈ Area average from ${result.count} Airbnb listings → $${result.price}/night`);
      await patch(stay.id, { price: result.price });
      results.push({ id: stay.id, method: 'area-avg', price: result.price });
    } else {
      // Final fallback: state median
      const median = stateMedian[state] || stateMedian['Unknown'];
      if (median) {
        console.log(`  ≈ State median (${state}) → $${median}/night`);
        await patch(stay.id, { price: median });
        results.push({ id: stay.id, method: 'state-median', price: median });
      } else {
        console.log(`  ✗ No price data available`);
        results.push({ id: stay.id, method: 'failed' });
      }
    }

    await sleep(2000);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS`);
  console.log(`${'='.repeat(50)}`);
  const methods = {};
  results.forEach(r => { methods[r.method] = (methods[r.method] || 0) + 1; });
  Object.entries(methods).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`Total priced: ${results.filter(r => r.price).length} / ${vrboNeeds.length}`);
}

async function patch(id, fields) {
  await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `users API-Key ${API_KEY}` },
    body: JSON.stringify(fields),
  });
}

run().catch(console.error);
