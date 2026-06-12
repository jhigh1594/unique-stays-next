// Publish romantic cabin getaways via REST API
const API_KEY = '1e3398df-433c-4019-8971-8eb0c067149d';
const BASE = 'https://www.uniquestaysusa.com/api';
const headers = {
  'Authorization': `users API-Key ${API_KEY}`,
  'Content-Type': 'application/json',
};

const STAY_IDS = [373, 368, 367, 372, 202, 279, 193, 282];

function t(s) { return { type:'text', text:s, format:0, style:'', mode:'normal', detail:0, version:1 }; }
function b(s) { return { type:'text', text:s, format:1, style:'', mode:'normal', detail:0, version:1 }; }
function p(...c) { return { type:'paragraph', format:'', indent:0, version:1, direction:'ltr', textFormat:0, textStyle:'', children:c.length?c:[t('')] }; }
function h2(s) { return { type:'heading', tag:'h2', format:'', indent:0, version:1, direction:'ltr', children:[t(s)] }; }
function embed(id) { return { type:'block', version:2, fields:{ id:crypto.randomUUID(), blockType:'stayEmbed', stay:id } }; }
function hr() { return { type:'horizontalrule', version:1 }; }
function lnk(url,txt,opts={}) {
  const c = [];
  if(opts.before) c.push(t(opts.before));
  c.push({ type:'link', format:'', version:1, fields:{url,newTab:true,linkType:'custom'}, children:[t(txt)] });
  if(opts.after) c.push(t(opts.after));
  return c;
}

