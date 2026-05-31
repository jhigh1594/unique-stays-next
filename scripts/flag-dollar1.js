const BASE = 'https://unique-stays-usa.vercel.app/api/stays';

async function run() {
  const res = await fetch(`${BASE}?where[price][equals]=1&limit=500&depth=0&select=id,slug`);
  const data = await res.json();
  const stays = data.docs;
  console.log(`Found ${stays.length} stays with price=1`);

  let updated = 0;
  let failed = 0;

  for (const s of stays) {
    try {
      const r = await fetch(`${BASE}/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsReview: true, reviewReason: 'Price is $1/night (default/placeholder) — needs real pricing' }),
      });
      if (r.ok) {
        updated++;
      } else {
        failed++;
        console.error(`FAIL [${s.id}]: ${r.status} ${await r.text()}`);
      }
    } catch (e) {
      failed++;
      console.error(`ERR [${s.id}]: ${e.message}`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed`);
}

run();
