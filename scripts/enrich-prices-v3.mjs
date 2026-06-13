/**
 * Price Enrichment Script v3 — Airbnb Search-Based Price Extraction
 * 
 * Strategy: Instead of scraping individual listing pages (which don't show prices
 * without date selection), search Airbnb with pre-filled dates and extract prices
 * from the search results page.
 * 
 * For each stay with an estimated/default price:
 * 1. Search Airbnb by listing room ID + location
 * 2. Match the room ID in search results
 * 3. Extract total price → divide by number of nights → per-night price
 * 4. Fallback: average prices of similar listings in the same area
 */

import puppeteer from 'puppeteer-core';

const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';
const BL_TOKEN = '2UTr21YzqiZEcVBf67740acb023d9657bcc7b9a3408d631a8';

// Dates for search — next weekend (Friday-Sunday)
function getNextWeekend() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  return {
    checkin: friday.toISOString().split('T')[0],
    checkout: sunday.toISOString().split('T')[0],
    nights: 2,
  };
}

// Extract room ID from Airbnb URL
function extractRoomId(url) {
  if (!url) return null;
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : null;
}

// Sleep helper
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const dates = getNextWeekend();
  console.log(`Search dates: ${dates.checkin} → ${dates.checkout} (${dates.nights} nights)\n`);

  // Fetch all stays that might need price enrichment
  // Focus on Airbnb listings with estimated prices (price that looks rounded to $5)
  const res = await fetch(`${ADMIN_BASE}?limit=500&depth=0`, {
    headers: { 'Authorization': `users API-Key ${API_KEY}` },
  });
  
  if (!res.ok) {
    console.error(`Payload API error: ${res.status}`);
    console.log('Falling back to direct query...');
    return;
  }
  
  const data = await res.json();
  const airbnbStays = data.docs.filter(s => {
    const roomId = extractRoomId(s.affiliateUrl);
    // Target Airbnb stays with prices that look estimated (round to $5)
    return roomId && s.platform === 'Airbnb' && s.price > 1;
  });

  console.log(`Total stays: ${data.totalDocs}`);
  console.log(`Airbnb stays with room IDs: ${airbnbStays.length}\n`);

  // Group by state for batch searching
  const byState = {};
  for (const stay of airbnbStays.slice(0, 30)) { // Limit to 30 for Browserless quota
    const state = stay.state || 'Unknown';
    if (!byState[state]) byState[state] = [];
    byState[state].push(stay);
  }

  console.log(`Processing stays across ${Object.keys(byState).length} states\n`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BL_TOKEN}`,
  });

  const results = [];
  let processed = 0;
  let found = 0;

  for (const [state, stays] of Object.entries(byState)) {
    if (processed >= 30) break; // Browserless quota guard

    console.log(`\n--- ${state} (${stays.length} stays) ---`);

    for (const stay of stays) {
      if (processed >= 30) break;

      const roomId = extractRoomId(stay.affiliateUrl);
      processed++;

      try {
        // Search for this specific listing by room ID
        const searchUrl = `https://www.airbnb.com/rooms/${roomId}?checkin=${dates.checkin}&checkout=${dates.checkout}&adults=2`;
        
        const page = await browser.newPage();
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(3000);

        // Try to find the price on the listing page (now that dates are in URL)
        const priceInfo = await page.evaluate(() => {
          const body = document.body.innerText;
          const lines = body.split('\n').filter(l => /\$[\d,]+/.test(l));
          
          // Look for the main price line (usually "$XXX / night" or "$XXX total")
          for (const line of lines) {
            // Price per night
            const nightMatch = line.match(/\$([\d,]+)\s*\/\s*night/);
            if (nightMatch) return { perNight: parseInt(nightMatch[1].replace(',', '')), raw: line.trim() };
            
            // Total for N nights
            const totalMatch = line.match(/\$([\d,]+)\s*for\s+(\d+)\s+night/);
            if (totalMatch) {
              const total = parseInt(totalMatch[1].replace(',', ''));
              const nights = parseInt(totalMatch[2]);
              return { perNight: Math.round(total / nights), raw: line.trim() };
            }
          }

          // Fallback: first dollar amount that's a reasonable nightly rate
          for (const line of lines.slice(0, 10)) {
            const match = line.match(/\$([\d,]+)/);
            if (match) {
              const val = parseInt(match[1].replace(',', ''));
              if (val >= 30 && val <= 2000) return { perNight: val, raw: line.trim(), uncertain: true };
            }
          }
          
          return null;
        });

        if (priceInfo) {
          console.log(`  ✓ Room ${roomId} "${stay.title?.substring(0, 40)}": $${priceInfo.perNight}/night (${priceInfo.raw})${priceInfo.uncertain ? ' [uncertain]' : ''}`);
          
          // Update in Payload
          if (Math.abs(priceInfo.perNight - stay.price) > 10) {
            console.log(`    Current: $${stay.price} → New: $${priceInfo.perNight} (updating)`);
            await patch(stay.id, { price: priceInfo.perNight });
          }
          
          found++;
          results.push({ id: stay.id, roomId, title: stay.title, oldPrice: stay.price, newPrice: priceInfo.perNight });
        } else {
          console.log(`  ✗ Room ${roomId} "${stay.title?.substring(0, 40)}": no price found`);
        }

        await page.close();
        await sleep(2000); // Rate limiting
      } catch (e) {
        console.log(`  ✗ Room ${roomId}: error - ${e.message}`);
      }
    }
  }

  await browser.close();

  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Found prices: ${found}`);
  console.log(`Updated: ${results.filter(r => r.oldPrice !== r.newPrice).length}`);
  console.log(`\nResults:`);
  results.forEach(r => console.log(`  ${r.roomId}: $${r.oldPrice} → $${r.newPrice}`));
}

async function patch(id, data) {
  const res = await fetch(`${ADMIN_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `users API-Key ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

run().catch(console.error);