const content = { root: { type:'root', format:'', indent:0, version:1, direction:'ltr', children: [
  p(t('The best trips for two share a quality that is difficult to name but easy to recognize. It has something to do with the scale of the room. A place built for two carries a different weight than a place built for ten where two happen to be staying. The fire pit is the right distance from the bed. The deck faces the right way at the right hour. The silence between you and the other person feels like a feature, not a flaw.')),
  p(t('Romantic cabin getaways work when the stay itself does half the work. Not because the property is swooning on your behalf, but because the architecture, the setting, and the distance from routine combine to create a room where the conversation changes. The eight stays below were selected for one reason: each was built with couples in mind, and the reviews confirm that the intention translated.')),
  p(t('Every property sleeps two to four, holds a guest rating of 4.94 or higher, and sits in a state that requires at least a small journey to reach. Prices range from $125 to $395 per night. The geography spans Missouri, North Carolina, Texas, Georgia, Vermont, Wisconsin, California, and Colorado.')),
  hr(),
  h2('The Perfect Score'),
  p(b('BaseCamp TreeLoft, Perryville, Missouri')),
  p(t('Six hundred and ninety-two reviews. A 5.0 rating. Not 4.9. Not 4.95. Five point zero. In a world where a single bad night can drag a rating down for months, this number is statistically aggressive. It means the hot tub works every time. The string lights come on. The treehouse is clean, the woods are quiet, and the host has solved problems that most hosts do not know exist yet.')),
  p(...lnk('/journal/extraordinary-treehouses-america','guide to the most extraordinary treehouses in America',{before:'We covered more of the country\'s best treehouses in our ',after:'.'})),
  p(t('The TreeLoft is the first of two treehouses at BaseCamp, designed for what the listing calls "cozy seclusion, romance, and rest." Missouri forest outside. One bedroom, one bathroom, two guests maximum. $245/night. The private hot tub and the fairy-lit deck are the features that show up in every review, but the real asset is execution: 692 guests walked in and 692 guests left satisfied enough to say so. That consistency is rarer than a waterfall view.')),
  embed(373),
  hr(),
  h2('Stargazing from Bed'),
  p(b('Romantic Mountain Escape Dome, Sylva, North Carolina')),
  p(t('The skylight is positioned directly over the queen bed. Not beside it. Not in the living area. Over the bed. The last thing you see before sleep is open sky over the Smoky Mountains. The first thing you see on waking is whatever weather the mountains decided to deliver overnight. The creek runs below the property, audible but not loud, a low murmur that replaces whatever noise you carried in from wherever you came from.')),
  p(t('The private hot tub faces the mountain views. Sylva, the nearest town, is small and walkable. Harrah\'s Cherokee Casino is close enough for an evening out, but the dome\'s design makes leaving feel like a compromise. $225/night. 4.99 rating across 236 reviews. The tagline says "stargazing from bed" and means it literally. Fall is the season: the canopy turns gold, the air sharpens, and the skylight frames color during the day and stars at night.')),
  embed(368),
  hr(),
  h2('The First Luxury Dome in DFW'),
  p(b('SkyDome Hideaway, Gainesville, Texas')),
  p(t('The first luxury geodesic dome in the Dallas-Fort Worth area, and the tag matters because it explains the review count. Four hundred and twenty-nine guests have stayed here because the option did not exist before. DFW is one of the largest metro areas in the country, and until this dome opened, a weekend getaway that was both romantic and architecturally interesting required a four-hour drive. Now it requires one.')),
  p(t('The dome sits on a hill among oak trees with a hot tub and an outdoor shower. $275/night. 4.98 rating. The description names couples and honeymooners specifically, and the layout delivers: one bedroom, one bathroom, two guests. Gainesville is an hour from DFW, far enough to feel like departure, close enough to leave after work on a Friday and arrive before the sun sets.')),
  embed(367),
  hr(),
  h2('Twenty Feet in the Air'),
  p(b('Bide In The Trees, Box Springs, Georgia')),
  p(t('The skydeck sits twenty feet above the Georgia forest floor. You climb wooden stairs after dinner, push open the door, and the valley unfolds below like black felt. The name is deliberate: "bide" is an old word for staying, for enduring. The treehouse is one of the most carefully crafted in the Southeast, and 313 guests at 4.99 stars confirm it.')),
  p(...lnk('/journal/stargazing-getaways-dark-sky-unique-stays','stargazing getaways guide',{before:'For more stays where the night sky is the main event, our ',after:' covers domes, treehouses, and safari tents under the darkest skies in America.'})),
  p(t('This is a treehouse that takes itself seriously as architecture without becoming precious. Luxury amenities, but not luxury theater. The skydeck is the reason you came. Two guests, one bedroom, $315/night. The fall canopy turns golden and the bare branches of winter open the sky wider. Spring works too: the forest greens in stages, and the deck becomes a room with a living ceiling.')),
  embed(372),
  hr(),
  h2('The Most-Wishlisted Tiny Home in Vermont'),
  p(b('Luxury Glass Tiny House, Warren, Vermont')),
  p(t('Two hundred square feet. Built in Estonia. Shipped across the Atlantic. Assembled on a hillside with panoramic views of Sugarbush Mountain and Blueberry Lake. The mirrored glass exterior reflects the Vermont landscape so completely that the structure nearly disappears into the hillside during the day. At night, the interior glows from within. It is, by a meaningful margin, the most-wishlisted tiny home in Vermont.')),
  p(t('The hot tub faces the mountain. The Scandinavian design is warm without trying. $325/night. 4.99 rating across 312 reviews. Two guests, one bedroom. Warren is a ski town that keeps its charm in summer, and the property sits close enough to trails and swimming holes that the days fill without planning. The scale of the space, 200 square feet for two people, turns out to be the right amount. Any larger and it would be a rental. At this size, it is a room you share with intention.')),
  embed(202),
  hr(),
  h2('The Budget Play on Lake Superior'),
  p(b('Turtle Yurts, Bayfield, Wisconsin')),
  p(t('At $125/night, this is the lowest price on this list by a significant margin, and the quality does not reflect the discount. A twenty-foot Colorado yurt with a clear dome positioned over the queen bed. You lie down, look up, and the stars are there. Full private bathroom, climate control, fire pit. A short walk to the Apostle Islands National Lakeshore.')),
  p(t('Bayfield sits on the south shore of Lake Superior, where the air comes clean off the water and the nearest traffic light is a memory. 4.94 rating across 209 reviews. The yurt is deceptively simple: it does not need to be complicated when the lake and the sky do most of the work. Summer is the season, when Lake Superior warms enough to swim and the Apostle Islands ferry runs regular routes. Fall is quieter and colder and the colors make you forget the temperature.')),
  embed(279),
  hr(),
  h2('Floating on Richardson Bay'),
  p(b('Little Lux Floating Home, Sausalito, California')),
  p(t('Sausalito\'s floating homes are a documented architectural subculture: houses built on pontoons, moored in marinas, bobbing gently with the tide. This one has a luminous one-bedroom interior with sweeping San Francisco skyline views across Richardson Bay. The Golden Gate Bridge is minutes away by car or bike. The Bay lights up at night in a way that no mountain or forest view can replicate.')),
  p(t('The floating home is the only stay on this list that does not involve trees, mountains, or dirt roads. It is the urban answer to the romantic cabin question. $395/night. 4.98 rating across 210 reviews. Two guests, one bedroom, one bathroom. The experience of waking up on water, in a house that moves slightly with the current, within sight of one of the most photographed skylines in the world, is the specific detail. No other stay on this list can claim it.')),
  embed(193),
  hr(),
  h2('The Farm Yurt in the Rockies'),
  p(b('Dreamy Colorado Farm Yurt, Steamboat Springs, Colorado')),
  p(t('Featured as one of the 23 best glamping spots in the United States. The yurt sits on a working farm in the Colorado Rockies near Steamboat Springs, which means mornings include mountain air, farm sounds, and the particular quiet of a valley that produces hay and not much else. The description calls it "authentically intimate" and the phrasing is more precise than marketing language usually manages.')),
  p(...lnk('/journal/glamping-for-beginners','beginner\'s guide',{before:'For more on the glamping spectrum, our ',after:' covers seven stay types across seven states.'})),
  p(t('$145/night. 4.97 rating across 312 reviews. One bedroom, sleeps four but built for couples. Steamboat Springs is a real mountain town, not a resort fabrication, and the farm setting means you get the Rockies without the resort pricing. The yurt has a wood-burning stove for cold nights and a deck for warm ones. The combination of farm rhythm and mountain scale is unusual, and it works because the property does not try to be both a farm and a resort. It is a farm that happens to sit in one of the most scenic valleys in Colorado.')),
  embed(282),
  hr(),
  h2('How to Choose'),
  p(t('For the highest-reviewed stay on this list: BaseCamp TreeLoft in Missouri. A 5.0 across 692 reviews is not normal.')),
  p(t('For stargazing from bed: the Smoky Mountain dome in North Carolina or the Lake Superior yurt in Wisconsin.')),
  p(t('For the most unusual architecture: the Vermont glass tiny home or the Sausalito floating home.')),
  p(t('For budget: Turtle Yurts at $125/night or the Colorado farm yurt at $145/night. Both deliver quality that exceeds the price.')),
  p(t('For proximity to a major city: the SkyDome in Texas, an hour from DFW, or the floating home in Sausalito, twenty minutes from San Francisco.')),
  p(t('Book around the lunar calendar if stargazing matters. New moon weekends give the darkest skies. Summer gives the longest days. Fall gives the sharpest colors. Winter gives the quietest stays, and lower rates to match.')),
  hr(),
  h2('Frequently Asked Questions'),
  p(b('What makes a cabin romantic?'),t(' Scale matters more than square footage. A place built for two carries a different energy than a place built for ten where two happen to be staying. The stays in this guide sleep two to four, have one bedroom, and were designed with couples as the primary audience.')),
  p(b('How much does a romantic cabin getaway cost?'),t(' The stays in this guide range from $125/night (Turtle Yurts in Wisconsin) to $395/night (the Sausalito floating home). The median is around $250/night. Four of the eight stays are under $250.')),
  p(b('What is the best time of year for a couples cabin trip?'),t(' Fall (September through November) gives the strongest visual experience across most of these locations. Summer gives the longest days and the warmest evenings. Winter gives the quietest stays and often lower rates. Spring is the booking sweet spot: moderate prices, moderate crowds, and the landscape returning to green.')),
  p(b('Are these stays suitable for honeymoons?'),t(' Several listings, including the SkyDome in Texas and the Glass Tiny Home in Vermont, name honeymooners in their descriptions. All eight have ratings above 4.94, which suggests the experience matches the expectation. Book early for peak season.')),
  p(b('Can you drive to these romantic stays?'),t(' All eight are accessible by car. The most remote is the Wisconsin yurt, which requires a drive to Bayfield on the south shore of Lake Superior. The most accessible is the Texas dome, one hour from the Dallas-Fort Worth metro area.')),
  hr(),
  p(t('All stays above have been reviewed for valid booking links and current availability. Prices reflect nightly rates and may vary by season. We earn a commission on bookings made through affiliate links at no additional cost to you.')),
]}};

