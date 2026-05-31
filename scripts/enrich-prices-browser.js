// Enrich $1 stays using Browserless for JS-rendered pages
const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '4a46b8b5d09bebf8bec3238dbffebce514fe55af3798cca3';
const BL_TOKEN = '2UTr21YzqiZEcVBf67740acb023d9657bcc7b9a3408d631a8';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

const controller = () => new AbortController();

async function fetchRendered(url) {
  const ac = controller();
  const timer = setTimeout(() => ac.abort(), 30000);
  try {
    const res = await fetch(`https://chrome.browserless.io/content?token=${BL_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/html' },
      body: JSON.stringify({ url }),
      signal: ac.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function extractPrice(html, platform) {
  // Generic patterns for all platforms
  const patterns = [
    /\$\s*(\d{2,4})\s*\/\s*night/i,
    /\$\s*(\d{2,4})\s*per\s*night/i,
    /\$\s*(\d{2,4})\s*(?:a|per)\s*night/i,
    /"nightlyPrice"\s*:\s*"?(\d{2,4})"?/,
    /"priceAmount"\s*:\s*"?(\d{2,4})"?/,
    /(?:from|starting)\s*(?:at\s*)?\$\s*(\d{2,4})/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return parseInt(m[1]);
  }
  return null;
}

async function run() {
  const listRes = await fetch(`${ADMIN_BASE}?where[price][equals]=1&limit=500&depth=0`);
  const listData = await listRes.json();
  const stays = listData.docs;
  console.log(`${stays.length} stays still need pricing\n`);

  let enriched = 0;
  let noPrice = 0;

  for (let i = 0; i < stays.length; i++) {
    const s = stays[i];
    const url = s.affiliateUrl;
    
    if (!url || url.includes('/stays/')) {
      console.log(`[${i+1}/${stays.length}] ID ${s.id} skip`);
      noPrice++;
      continue;
    }

    process.stdout.write(`[${i+1}/${stays.length}] ID ${s.id} ${s.platform} `);

    const html = await fetchRendered(url);
    if (!html) {
      console.log('fetch failed');
      noPrice++;
      await sleep(2000);
      continue;
    }

    const price = extractPrice(html, s.platform);
    if (price && price >= 15 && price <= 3000) {
      const ok = await patch(s.id, { price });
      enriched++;
      console.log(`$${price}/night ${ok ? 'OK' : 'FAIL'}`);
    } else {
      console.log(`no price`);
      noPrice++;
    }

    await sleep(3000);
  }

  console.log(`\nEnriched: ${enriched}, No price: ${noPrice}`);
}

run().catch(console.error);
