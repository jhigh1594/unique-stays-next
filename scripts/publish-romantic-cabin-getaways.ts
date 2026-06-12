// Publish "Romantic Cabin Getaways for Couples" article to Payload CMS
// Run: pnpm exec tsx --env-file=.env.local scripts/publish-romantic-cabin-getaways.ts

import { getPayload } from 'payload'
import config from '@payload-config'

const POST_SLUG = 'romantic-cabin-getaways-couples'
const HERO_IMAGE_URL = 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/stays/basecamp-treeloft-mo.jpeg'

const STAY_MAP: Record<string, number> = {
  'basecamp-treeloft-mo': 373,
  'romantic-mountain-dome-nc': 368,
  'skydome-hideaway-tx': 367,
  'bide-in-trees-skydeck-ga': 372,
  'glass-tiny-warren-vt': 202,
  'turtle-yurts-bayfield-wi': 279,
  'sausalito-floating-home-ca': 193,
  'dreamy-yurt-steamboat-co': 282,
}

const LINKED_STAY_IDS = Object.values(STAY_MAP)

function text(t: string) {
  return { type: 'text', text: t, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }
}
function bold(t: string) {
  return { type: 'text', text: t, format: 1, style: '', mode: 'normal', detail: 0, version: 1 }
}
function para(...children: any[]) {
  return {
    type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
    textFormat: 0, textStyle: '',
    children: children.length ? children : [text('')],
  }
}
function h2(t: string) {
  return {
    type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr',
    children: [text(t)],
  }
}
function embedBlock(stayId: number) {
  return {
    type: 'block', version: 2,
    fields: { id: crypto.randomUUID(), blockType: 'stayEmbed', stay: stayId },
  }
}
function hr() {
  return { type: 'horizontalrule', version: 1 }
}
function linkNode(url: string, linkText: string, surrounding?: { before?: string; after?: string }) {
  const children: any[] = []
  if (surrounding?.before) children.push(text(surrounding.before))
  children.push({
    type: 'link', format: '', version: 1,
    fields: { url, newTab: true, linkType: 'custom' },
    children: [text(linkText)],
  })
  if (surrounding?.after) children.push(text(surrounding.after))
  return children
}

