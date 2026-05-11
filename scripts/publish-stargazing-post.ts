import http from 'http';

const API_KEY = process.env.PAYLOAD_ADMIN_API_KEY!;
const BASE = 'http://localhost:3000';

function request(method: string, path: string, body?: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `users API-Key ${API_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 120000,
    };

    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c: Buffer) => buf += c.toString());
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch { reject(new Error(`Parse error: ${buf.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

function text(content: string) {
  return { type: 'text', format: 0, style: '', mode: 'normal', text: content, detail: 0, version: 1 };
}
function para(content: string) {
  return { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, textStyle: '', children: [text(content)] };
}
function h2(content: string) {
  return { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(content)] };
}
function h3(content: string) {
  return { type: 'heading', tag: 'h3', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(content)] };
}
function embedBlock(stayId: number) {
  return { type: 'block', version: 2, fields: { id: crypto.randomUUID(), blockType: 'stayEmbed', stay: stayId } };
}
function boldPara(boldText: string, normalText: string) {
  return {
    type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, textStyle: '',
    children: [
      { type: 'text', format: 1, style: '', mode: 'normal', text: boldText, detail: 0, version: 1 },
      { type: 'text', format: 0, style: '', mode: 'normal', text: normalText, detail: 0, version: 1 },
    ]
  };
}
function linkPara(beforeText: string, linkText: string, linkUrl: string, afterText: string) {
  return {
    type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, textStyle: '',
    children: [
      text(beforeText),
      { type: 'link', format: '', version: 1, fields: { url: linkUrl, newTab: true }, children: [text(linkText)] },
      text(afterText),
    ]
  };
}

function hr() {
  return { type: 'horizontalrule', version: 1 };
}