const postData = {
  title: 'Romantic Cabin Getaways: Unique Stays Built for Two',
  subtitle: 'Eight couples-forward stays across eight states, from a Missouri treehouse with a perfect rating to a floating home on San Francisco Bay',
  slug: 'romantic-cabin-getaways-couples',
  excerpt: 'From a 692-review treehouse in Missouri to a mirrored glass tiny home in Vermont, eight unique stays designed for couples who want something the resort down the road cannot provide.',
  linkedStays: STAY_IDS,
  metaTitle: 'Romantic Cabin Getaways for Couples | UniqueStaysUSA',
  metaDescription: 'Eight romantic cabin getaways across America, from Missouri treehouses to Vermont glass homes. All built for two, all rated 4.94 or higher.',
  status: 'published',
  publishedAt: '2026-06-12T06:00:00.000Z',
};

async function main() {
  // Check existing
  console.log('Checking for existing post...');
  const checkRes = await fetch(`${BASE}/blog-posts?where[slug][equals]=${postData.slug}&depth=0&limit=1`, { headers });
  const check = await checkRes.json();
  let postId;

  if (check.totalDocs > 0) {
    postId = check.docs[0].id;
    console.log(`Post exists: id=${postId}`);
  } else {
    // Create
    console.log('Creating post...');
    const createRes = await fetch(`${BASE}/blog-posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData),
    });
    const created = await createRes.json();
    if (created.errors) { console.error('Create errors:', JSON.stringify(created.errors)); process.exit(1); }
    postId = created.doc?.id || created.id;
    console.log(`Created: id=${postId}`);
  }

  // Update metadata
  console.log('Updating metadata...');
  const updateRes = await fetch(`${BASE}/blog-posts/${postId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(postData),
  });
  const updated = await updateRes.json();
  console.log('Metadata updated');

  // Update content
  console.log('Updating content...');
  const contentRes = await fetch(`${BASE}/blog-posts/${postId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ content }),
  });
  const contentResult = await contentRes.json();
  if (contentResult.errors) { console.error('Content errors:', JSON.stringify(contentResult.errors)); process.exit(1); }
  console.log('Content updated');

  // Verify
  console.log('Verifying...');
  const verifyRes = await fetch(`${BASE}/blog-posts?where[slug][equals]=${postData.slug}&depth=1&limit=1`, { headers });
  const verify = await verifyRes.json();
  const v = verify.docs[0];
  console.log(`Verified: "${v.title}" | status=${v.status} | linkedStays=${v.linkedStays?.length || 0}`);
  console.log(`Post ID: ${v.id}`);
  console.log(`URL: https://www.uniquestaysusa.com/journal/${postData.slug}`);
}

main().catch(e => { console.error(e); process.exit(1); });
