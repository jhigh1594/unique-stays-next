const BASE = 'https://unique-stays-usa.vercel.app/api/stays';
const API_KEY = '4a46b8b5d09bebf8bec3238dbffebce514fe55af3798cca3';

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
