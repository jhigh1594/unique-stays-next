import { getPayload } from 'payload'
import config from '@payload-config'

const POST_SLUG = 'unique-stays-with-pools'
const STAY_SLUGS = [
  'ev-modern-villa-palm-springs',
  'wander-joshua-tree-starfall',
  'workfriendly-dome-joshua-tree',
  'ev-farmhouse-napa',
  'ev-beach-house-hamptons',
  'pearl-dome-lecanto-fl',
  'lake-travis-treehouse-tx',
  'autocamp-yosemite-ca',
]

function text(t: string, format = 0) {
  return { type: 'text', text: t, format, style: '', mode: 'normal', detail: 0, version: 1 }
}

function paragraph(children: any[]) {
  return { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', children }
}

function para(t: string) {
  return paragraph([text(t)])
}

function heading(t: string) {
  return { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] }
}

function embedBlock(stayId: number) {
  return {
    type: 'block',
    version: 2,
    fields: { id: crypto.randomUUID(), blockType: 'stayEmbed', stay: stayId },
  }
}

function linkPara(before: string, linkText: string, url: string, after: string) {
  return paragraph([
    text(before),
    { type: 'link', format: '', version: 1, fields: { url, newTab: false }, children: [text(linkText)] },
    text(after),
  ])
}

function boldQuestion(question: string, answer: string) {
  return paragraph([text(question, 1), text(answer)])
}

