// Extract prices using Browserless /function endpoint with Puppeteer
const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';
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

const PUPPETEER_SCRIPT = `
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto(args.url, { waitUntil: 'networkidle2', timeout: 20000 });
await new Promise(r => setTimeout(r, 2000));

// Try multiple selectors for price
const price = await page.evaluate(() => {
  // Airbnb patterns
  const selectors = [
    '[data-testid="price-message"]',
    '[data-testid="book-it-default"] span',
    '.l1ix1ioj',
    'span._1y74fdj',
    '[itemprop="price"]',
    '.price',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent;
      const match = text.match(/\\$([\\d,]+)/);
      if (match) return parseInt(match[1].replace(',', ''));
    }
  }
  // Fallback: scan all text for dollar amounts near "night"
  const body = document.body.innerText;
  const m = body.match(/\\$([\\d,]{2,4})\\s*(?:\\/\\s*night|per\\s*night)/i);
  if (m) return parseInt(m[1].replace(',', ''));
  
  return null;
});

return { price };
`;

async function getPriceViaBrowserless(url) {
  const res = await fetch(`https://chrome.browserless.io/function?token=${BL_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: PUPPETEER_SCRIPT,
      context: { url },
    }),
  });
  if (!res.ok) return null;
  try {
    const data = await res.json();
    return data?.price || null;
  } catch {
    return null;
  }
}

// For direct/Hipcamp sites, try a simple fetch + regex
async function getDirectPrice(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const patterns = [
      /\$\s*(\d{2,4})\s*(?:per\s*night|\/\s*night)/i,
      /(?:from|starting)\s*(?:at\s*)?\$\s*(\d{2,4})/i,
      /(?:nightly\s*rate|rate)\s*:?\s*\$\s*(\d{2,4})/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) return parseInt(m[1]);
    }
    return null;
  } catch {
    return null;
  }
}

async function run() {
  const listRes = await fetch(`${ADMIN_BASE}?where[price][equals]=1&limit=500&depth=0`);
  const listData = await listRes.json();
  const stays = listData.docs.filter(s => s.affiliateUrl && !s.affiliateUrl.includes('/stays/'));
  console.log(`${stays.length} stays to price\n`);

  let enriched = 0;
  let noPrice = 0;

  for (let i = 0; i < stays.length; i++) {
    const s = stays[i];
    process.stdout.write(`[${i+1}/${stays.length}] ID ${s.id} ${s.platform} `);

    let price = null;
    
    if (s.platform === 'Airbnb' || s.platform === 'VRBO') {
      price = await getPriceViaBrowserless(s.affiliateUrl);
    } else {
      price = await getDirectPrice(s.affiliateUrl);
    }

    if (price && price >= 15 && price <= 3000) {
      const ok = await patch(s.id, { price });
      enriched++;
      console.log(`${price}/night ${ok ? 'OK' : 'FAIL'}`);
    } else {
      console.log(`no price${price ? ` (got ${price})` : ''}`);
      noPrice++;
    }

    await sleep(3000);
  }

  console.log(`\nEnriched: ${enriched}, No price: ${noPrice}`);
}

run().catch(console.error);