async function main() {
  const linkedStays = [8, 12, 42, 29, 136, 102, 83, 10, 122, 151];

  const content = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        para('There is a specific kind of silence that only arrives when you look up and realize the sky has more lights than the ground. Not the faint wash of suburban constellations — the real thing. The Milky Way thick enough to cast a shadow. Jupiter bright enough to navigate by.'),

        para('Stargazing getaways are stays where the night sky is the primary amenity — places positioned under dark skies with architectural features designed to frame what happens after sunset. Domes with skylights over the bed. Treehouses with skydecks. Safari tents in DarkSky-certified resorts. The ten stays below span ten states and four regions, each chosen because the stars there are not an afterthought but the reason the place exists.'),

        // 1. Skydeck at Twenty Feet
        h2('Skydeck at Twenty Feet'),
        para('You climb the wooden stairs after dinner, the slats creaking underfoot, and push open the door to a skydeck that sits twenty feet above the Georgia forest floor. The valley unfolds below like black felt, and above — above is the whole show. Three hundred and thirteen guests have given this place five stars, and the consensus is the same: the skydeck changes the way you think about nighttime.'),
        embedBlock(8),
        para('Bide In The Trees sits outside Box Springs, Georgia, and the name is deliberate — "bide" is an old word for staying, for enduring. The treehouse itself is one of the most carefully crafted in the Southeast, but the skydeck is the reason you came. Two can sleep here. $315/night. 4.99 rating. The fall canopy turns golden, and the bare branches of winter open the sky even wider.'),

        // 2. Stargazing from Bed
        h2('Stargazing from Bed'),
        para('The Smoky Mountains have a way of collecting weather, and on clear nights the sky above Sylva, North Carolina, goes genuinely dark. The dome positions its skylight directly over the queen bed, so the last thing you see before sleep and the first thing you see on waking is open sky. No neck craning. No cold balcony. Just ceiling replaced by cosmos.'),
        embedBlock(12),
        para('Creek sounds run below the property, a low murmur that replaces whatever noise you carried in from the city. The private hot tub outside lets you soak while the stars come out. $225/night. 4.99 rating with 236 reviews. Fall is the season — the canopy turns gold and the air goes sharp and clear.'),

        // 3. The Purpose-Built Dome
        h2('The Purpose-Built Dome'),
        linkPara('Joshua Tree has been a stargazing destination for decades, and for good reason. The high desert sits above the light pollution of the Los Angeles basin, and the dry air holds almost no moisture to scatter starlight. This retreat takes that advantage and builds on it with a purpose-built stargazing dome — not a skylight or a clear panel, but an actual dome designed for watching the night sky. We covered other extraordinary properties in the area in our ', 'guide to the best unique stays in Joshua Tree', '/journal/best-unique-stays-joshua-tree', '.'),
        embedBlock(42),
        para('At $579/night it is the most expensive stay on this list, but it sleeps sixteen. That makes it a group proposition — split eight ways, you are each paying less than the treehouse in Arkansas. Fast WiFi, a pool and spa, mini golf. The kind of place where a group of friends can spend the day swimming and the night arguing about constellations. 4.96 rating. Joshua Tree, California.'),

        // 4. One of the Darkest Skies in the Southwest
        h2('One of the Darkest Skies in the Southwest'),
        para('Glendale, Utah, sits on the road between Zion and Bryce Canyon, in a stretch of the state where the nearest traffic light is an hour away. The geodesic dome here does not need to advertise its darkness — you feel it the moment you step outside after dinner and your eyes take fifteen minutes to fully adjust.'),
        embedBlock(29),
        para('The private sauna heats while the sun sets. The hot tub sits under open sky. The desert night goes quiet in a way that is almost physical — punctuated by the occasional owl or the distant call of a coyote. $295/night. 4.93 rating. 198 reviews. The owners call it "one of the darkest skies in the American Southwest," and they are not overselling.'),

        // 5. The Edge of Big Bend
        h2('The Edge of Big Bend'),
        para('West Texas is the dark sky capital of the United States. Big Bend National Park holds an International Dark Sky Park designation, and the land around it — Alpine, Marathon, Terlingua — shares the same quality of darkness. This glamping dome sits thirty minutes from the park entrance, positioned to face the open desert rather than any town.'),
        embedBlock(136),
        para('At $195/night and a 4.95 rating, it is the strongest value proposition on this list. The dome is plush — not roughing it, not glamping-theater, but genuinely comfortable furnishings positioned under genuinely extraordinary skies. Sleeps two. Alpine, Texas. Best in fall, when the desert heat breaks and the atmosphere stabilizes for razor-sharp viewing.'),

        // 6. A Clear Dome Beside Lake Superior
        h2('A Clear Dome Beside Lake Superior'),
        para('Bayfield, Wisconsin, sits on the south shore of Lake Superior, where the Apostle Islands National Lakeshore juts into the lake like a hand reaching for Canada. The air here is clean — the kind of clean that comes from having a Great Lake as your nearest neighbor and thousands of acres of national forest as your backyard.'),
        embedBlock(102),
        para('The twenty-foot Colorado yurt positions its clear dome directly over the queen bed. The setup is deceptively simple: you lie down, look up, and the stars are there. No app, no telescope, no planning. A short walk takes you to the Apostle Islands shoreline. Full private bathroom, fire pit, climate control. $125/night. 4.94 rating. 209 reviews. The lowest price on this list, and the access to Lake Superior makes the daytime hours as compelling as the nighttime ones.'),

        // 7. DarkSky Certified
        h2('DarkSky Certified'),
        para('There is a difference between "dark" and "certified dark." Under Canvas Moab holds a DarkSky certification — the only property on this list with that distinction — meaning the resort has met specific requirements for outdoor lighting, light pollution reduction, and sky quality monitoring. This is not marketing language. It is an internationally recognized standard.'),
        embedBlock(83),
        linkPara('The safari tents sit seven miles from Arches National Park, furnished with West Elm king beds and wood-burning stoves. At night, the campfire program includes s\'more and a docent-led sky tour. $349/night. 4.9 rating. 2,140 reviews — the most-reviewed property on this list by an order of magnitude. Sleeps four. Moab, Utah. For more Utah properties near national parks, see our ', 'national park alternatives guide', '/journal/skip-the-crowds-national-park-alternatives', '.'),

        // 8. The Planetarium in the Trees
        h2('The Planetarium in the Trees'),
        para('One of one hundred winners of Airbnb\'s worldwide OMG Fund — a contest that received over forty thousand entries. The treehouse near Beaver Lake in Springdale, Arkansas, was selected because its builder embedded a working planetarium into the treehouse structure itself. Not a skylight. A planetarium. The ceiling displays celestial maps, and the design orients the entire space upward.'),
        embedBlock(10),
        para('Beaver Lake sits below, visible through the trees, the water catching moonlight on clear nights. $255/night. 4.94 rating. 138 reviews. The OMG Fund designation is the specific detail here — this is not a treehouse with a stargazing feature added later. It was designed from the ground up as a place to watch the sky, built into a tree.'),

        // 9. Blue Ridge Dark
        h2('Blue Ridge Dark'),
        para('The Virginia Highlands near Abingdon sit at enough elevation and enough distance from major metro areas to produce genuinely dark skies. The Appalachian chain here runs northeast-southwest, and the valleys between ridges create natural light barriers that protect the overhead sky from the nearest towns.'),
        embedBlock(122),
        para('The A-frame frames its panoramic lake and mountain views through floor-to-ceiling glass, and at night those same windows become a frame for the sky. The Virginia Creeper Trail runs nearby. Mount Rogers National Recreation Area is close enough for a day hike. $178/night. 4.94 rating. Sleeps four. The best value for a group or family on this list.'),

        // 10. The Silo Between Crater Lake and Bend
        h2('The Silo Between Crater Lake and Bend'),
        para('La Pine, Oregon, sits in the rain shadow of the Cascades, between Crater Lake to the south and Bend to the north. The high desert here is dry, sparsely populated, and surrounded by ponderosa pine forest — three conditions that produce reliable darkness. The converted farm silo sits on a working tree farm, circular walls curving around a single intimate room.'),
        embedBlock(151),
        para('Starlink WiFi keeps you connected if you need it, but the draw here is disconnection — the high desert silence, the ponderosas creaking in the wind, the circular architecture that makes you feel like you are sleeping inside a telescope. $155/night. 4.88 rating. 143 reviews. The most architecturally unusual stay on this list.'),

        // How Dark Is Dark Enough
        h2('How Dark Is Dark Enough'),
        para('Not all dark skies are equal. The Bortle scale ranks sky brightness from Class 1 (pristine dark, the Milky Way casts shadows) to Class 9 (inner city, maybe a dozen stars visible). The stays above range from Bortle 1-2 in West Texas and southern Utah to Bortle 3-4 in Georgia and North Carolina. All of them will show you the Milky Way on a clear, moonless night. The certified DarkSky resort in Moab sits at roughly Bortle 2.'),
        boldPara('When to go: ', 'New moon weekends give the darkest skies. The week around a full moon is beautiful but washes out fainter stars. Summer (June-August) gives the best Milky Way viewing in the Northern Hemisphere, with the galactic core visible from roughly 10pm to 2am. Fall and winter offer sharper atmospheric conditions but shorter viewing windows.'),
        boldPara('What you actually need: ', 'Nothing. The stays on this list are designed for naked-eye viewing — no telescope required. If you want to go deeper, a pair of 7x50 or 10x50 binoculars will reveal Jupiter\'s moons and the Andromeda galaxy for under $100. The DarkSky Association keeps a map of certified sites at darksky.org.'),
        boldPara('For couples: ', 'The Romantic Mountain Dome in North Carolina and the Big Bend Dome in Texas are built for two.'),
        boldPara('For groups: ', 'The Joshua Tree retreat sleeps sixteen. Under Canvas Moab is designed for four.'),
        boldPara('For budget: ', 'Turtle Yurts in Wisconsin at $125/night and the Stargazer A-Frame in Virginia at $178/night deliver dark skies at the lowest price points.'),
        boldPara('For architecture: ', 'The Planetarium Treehouse in Arkansas and the Rustic Silo in Oregon are the stays that will make your friends ask where you found them.'),

        // FAQ
        h2('Frequently Asked Questions'),

        h3('Where are the darkest skies in the United States?'),
        para('West Texas (Big Bend region), southern Utah, and the high desert of eastern Oregon hold the consistently darkest skies in the lower forty-eight. Big Bend National Park is an International Dark Sky Park. The region around Glendale, Utah — between Zion and Bryce Canyon — offers similar darkness with more lodging options.'),

        h3('Can you see the Milky Way from an Airbnb or glamping stay?'),
        para('Yes — the stays in this collection are specifically chosen for Milky Way visibility on clear, moonless nights. The domes in Joshua Tree, the glamping dome near Big Bend, and the Desert Dome in Utah all sit under skies where the Milky Way is visible to the naked eye as a bright, textured band across the sky.'),

        h3('What is the Bortle scale and why does it matter for stargazing cabins?'),
        para('The Bortle scale measures night sky brightness from Class 1 (the darkest possible) to Class 9 (inner city). For stargazing, Bortle 1-3 will show the Milky Way clearly. The Under Canvas Moab resort, a DarkSky-certified property, sits around Bortle 2 — meaning the Milky Way is bright enough to cast faint shadows on the ground.'),

        h3('When is the best time to go stargazing at a cabin or dome?'),
        para('New moon weekends between June and August offer the best Milky Way viewing in the Northern Hemisphere. The galactic core is visible from roughly 10pm to 2am during those months. Fall and winter produce sharper stars due to lower atmospheric moisture, but the viewing window is shorter.'),

        h3('How much does a dark sky glamping stay cost?'),
        para('The stays in this collection range from $125/night (Turtle Yurts in Wisconsin) to $579/night (the Joshua Tree group retreat). The median price is around $260/night. Several stays under $200/night — including the Big Bend dome at $195 and the Virginia A-frame at $178 — sit under genuinely dark skies.'),
      ]
    }
  };

  // Step 1: Create the post
  console.log('Creating blog post...');
  const post = await request('POST', '/api/blog-posts', {
    slug: 'stargazing-getaways-dark-sky-unique-stays',
    title: 'Stargazing Getaways: 10 Dark Sky Unique Stays for Milky Way Views',
    subtitle: 'From certified dark sky resorts to treehouses built for watching the stars',
    excerpt: 'Ten places where the night sky is the main event — domes, treehouses, and safari tents positioned under some of the darkest skies in America.',
    metaTitle: 'Stargazing Getaways: Dark Sky Unique Stays',
    metaDescription: 'Ten stargazing cabins and dark sky glamping stays across America — from certified DarkSky resorts to treehouses with built-in planetariums.',
    status: 'published',
    publishedAt: new Date().toISOString(),
    linkedStays,
  });

  console.log('Post created:', post.id, post.slug);

  // Step 2: Update content
  console.log('Updating content with Lexical JSON...');
  const updated = await request('PATCH', `/api/blog-posts/${post.id}`, { content });
  console.log('Content updated:', updated.id);

  // Step 3: Verify
  const verified = await request('GET', `/api/blog-posts?where[slug][equals]=stargazing-getaways-dark-sky-unique-stays&depth=1&limit=1`);
  console.log('Verified:', verified.docs[0]?.id, verified.docs[0]?.status, verified.docs[0]?.slug);
}

main().catch(e => { console.error(e); process.exit(1); });
