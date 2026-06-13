// Estimate prices for remaining $1 stays based on type, location, amenities
// Pricing model: base price by property type × state multiplier × amenity premium

const ADMIN_BASE = 'https://www.uniquestaysusa.com/api/stays';
const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';

// Base prices by property type keywords in title
const TYPE_BASE = {
  treehouse: 195,
  castle: 275,
  lighthouse: 225,
  dome: 165,
  'a-frame': 175,
  airstream: 125,
  skoolie: 85,
  bus: 75,
  camper: 80,
  'rv park': 60,
  rv: 85,
  cabin: 155,
  cottage: 145,
  tiny: 110,
  lodge: 195,
  farmhouse: 165,
  'log cabin': 140,
  bungalow: 135,
  shipping: 95,
  container: 95,
  glamping: 120,
  tent: 65,
  yurt: 95,
  tree: 185,
  mansion: 250,
  retreat: 175,
  estate: 225,
  villa: 275,
  houseboat: 185,
  boat: 145,
  cave: 175,
  silo: 145,
  barn: 135,
  chapel: 165,
  firetower: 165,
  tower: 175,
  windmill: 155,
  hobbit: 185,
  sphere: 195,
  cube: 145,
  school: 75,
  vintage: 95,
  retro: 90,
  homestead: 140,
  grainbin: 115,
};

// State multipliers (cost of living / tourism demand)
const STATE_MULT = {
  'California': 1.4, 'New York': 1.35, 'Washington': 1.2, 'Oregon': 1.15,
  'Colorado': 1.25, 'Hawaii': 1.5, 'Florida': 1.15, 'Nevada': 1.1,
  'Massachusetts': 1.3, 'Vermont': 1.2, 'Maine': 1.1, 'Tennessee': 0.9,
  'Georgia': 0.85, 'North Carolina': 0.9, 'Texas': 0.9, 'Arizona': 1.05,
  'Michigan': 0.8, 'Ohio': 0.75, 'Indiana': 0.75, 'Kentucky': 0.75,
  'Oklahoma': 0.7, 'West Virginia': 0.7, 'Arkansas': 0.7, 'Missouri': 0.75,
  'Mississippi': 0.7, 'Wisconsin': 0.8, 'Wyoming': 0.95, 'New Mexico': 0.85,
  'Virginia': 0.9, 'South Carolina': 0.85, 'Alabama': 0.7, 'Oregon': 1.15,
};

// Platform adjustment
const PLAT_MULT = { 'Airbnb': 1.0, 'VRBO': 1.05, 'Direct': 0.9 };

// Amenity premiums (additive)
const AMENITY_PREMIUMS = {
  'Hot Tub': 30, 'Pool': 40, 'Sauna': 25, 'Fireplace': 15,
  'Waterfront': 45, 'Lake': 30, 'River': 20, 'Beach': 40,
  'Mountain View': 20, 'Views': 15, 'Stargazing': 15,
};

function estimatePrice(stay) {
  const title = (stay.title || '').toLowerCase();
  const state = stay.state || '';
  const platform = stay.platform || 'Direct';
  
  // Find matching type
  let basePrice = 130; // default
  for (const [keyword, price] of Object.entries(TYPE_BASE)) {
    if (title.includes(keyword)) {
      basePrice = price;
      break;
    }
  }
  
  // If title doesn't match, check category name
  // (not available in depth=0, but we can check description/bestFor)
  const desc = (stay.description || '').toLowerCase();
  if (basePrice === 130) {
    for (const [keyword, price] of Object.entries(TYPE_BASE)) {
      if (desc.includes(keyword)) {
        basePrice = price;
        break;
      }
    }
  }
  
  // State multiplier
  const stateMult = STATE_MULT[state] || 1.0;
  
  // Platform multiplier
  const platMult = PLAT_MULT[platform] || 1.0;
  
  // Amenity premiums from tags
  let amenityPremium = 0;
  if (stay.tags) {
    for (const tag of stay.tags) {
      const tagName = tag.tag || tag;
      if (AMENITY_PREMIUMS[tagName]) amenityPremium += AMENITY_PREMIUMS[tagName];
    }
  }
  
  // Check description for premium amenities
  for (const [amenity, premium] of Object.entries(AMENITY_PREMIUMS)) {
    if (desc.includes(amenity.toLowerCase())) {
      amenityPremium += premium;
    }
  }
  
  // Hipcamp/Direct budget adjustment
  if (platform === 'Direct' && (title.includes('hipcamp') || title.includes('skoolie') || title.includes('bus'))) {
    basePrice = Math.min(basePrice, 85);
  }
  
  // RV park adjustment
  if (title.includes('rv park') || title.includes('camp')) {
    basePrice = Math.min(basePrice, 75);
  }
  
  let estimated = Math.round((basePrice * stateMult * platMult) + amenityPremium);
  
  // Round to nearest $5
  estimated = Math.round(estimated / 5) * 5;
  
  // Clamp
  estimated = Math.max(25, Math.min(estimated, 650));
  
  return estimated;
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

async function run() {
  // Get full data including tags and description for better estimates
  const listRes = await fetch(`${ADMIN_BASE}?where[price][equals]=1&limit=500`);
  const listData = await listRes.json();
  const stays = listData.docs;
  console.log(`${stays.length} stays to estimate\n`);

  let updated = 0;
  
  for (let i = 0; i < stays.length; i++) {
    const s = stays[i];
    const price = estimatePrice(s);
    const ok = await patch(s.id, { price });
    updated++;
    console.log(`[${i+1}/${stays.length}] ID ${s.id} ${String(s.platform).padEnd(7)} ${String(s.state).padEnd(20)} ${price}/night ${ok ? 'OK' : 'FAIL'} | ${s.title?.substring(0, 55)}`);
  }

  console.log(`\nUpdated: ${updated}/${stays.length}`);
}

run().catch(console.error);
