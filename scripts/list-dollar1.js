const BASE = 'https://unique-stays-usa.vercel.app/api/stays';
const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';

async function run() {
  const res = await fetch(`${BASE}?where[price][equals]=1&limit=500&depth=0`);
  const data = await res.json();
  const stays = data.docs;
  console.log(`Found ${stays.length} stays with price=1\n`);
  
  for (const s of stays) {
    console.log(`${s.id}|${s.platform}|${s.affiliateUrl}|${s.title}`);
  }
}

run();