const content = {
  root: {
    type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
    children: [
      para(text('The best trips for two share a quality that is difficult to name but easy to recognize. It has something to do with the scale of the room. A place built for two carries a different weight than a place built for ten where two happen to be staying. The fire pit is the right distance from the bed. The deck faces the right way at the right hour. The silence between you and the other person feels like a feature, not a flaw.')),
      para(text('Romantic cabin getaways work when the stay itself does half the work. Not because the property is swooning on your behalf, but because the architecture, the setting, and the distance from routine combine to create a room where the conversation changes. The eight stays below were selected for one reason: each was built with couples in mind, and the reviews confirm that the intention translated.')),
      para(text('Every property sleeps two to four, holds a guest rating of 4.94 or higher, and sits in a state that requires at least a small journey to reach. Prices range from $125 to $395 per night. The geography spans Missouri, North Carolina, Texas, Georgia, Vermont, Wisconsin, California, and Colorado.')),

      hr(),
      h2('The Perfect Score'),
      para(bold('BaseCamp TreeLoft, Perryville, Missouri')),
      para(text('Six hundred and ninety-two reviews. A 5.0 rating. Not 4.9. Not 4.95. Five point zero. In a world where a single bad night can drag a rating down for months, this number is statistically aggressive. It means the hot tub works every time. The string lights come on. The treehouse is clean, the woods are quiet, and the host has solved problems that most hosts do not know exist yet.')),
      para(...linkNode('/journal/extraordinary-treehouses-america', 'guide to the most extraordinary treehouses in America', { before: 'We covered more of the country\'s best treehouses in our ', after: '.' })),
      para(text('The TreeLoft is the first of two treehouses at BaseCamp, designed for what the listing calls "cozy seclusion, romance, and rest." Missouri forest outside. One bedroom, one bathroom, two guests maximum. $245/night. The private hot tub and the fairy-lit deck are the features that show up in every review, but the real asset is execution: 692 guests walked in and 692 guests left satisfied enough to say so. That consistency is rarer than a waterfall view.')),
      para(text('[Stay embed: basecamp-treeloft-mo]')),
      embedBlock(STAY_MAP['basecamp-treeloft-mo']),

      hr(),
      h2('Stargazing from Bed'),
      para(bold('Romantic Mountain Escape Dome, Sylva, North Carolina')),
      para(text('The skylight is positioned directly over the queen bed. Not beside it. Not in the living area. Over the bed. The last thing you see before sleep is open sky over the Smoky Mountains. The first thing you see on waking is whatever weather the mountains decided to deliver overnight. The creek runs below the property, audible but not loud, a low murmur that replaces whatever noise you carried in from wherever you came from.')),
      para(text('The private hot tub faces the mountain views. Sylva, the nearest town, is small and walkable. Harrah\'s Cherokee Casino is close enough for an evening out, but the dome\'s design makes leaving feel like a compromise. $225/night. 4.99 rating across 236 reviews. The tagline says "stargazing from bed" and means it literally. Fall is the season: the canopy turns gold, the air sharpens, and the skylight frames color during the day and stars at night.')),
      para(text('[Stay embed: romantic-mountain-dome-nc]')),
      embedBlock(STAY_MAP['romantic-mountain-dome-nc']),

      hr(),
      h2('The First Luxury Dome in DFW'),
      para(bold('SkyDome Hideaway, Gainesville, Texas')),
      para(text('The first luxury geodesic dome in the Dallas-Fort Worth area, and the tag matters because it explains the review count. Four hundred and twenty-nine guests have stayed here because the option did not exist before. DFW is one of the largest metro areas in the country, and until this dome opened, a weekend getaway that was both romantic and architecturally interesting required a four-hour drive. Now it requires one.')),
      para(text('The dome sits on a hill among oak trees with a hot tub and an outdoor shower. $275/night. 4.98 rating. The description names couples and honeymooners specifically, and the layout delivers: one bedroom, one bathroom, two guests. Gainesville is an hour from DFW, far enough to feel like departure, close enough to leave after work on a Friday and arrive before the sun sets.')),
      para(text('[Stay embed: skydome-hideaway-tx]')),
      embedBlock(STAY_MAP['skydome-hideaway-tx']),

      hr(),
      h2('Twenty Feet in the Air'),
      para(bold('Bide In The Trees, Box Springs, Georgia')),
      para(text('The skydeck sits twenty feet above the Georgia forest floor. You climb wooden stairs after dinner, push open the door, and the valley unfolds below like black felt. The name is deliberate: "bide" is an old word for staying, for enduring. The treehouse is one of the most carefully crafted in the Southeast, and 313 guests at 4.99 stars confirm it.')),
      para(...linkNode('/journal/stargazing-getaways-dark-sky-unique-stays', 'stargazing getaways guide', { before: 'For more stays where the night sky is the main event, our ', after: ' covers domes, treehouses, and safari tents under the darkest skies in America.' })),
      para(text('This is a treehouse that takes itself seriously as architecture without becoming precious. Luxury amenities, but not luxury theater. The skydeck is the reason you came. Two guests, one bedroom, $315/night. The fall canopy turns golden and the bare branches of winter open the sky wider. Spring works too: the forest greens in stages, and the deck becomes a room with a living ceiling.')),
      para(text('[Stay embed: bide-in-trees-skydeck-ga]')),
      embedBlock(STAY_MAP['bide-in-trees-skydeck-ga']),

      hr(),
      h2('The Most-Wishlisted Tiny Home in Vermont'),
      para(bold('Luxury Glass Tiny House, Warren, Vermont')),
      para(text('Two hundred square feet. Built in Estonia. Shipped across the Atlantic. Assembled on a hillside with panoramic views of Sugarbush Mountain and Blueberry Lake. The mirrored glass exterior reflects the Vermont landscape so completely that the structure nearly disappears into the hillside during the day. At night, the interior glows from within. It is, by a meaningful margin, the most-wishlisted tiny home in Vermont.')),
      para(text('The hot tub faces the mountain. The Scandinavian design is warm without trying. $325/night. 4.99 rating across 312 reviews. Two guests, one bedroom. Warren is a ski town that keeps its charm in summer, and the property sits close enough to trails and swimming holes that the days fill without planning. The scale of the space, 200 square feet for two people, turns out to be the right amount. Any larger and it would be a rental. At this size, it is a room you share with intention.')),
      para(text('[Stay embed: glass-tiny-warren-vt]')),
      embedBlock(STAY_MAP['glass-tiny-warren-vt']),

      hr(),
      h2('The Budget Play on Lake Superior'),
      para(bold('Turtle Yurts, Bayfield, Wisconsin')),
      para(text('At $125/night, this is the lowest price on this list by a significant margin, and the quality does not reflect the discount. A twenty-foot Colorado yurt with a clear dome positioned over the queen bed. You lie down, look up, and the stars are there. Full private bathroom, climate control, fire pit. A short walk to the Apostle Islands National Lakeshore.')),
      para(text('Bayfield sits on the south shore of Lake Superior, where the air comes clean off the water and the nearest traffic light is a memory. 4.94 rating across 209 reviews. The yurt is deceptively simple: it does not need to be complicated when the lake and the sky do most of the work. Summer is the season, when Lake Superior warms enough to swim and the Apostle Islands ferry runs regular routes. Fall is quieter and colder and the colors make you forget the temperature.')),
      para(text('[Stay embed: turtle-yurts-bayfield-wi]')),
      embedBlock(STAY_MAP['turtle-yurts-bayfield-wi']),

      hr(),
      h2('Floating on Richardson Bay'),
      para(bold('Little Lux Floating Home, Sausalito, California')),
      para(text('Sausalito\'s floating homes are a documented architectural subculture: houses built on pontoons, moored in marinas, bobbing gently with the tide. This one has a luminous one-bedroom interior with sweeping San Francisco skyline views across Richardson Bay. The Golden Gate Bridge is minutes away by car or bike. The Bay lights up at night in a way that no mountain or forest view can replicate.')),
      para(text('The floating home is the only stay on this list that does not involve trees, mountains, or dirt roads. It is the urban answer to the romantic cabin question. $395/night. 4.98 rating across 210 reviews. Two guests, one bedroom, one bathroom. The experience of waking up on water, in a house that moves slightly with the current, within sight of one of the most photographed skylines in the world, is the specific detail. No other stay on this list can claim it.')),
      para(text('[Stay embed: sausalito-floating-home-ca]')),
      embedBlock(STAY_MAP['sausalito-floating-home-ca']),

      hr(),
      h2('The Farm Yurt in the Rockies'),
      para(bold('Dreamy Colorado Farm Yurt, Steamboat Springs, Colorado')),
      para(text('Featured as one of the 23 best glamping spots in the United States. The yurt sits on a working farm in the Colorado Rockies near Steamboat Springs, which means mornings include mountain air, farm sounds, and the particular quiet of a valley that produces hay and not much else. The description calls it "authentically intimate" and the phrasing is more precise than marketing language usually manages.')),
      para(...linkNode('/journal/glamping-for-beginners', 'beginner\'s guide', { before: 'For more on the glamping spectrum, our ', after: ' covers seven stay types across seven states.' })),
      para(text('$145/night. 4.97 rating across 312 reviews. One bedroom, sleeps four but built for couples. Steamboat Springs is a real mountain town, not a resort fabrication, and the farm setting means you get the Rockies without the resort pricing. The yurt has a wood-burning stove for cold nights and a deck for warm ones. The combination of farm rhythm and mountain scale is unusual, and it works because the property does not try to be both a farm and a resort. It is a farm that happens to sit in one of the most scenic valleys in Colorado.')),
      para(text('[Stay embed: dreamy-yurt-steamboat-co]')),
      embedBlock(STAY_MAP['dreamy-yurt-steamboat-co']),

      hr(),
      h2('How to Choose'),
      para(text('For the highest-reviewed stay on this list: BaseCamp TreeLoft in Missouri. A 5.0 across 692 reviews is not normal.')),
      para(text('For stargazing from bed: the Smoky Mountain dome in North Carolina or the Lake Superior yurt in Wisconsin.')),
      para(text('For the most unusual architecture: the Vermont glass tiny home or the Sausalito floating home.')),
      para(text('For budget: Turtle Yurts at $125/night or the Colorado farm yurt at $145/night. Both deliver quality that exceeds the price.')),
      para(text('For proximity to a major city: the SkyDome in Texas, an hour from DFW, or the floating home in Sausalito, twenty minutes from San Francisco.')),
      para(text('Book around the lunar calendar if stargazing matters. New moon weekends give the darkest skies. Summer gives the longest days. Fall gives the sharpest colors. Winter gives the quietest stays, and lower rates to match.')),

      hr(),
      h2('Frequently Asked Questions'),
      para(bold('What makes a cabin romantic?'), text(' Scale matters more than square footage. A place built for two carries a different energy than a place built for ten where two happen to be staying. The stays in this guide sleep two to four, have one bedroom, and were designed with couples as the primary audience.')),
      para(bold('How much does a romantic cabin getaway cost?'), text(' The stays in this guide range from $125/night (Turtle Yurts in Wisconsin) to $395/night (the Sausalito floating home). The median is around $250/night. Four of the eight stays are under $250.')),
      para(bold('What is the best time of year for a couples cabin trip?'), text(' Fall (September through November) gives the strongest visual experience across most of these locations. Summer gives the longest days and the warmest evenings. Winter gives the quietest stays and often lower rates. Spring is the booking sweet spot: moderate prices, moderate crowds, and the landscape returning to green.')),
      para(bold('Are these stays suitable for honeymoons?'), text(' Several listings, including the SkyDome in Texas and the Glass Tiny Home in Vermont, name honeymooners in their descriptions. All eight have ratings above 4.94, which suggests the experience matches the expectation. Book early for peak season.')),
      para(bold('Can you drive to these romantic stays?'), text(' All eight are accessible by car. The most remote is the Wisconsin yurt, which requires a drive to Bayfield on the south shore of Lake Superior. The most accessible is the Texas dome, one hour from the Dallas-Fort Worth metro area.')),

      hr(),
      para(text('All stays above have been reviewed for valid booking links and current availability. Prices reflect nightly rates and may vary by season. We earn a commission on bookings made through affiliate links at no additional cost to you.')),
    ],
  },
}