async function main() {
  const payload = await getPayload({ config })

  const stays = []
  for (const slug of STAY_SLUGS) {
    const result = await payload.find({
      collection: 'stays',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    if (result.totalDocs !== 1) throw new Error(`Missing stay: ${slug}`)
    stays.push(result.docs[0])
  }

  const ids = stays.map(stay => stay.id as number)

  const content = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        para('The best pool trips have a second clock. Morning coffee before the water starts flashing white. The long noon hour when everyone disappears behind sunglasses. The blue stretch after dinner, when the lights come on under the surface and the day loosens its grip.'),
        para('Unique stays with pools are not just rentals with a place to swim. They are cabins, domes, Airstream camps, and design-forward homes where the pool changes how the place works. It gives the desert an afternoon plan. It gives wine country a slow hour between tastings. It gives a national park trip somewhere to come down after a trail day. Below, eight stays were chosen for architecture, setting, guest strength, usable pool access, and the way the water belongs to the experience rather than sitting beside it.'),

        heading('The Palm Springs Salt Pool'),
        para('Palm Springs understands pool light better than almost anywhere in America. By late afternoon the San Jacinto Mountains go dark at the edges, the stucco walls hold the heat, and the pool turns into the only reasonable room in the house. The Morandi House fits that rhythm exactly: mid-century lines, a salt pool and spa, a Tesla charger, and downtown Palm Springs close enough for dinner without sacrificing the privacy you came for.'),
        para('At $405 a night, three bedrooms, room for six, and a 4.92 rating across 234 reviews, this is the cleanest expression of the pool-stay idea in the guide. The water is not an add-on. It is the center of gravity. Swim before breakfast. Hide from the worst afternoon heat. Come back after dinner when the mountain air finally cools and the spa takes over.'),
        embedBlock(ids[0]),

        heading('The Glass House Pool in Joshua Tree'),
        para('There are desert pools that feel decorative, and then there are desert pools that feel necessary. Wander Joshua Tree Starfall belongs in the second category. The glass walls face the open Mojave, Joshua Tree National Park sits minutes away, and the heated pool gives the day a shape that the desert almost demands: hike early, retreat in the heat, return outside when the sun drops.'),
        linkPara('The house sleeps six across three bedrooms at $525 a night, with a 4.97 rating from 142 reviews. Starlink keeps remote work possible, but the better use of the connection is to close the laptop early and watch the color leave the boulders. We have written about the wider area in our ', 'Joshua Tree unique stays guide', '/journal/best-unique-stays-joshua-tree', ', but Starfall earns its own place here because the pool turns the desert from severe to livable.'),
        embedBlock(ids[1]),

        heading('The Group Retreat with a Stargazing Dome'),
        para('This Joshua Tree retreat is built for the kind of trip where no one wants to coordinate cars after dinner. Sixteen guests, five bedrooms, a luxury swimming pool and spa, mini golf, a pool table, fast WiFi, and the detail that separates it from the rest: a purpose-built stargazing dome for the hours after the water quiets down.'),
        para('At $579 a night and 4.96 stars across 87 reviews, the nightly rate looks high until you divide it across a full house. Then the logic changes. This is a pool stay for birthdays, friend reunions, creative teams, and families who need more than a pretty backdrop. The day belongs to swimming and shade. The night belongs to the dome. Few large-group homes manage both with this much clarity.'),
        embedBlock(ids[2]),

        heading('The Napa Farmhouse Pool'),
        para('Calistoga moves slowly if you let it. Vines in rows, mineral springs down the road, Mount Helena in the distance, dinner reservations that start with a glass of something pale and cold. This vineyard farmhouse gives that pace a private pool, so the day does not have to keep moving from tasting room to tasting room.'),
        linkPara('The farmhouse sleeps six in three bedrooms, carries a 4.97 rating across 167 reviews, and runs $485 a night. The pool is brand new, with panoramic Mount Helena views and EV charging on site. That combination matters. You can drive in quietly, stay among the vines, charge overnight, and spend the next morning floating before the valley fully wakes up. For travelers comparing pool stays with more architectural cabin trips, our ', 'A-frame cabin guide', '/journal/best-aframe-cabins-america', ' is a useful companion.'),
        embedBlock(ids[3]),

        heading('The Hamptons Heated Pool Studio'),
        para('Southampton usually asks you to choose between village life and beach life. This private studio puts both close: two blocks from historic Main Street, less than a mile from the ocean beach, with a heated gunite pool back at the property and a Level 2 J1772 charger for the car.'),
        para('It is the smallest stay in this roundup and one of the strongest for couples: one bedroom, two guests, a 5.0 rating across 34 reviews, and $644 a night. The pool here is about timing. Swim before the beach crowds arrive. Walk to dinner without negotiating a driveway full of cars. Return to water that is still warm after dark. In a place where every hour can feel scheduled, the pool makes the trip feel less managed.'),
        embedBlock(ids[4]),

        heading('The Florida Nature Coast Dome'),
        para('The Pearl sits in Lecanto, Florida, on the Nature Coast, where the draw is not glossy resort life but springs, manatees, palmettos, and warm Gulf air moving through the trees. A geodesic dome with a private pool makes sense here in a way it might not elsewhere. The architecture gives you the novelty. The pool gives you the Florida.'),
        para("At $245 a night, with two bedrooms, room for four, and a 4.94 rating from 56 reviews, The Pearl is the most approachable private-pool stay in this guide. Crystal River's manatee encounters are close by, and the firepit gives the evening a different register after the water. The stay works because it does not pretend the pool is separate from the landscape. In central Florida, water is the landscape."),
        embedBlock(ids[5]),

        heading('The Lake Travis Treehouse Pool'),
        para('Lake Travis has a way of making Austin feel farther away than thirty minutes. The road bends west, the limestone shows through, and suddenly the day is all decks, marina paths, and water reflecting hard Texas sun. This treehouse sits above the south shore with panoramic lake views, a wrap-around deck, a hot tub, marina access, and a heated pool.'),
        linkPara('The stay sleeps four across two bedrooms at $259 a night, with a 4.88 rating from 97 reviews. It is not a treehouse in the childhood sense. It is a lifted, windowed lake perch with enough water options to keep the day from collapsing into a single plan. Pool in the morning. Marina walk at noon. Hot tub after the lake goes black. For more water-first stays, see our ', 'lakefront unique stays guide', '/journal/lakefront-unique-stays-water-cabins-domes-aframes', '.'),
        embedBlock(ids[6]),

        heading('The Yosemite Airstream Pool'),
        para('AutoCamp Yosemite understands the post-hike body. Dust on your calves, shoulders hot from a pack, brain still half on the trail. The polished Airstream suites sit in Midpines on the Merced River corridor, about 30 miles from Yosemite Valley, with a pool waiting when the park day is done.'),
        para('This is the most operationally polished stay in the roundup: $279 a night, room for four, 1,247 reviews, a 4.8 rating, EV charging, complimentary coffee, and guided shuttle service toward the Yosemite icons everyone came to see. The pool matters because Yosemite days can be enormous. El Capitan, Half Dome, the Valley heat, the shuttle lines, the long drive back. A pool gives the return a ritual that is easier than another plan.'),
        embedBlock(ids[7]),

        heading('How to Choose a Pool Stay'),
        para('Private pools and pool-access stays serve different trips. A private pool gives control: better for couples, families with strict nap schedules, and groups who want the house to be the destination. Pool access works when the larger setting is the reason you are there: Yosemite, Joshua Tree, a village, a resort-style camp, a national park corridor.'),
        para('For desert heat, prioritize heated pools and shaded outdoor space. Palm Springs and Joshua Tree can swing from harsh afternoon sun to cool evenings, so a spa or heated pool expands the usable hours. For families, read safety details before booking. The U.S. Consumer Product Safety Commission Pool Safely program reported in May 2026 that it is aware of at least 64 fatal and nonfatal pool drownings in vacation rental homes involving children under 15 since 2021, and it recommends checking for barriers such as self-latching gates, door alarms, four-sided fencing, and compliant drain covers.'),
        para('The CDC 2026 drowning guidance adds the larger context: the U.S. sees roughly 4,000 fatal unintentional drownings and 8,000 nonfatal drownings each year, and drowning is the leading cause of death for children ages 1 to 4. That does not make pool stays something to avoid. It makes them something to choose with care. Ask direct questions before booking, especially if children will be present: Is the pool fenced from the house? Are alarms installed? Are drain covers raised and compliant? Who can access the water when adults are inside?'),

        heading('Frequently Asked Questions'),
        boldQuestion('What are the best unique stays with pools for couples?', ' The Hamptons heated pool studio and The Pearl dome in Florida are the strongest couples choices in this guide. The Hamptons stay is compact, walkable, and polished. The Florida dome is more relaxed, with a private pool, firepit, and easy access to Crystal River.'),
        boldQuestion('Which unique stays with pools work best for groups?', ' The Joshua Tree group retreat is the clearest group choice, with room for sixteen, a pool and spa, mini golf, fast WiFi, and a stargazing dome. The Napa farmhouse works for a smaller group of six that wants wine country, EV charging, and a private pool with Mount Helena views.'),
        boldQuestion('Are pool stays more expensive than other unique stays?', ' Usually, yes. In this roundup, prices range from $245 a night for the Florida dome to $644 a night for the Southampton studio, with several strong options between $259 and $525. Pools raise operating costs and land value, especially in desert, coastal, and wine-country markets.'),
        boldQuestion('Should I choose a private pool or shared pool access?', ' Choose a private pool when the property itself is the trip: Palm Springs, Napa, Florida, Lake Travis, or a group house. Shared or resort-style pool access makes sense when the destination is the main event, such as AutoCamp Yosemite or AutoCamp Joshua Tree.'),
        boldQuestion('What should families ask before booking a vacation rental with a pool?', ' Ask whether the pool has four-sided fencing, a self-latching gate, door alarms, and raised drain covers. Ask who else can access the pool, whether there is nighttime lighting, and whether the host provides written pool rules. Vacation rentals rarely have lifeguards, so adult supervision is the real safety system.'),
      ],
    },
  }

  const existing = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    limit: 1,
    depth: 0,
  })

  let post
  if (existing.totalDocs > 0) {
    post = existing.docs[0]
  } else {
    post = await payload.create({
      collection: 'blog-posts',
      data: {
        slug: POST_SLUG,
        title: 'Unique Stays with Pools: Desert Oases, Domes, and Airstreams',
        excerpt: 'A curated guide to unique stays with pools, from a Palm Springs salt pool to a Florida dome, a Lake Travis treehouse, and Airstream camps near national parks.',
        status: 'draft',
      } as any,
    })
  }

  await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: {
      title: 'Unique Stays with Pools: Desert Oases, Domes, and Airstreams',
      subtitle: 'Eight water-ready stays where the pool changes the rhythm of the whole trip',
      excerpt: 'A curated guide to unique stays with pools, from a Palm Springs salt pool to a Florida dome, a Lake Travis treehouse, and Airstream camps near national parks.',
      city: '',
      state: '',
      latitude: '',
      longitude: '',
      metaTitle: 'Unique Stays with Pools Across the USA',
      metaDescription: 'Find unique stays with pools, from Palm Springs salt water to a Florida dome, Lake Travis treehouse, Hamptons studio, and Yosemite Airstreams.',
      linkedStays: ids,
      status: 'published',
      publishedAt: new Date().toISOString(),
    } as any,
  })

  await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: { content } as any,
  })

  const verified = await payload.findByID({ collection: 'blog-posts', id: post.id as number, depth: 1 })
  console.log(JSON.stringify({
    id: verified.id,
    slug: verified.slug,
    status: verified.status,
    linkedStays: Array.isArray(verified.linkedStays) ? verified.linkedStays.length : 0,
    heroImage: Boolean(verified.heroImage),
  }, null, 2))

  process.exit(0)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
