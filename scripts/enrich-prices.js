// Enrich $1 stays with real prices
// Strategy: fetch each listing URL, extract price from page content
// Rate limit: 2s between requests to be polite

const BASE = 'https://www.uniquestaysusa.com/api/stays';
const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';
const DELAY = 2000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractAirbnbPrice(html) {
  // Try multiple patterns for Airbnb pricing
  const patterns = [
    /\$(\d{1,4})\s*(?:per\s*night|\/night|\s*night)/i,
    /"price":\s*(\d{2,4})/,
    /"rate":\s*(\d{2,4})/,
    /nightly.*?\$(\d{1,4})/i,
    /\$(\d{1,4})\s*x\s*\d+\s*nights/i,
    /priceTotal.*?(\d{2,4})/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return parseInt(m[1]);
  }
  return null;
}

function extractVrboPrice(html) {
  const patterns = [
    /\$(\d{1,4})\s*(?:per\s*night|\/night|\s*night|total)/i,
    /"priceAmount":\s*"?(\d{2,4})"?/,
    /"nightlyPrice":\s*"?(\d{2,4})"?/,
    /nightly.*?\$(\d{1,4})/i,
    /\$(\d{1,4})\s*x\s*\d+/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return parseInt(m[1]);
  }
  return null;
}

function extractDirectPrice(html) {
  const patterns = [
    /\$(\d{1,4})\s*(?:per\s*night|\/night|\s*night)/i,
    /nightly.*?\$(\d{1,4})/i,
    /(\d{2,4})\s*(?:per\s*night|\/night)/i,
    /from\s*\$(\d{1,4})/i,
    /starting\s*at\s*\$?(\d{2,4})/i,
    /rates?\s*(?:from|start(?:ing)?\s*at)?\s*\$?(\d{2,4})/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return parseInt(m[1]);
  }
  return null;
}

async function fetchPrice(url, platform) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    if (platform === 'Airbnb') return extractAirbnbPrice(html);
    if (platform === 'VRBO') return extractVrboPrice(html);
    return extractDirectPrice(html);
  } catch (e) {
    return null;
  }
}

async function updatePrice(id, price) {
  const res = await fetch(`${ADMIN_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `users API-Key ${API_KEY}`,
    },
    body: JSON.stringify({ price }),
  });
  return res.ok;
}

async function run() {
  // Fetch all $1 stays
  const listRes = await fetch(`${BASE}?where[price][equals]=1&limit=500&depth=0`);
  const listData = await listRes.json();
  const stays = listData.docs;
  console.log(`Found ${stays.length} stays to enrich\n`);

  let enriched = 0;
  let failed = 0;
  let noPrice = 0;

  for (let i = 0; i < stays.length; i++) {
    const s = stays[i];
    const url = s.affiliateUrl;
    const platform = s.platform;
    
    process.stdout.write(`[${i+1}/${stays.length}] ID ${s.id} ${platform} `);
    
    const price = await fetchPrice(url, platform);
    
    if (price && price > 1 && price < 50000) {
      const ok = await updatePrice(s.id, price);
      if (ok) {
        enriched++;
        console.log(`→ $${price}/night ✓`);
      } else {
        failed++;
        console.log(`→ $${price}/night (update FAILED)`);
      }
    } else {
      noPrice++;
      console.log(`→ no price found`);
    }
    
    await sleep(DELAY);
  }

  console.log(`\n=== Results ===`);
  console.log(`Enriched: ${enriched}`);
  console.log(`No price found: ${noPrice}`);
  console.log(`Failed: ${failed}`);
}

run().catch(console.error);