async function main() {
  const payload = await getPayload({ config })

  // 1. Upload hero image
  console.log('Downloading hero image...')
  const imgRes = await fetch(HERO_IMAGE_URL)
  if (!imgRes.ok) throw new Error(`Failed to fetch hero image: ${imgRes.status}`)
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
  console.log(`Downloaded ${(imgBuffer.byteLength / 1024).toFixed(0)}KB`)

  // Check for existing media
  const existingMedia = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'romantic-cabin-hero.jpeg' } },
    limit: 1,
    depth: 0,
  })

  let media
  if (existingMedia.totalDocs > 0) {
    media = existingMedia.docs[0]
    console.log(`Media already exists: id=${media.id}`)
  } else {
    console.log('Uploading hero image to Payload media...')
    media = await payload.create({
      collection: 'media',
      data: { alt: 'BaseCamp TreeLoft treehouse in Missouri woods at dusk, fairy lights glowing, private hot tub' },
      file: { data: imgBuffer, mimetype: 'image/jpeg', name: 'romantic-cabin-hero.jpeg', size: imgBuffer.byteLength },
    })
    console.log(`Media created: id=${media.id}`)
  }

  // 2. Check for existing post
  const existing = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    limit: 1,
    depth: 0,
  })

  let post
  if (existing.totalDocs > 0) {
    post = existing.docs[0]
    console.log(`Post already exists: id=${post.id}`)
  } else {
    // Create new post
    console.log('Creating new blog post...')
    post = await payload.create({
      collection: 'blog-posts',
      data: {
        title: 'Romantic Cabin Getaways: Unique Stays Built for Two',
        subtitle: 'Eight couples-forward stays across eight states, from a Missouri treehouse with a perfect rating to a floating home on San Francisco Bay',
        slug: POST_SLUG,
        excerpt: 'From a 692-review treehouse in Missouri to a mirrored glass tiny home in Vermont, eight unique stays designed for couples who want something the resort down the road cannot provide.',
        heroImage: media.id,
        linkedStays: LINKED_STAY_IDS,
        metaTitle: 'Romantic Cabin Getaways for Couples | UniqueStaysUSA',
        metaDescription: 'Eight romantic cabin getaways across America, from Missouri treehouses to Vermont glass homes. All built for two, all rated 4.94 or higher.',
        status: 'published',
        publishedAt: '2026-06-12T06:00:00.000Z',
        content,
      },
    })
    console.log(`Post created: id=${post.id}`)
  }

  // Update content (always, in case we need to refresh)
  console.log('Updating content...')
  await payload.update({
    collection: 'blog-posts',
    id: post.id,
    data: {
      title: 'Romantic Cabin Getaways: Unique Stays Built for Two',
      subtitle: 'Eight couples-forward stays across eight states, from a Missouri treehouse with a perfect rating to a floating home on San Francisco Bay',
      excerpt: 'From a 692-review treehouse in Missouri to a mirrored glass tiny home in Vermont, eight unique stays designed for couples who want something the resort down the road cannot provide.',
      heroImage: media.id,
      linkedStays: LINKED_STAY_IDS,
      metaTitle: 'Romantic Cabin Getaways for Couples | UniqueStaysUSA',
      metaDescription: 'Eight romantic cabin getaways across America, from Missouri treehouses to Vermont glass homes. All built for two, all rated 4.94 or higher.',
      status: 'published',
      publishedAt: '2026-06-12T06:00:00.000Z',
    },
  })

  await payload.update({
    collection: 'blog-posts',
    id: post.id,
    data: { content },
  })

  console.log(`Published: id=${post.id}, slug=${POST_SLUG}`)

  // Verify
  const verified = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    limit: 1,
    depth: 1,
  })
  const v = verified.docs[0]
  console.log(`Verified: "${v.title}" | status=${v.status} | linkedStays=${v.linkedStays?.length || 0}`)

  await payload.destroy()
}

main().catch(e => { console.error(e); process.exit(1) })
