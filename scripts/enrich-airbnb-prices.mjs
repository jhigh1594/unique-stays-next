/**
 * Price Enrichment — Production Script
 * 
 * Proven approach:
 * 1. Load listing page
 * 2. Open calendar by clicking "Add date"
 * 3. Click first available check-in date
 * 4. Click first available checkout date
 * 5. Extract price from sidebar
 * 
 * Handles:
 * - Listings with no available dates (skip)
 * - Fully booked listings (skip)
 * - Browserless reconnection per listing
 * - Rate limiting (1.5s between requests)
 */

import puppeteer from 'puppeteer-core';

const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '4a46b8b5d09bebf8bec3238dbffebce514fe55af3798cca3';
const BL_TOKEN = '2UTr21YzqiZEcVBf67740acb023d9657bcc7b9a3408d631a8';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function extractRoomId(url) { return url?.match(/\/rooms\/(\d+)/)?.[1] || null; }

async function getBrowser() {
  return puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BL_TOKEN}`,
    defaultViewport: { width: 1280, height: 900 },
  });
}

async function getPriceForRoom(roomId) {
  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    await page.goto(`https://www.airbnb.com/rooms/${roomId}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);

    // Check for 404
    const pageCheck = await page.evaluate(() => document.body.innerText.substring(0, 200));
    if (pageCheck.includes("can't find") || pageCheck.includes('404')) {
      await browser.close();
      return { status: '404' };
    }

    // Open date picker
    const opened = await page.evaluate(() => {
      for (const el of document.querySelectorAll('div, button')) {
        if (el.textContent?.trim() === 'Add date') { el.click(); return true; }
      }
      return false;
    });

    if (!opened) {
      await browser.close();
      return { status: 'no-calendar' };
    }

    await sleep(2000);

    // Find check-in dates
    const checkins = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('td[role="button"]'))
        .filter(td => td.getAttribute('aria-disabled') !== 'true' && td.getAttribute('aria-label')?.includes('check-in'))
        .map(td => td.getAttribute('aria-label'))
        .slice(0, 5);
    });

    if (checkins.length === 0) {
      await browser.close();
      return { status: 'no-dates' };
    }

    // Click check-in
    await page.evaluate((label) => {
      for (const td of document.querySelectorAll('td[role="button"]')) {
        if (td.getAttribute('aria-label') === label) { td.click(); return; }
      }
    }, checkins[0]);
    await sleep(2000);

    // Find checkout dates
    const checkouts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('td[role="button"]'))
        .filter(td => td.getAttribute('aria-disabled') !== 'true' && td.getAttribute('aria-label')?.includes('checkout'))
        .map(td => td.getAttribute('aria-label'))
        .slice(0, 5);
    });

    if (checkouts.length === 0) {
      await browser.close();
      return { status: 'no-checkout', checkin: checkins[0] };
    }

    // Click checkout
    await page.evaluate((label) => {
      for (const td of document.querySelectorAll('td[role="button"]')) {
        if (td.getAttribute('aria-label') === label) { td.click(); return; }
      }
    }, checkouts[0]);
    await sleep(6000);

    // Extract price from sidebar
    const priceInfo = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="book-it-hover-target"]');
      if (!sidebar) return null;
      
      const text = sidebar.innerText;
      const lines = text.split('\n');
      
      // Pattern: "$XXX for N night(s)"
      for (const line of lines) {
        const m = line.match(/\$([\d,]+)\s+for\s+(\d+)\s+night/);
        if (m) {
          return {
            perNight: Math.round(parseInt(m[1].replace(/,/g, '')) / parseInt(m[2])),
            total: parseInt(m[1].replace(/,/g, '')),
            nights: parseInt(m[2]),
            raw: line.trim(),
          };
        }
      }

      // Pattern: "$XXX" followed by "for 1 night" or "/ night"
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\$([\d,]+)$/);
        if (m) {
          const val = parseInt(m[1].replace(/,/g, ''));
          // Check next line for context
          const nextLine = lines[i + 1] || '';
          if (nextLine.includes('night')) {
            const nightMatch = nextLine.match(/(\d+)\s*night/);
            const n = nightMatch ? parseInt(nightMatch[1]) : 1;
            return { perNight: Math.round(val / n), total: val, nights: n, raw: `${lines[i]} ${nextLine}`.trim() };
          }
          // Just a standalone dollar amount — assume per night
          if (val >= 30 && val <= 3000) {
            return { perNight: val, total: val, nights: 1, raw: lines[i] };
          }
        }
      }

      return null;
    });

    await browser.close();
    return { status: 'ok', ...priceInfo, checkinLabel: checkins[0], checkoutLabel: checkouts[0] };

  } catch (e) {
    try { await browser.close(); } catch {}
    return { status: 'error', error: e.message };
  }
}

async function run() {
  console.log('=== Price Enrichment — Airbnb Calendar Selection ===\n');

  const res = await fetch(`${ADMIN_BASE}?limit=500&depth=0`, {
    headers: { 'Authorization': `users API-Key ${API_KEY}` },
  });
  const data = await res.json();

  const airbnbStays = data.docs
    .filter(s => extractRoomId(s.affiliateUrl) && s.platform === 'Airbnb')
    .map(s => ({ ...s, roomId: extractRoomId(s.affiliateUrl) }));

  console.log(`${airbnbStays.length} Airbnb stays to process\n`);

  const stats = { ok: 0, '404': 0, 'no-dates': 0, 'no-checkout': 0, 'no-calendar': 0, error: 0 };
  const updates = [];

  for (let i = 0; i < airbnbStays.length; i++) {
    const stay = airbnbStays[i];
    process.stdout.write(`[${i + 1}/${airbnbStays.length}] ${stay.roomId} "${stay.title?.substring(0, 35)}": `);

    const result = await getPriceForRoom(stay.roomId);
    stats[result.status] = (stats[result.status] || 0) + 1;

    if (result.status === 'ok' && result.perNight) {
      const changed = Math.abs(result.perNight - stay.price) > 10;
      console.log(`$${result.perNight}/night ($${result.total} × ${result.nights}n)${changed ? ' 🆕' : ' ='}`);
      
      if (changed) {
        await patch(stay.id, { price: result.perNight });
        updates.push({ roomId: stay.roomId, title: stay.title, old: stay.price, new: result.perNight });
      }
    } else {
      console.log(result.status + (result.error ? `: ${result.error.substring(0, 60)}` : ''));
    }

    await sleep(1500);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Total: ${airbnbStays.length}`);
  Object.entries(stats).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`\nUpdated: ${updates.length}`);
  updates.forEach(u => console.log(`  ${u.roomId}: $${u.old} → $${u.new} "${u.title?.substring(0, 40)}"`));
}

async function patch(id, fields) {
  await fetch(`${ADMIN_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `users API-Key ${API_KEY}`,
    },
    body: JSON.stringify(fields),
  });
}

run().catch(console.error);
