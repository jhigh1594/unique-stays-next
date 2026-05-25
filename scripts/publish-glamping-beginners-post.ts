import { getPayload } from 'payload'
import config from '@payload-config'

const POST_SLUG = 'glamping-for-beginners'
const STAY_SLUGS = [
  'geodesic-dome-22acres-ga',
  'basecamp-treeloft-mo',
  'dreamy-yurt-steamboat-co',
  'hobbit-house-fayetteville-ar',
  'glass-tiny-warren-vt',
  'sauna-aframe-saugerties-ny',
  'silo-bitterroot-mt',
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

function h3(t: string) {
  return { type: 'heading', tag: 'h3', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] }
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
    { type: 'link', format: '', version: 1, fields: { url, newTab: false, linkType: 'custom' }, children: [text(linkText)] },
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
        heading('The Trip You Didn\'t Know You Were Planning'),
        para('Here is the thing about glamping that nobody tells you: the hardest part is picking the shape.'),
        para('You know you want to sleep somewhere that isn\'t a hotel. You know you want trees or mountains or water within walking distance. But then you start browsing, and suddenly you\'re choosing between a geodesic dome in Georgia, a converted grain silo in Montana, and something called a "hobbit house" in Arkansas. The range is enormous, and that is exactly the point.'),
        para('Glamping, at its best, is not roughing it with nicer sheets. It is choosing a structure that changes how you experience a place. A dome frames the sky differently than a cabin frames the forest. A yurt at $145 a night in the Colorado Rockies gives you a version of mountain solitude that a $500 resort cannot replicate, because the walls are canvas and the air comes through the door, not through climate control.'),
        para('This guide is for the person who has never done this before. Seven stays, seven states, seven completely different structures. By the end, you will know which shape is yours.'),
        embedBlock(ids[0]),

        heading('Start with a Dome'),
        para('If this is your first time, a geodesic dome is the safest bet. They are everywhere now, and for good reason: the geometry does half the work. Triangular windows turn tree canopy into a shifting pattern of light. At night, the shape amplifies silence in a way that a square room cannot.'),
        para('The dome on 22 forested acres in Sautee Nacoochee, Georgia, sits in the state\'s historic arts district, near a vineyard and hiking trails. It has an outdoor shower and a soaking tub. The specific pleasure here is washing off under open sky, then sitting in hot water while the Georgia pines go dark around you. At $210 a night with a five-star rating across 241 reviews, it is the entry point that earns the phrase "glamping for beginners" without condescension. Two guests, one bedroom. Bring someone you like.'),
        embedBlock(ids[1]),

        heading('Or Start with a Treehouse'),
        para('The BaseCamp TreeLoft in Perryville, Missouri, has 692 reviews and a five-star rating. That is not a typo. It is one of the most-reviewed and highest-rated treehouses in the country, and the reason is simple: it does one thing extremely well. A private hot tub on the deck. String lights in the Missouri hardwoods. A structure built for two, where the only agenda is the sound of wind through branches.'),
        para('At $245 a night, it sits in the middle of the price range for a first glamping trip. What makes it a strong beginner choice is the infrastructure. Treehouses can feel precarious for first-timers. This one does not. The build is solid, the amenities are dialed in, and the reviews read like a consensus: this is the treehouse that convinces people who did not think they were treehouse people.'),
        embedBlock(ids[2]),

        heading('The Yurt Option: Maximum Atmosphere, Minimum Price'),
        para('A yurt in Steamboat Springs, Colorado, at $145 a night. That is the lowest price in this guide, and it is not because the experience is lesser. Named one of the 23 best glamping spots in the United States, this farm-stay yurt sits in the Rockies with 312 reviews at 4.97 stars. Four guests, one bedroom, mountain air that comes through the canvas walls rather than through a vent.'),
        para('The yurt is the structure that surprises people most on their first glamping trip. The circular shape does something acoustically strange and pleasant. Sound wraps. The space feels larger than its square footage. And the thin walls mean you hear the farm, the wind, the creek if there is one nearby. It is the closest thing on this list to actual camping, which makes it the right choice for someone who wants atmosphere without austerity.'),
        embedBlock(ids[3]),

        heading('The One That Doesn\'t Fit a Category'),
        para('The Hobbit House on Cedar Bluff in Fayetteville, Arkansas, is an underground geodesic dome. It sleeps eight across four bedrooms. It has a four-foot tower topped with a clear dome for natural light, a copper sink, and lake views across three acres. It is, by any measure, the most structurally unusual property in this guide, and that is precisely why it belongs here.'),
        para('Glamping for beginners is partly about learning what you respond to. Some people want minimalism. Some people want whimsy. The Hobbit House is for the second group, or for families who want a first trip that feels like a story rather than a test of whether the kids can handle the outdoors. At $250 a night for up to eight guests, it is also the best per-person value on this list.'),
        embedBlock(ids[4]),

        heading('The Glass Tiny Home: Where Design Meets Mortgage'),
        para('The most-wishlisted tiny home in Vermont. A 200-square-foot mirrored glass house built in Estonia, shipped across the Atlantic, and set on a hillside with panoramic views of Sugarbush Mountain and Blueberry Lake. At $325 a night, it is the most expensive stay in this guide, and the price is not for the square footage. The price is for the experience of waking up inside a lens.'),
        para('This is the choice for someone whose first glamping trip needs to feel design-forward rather than rustic. The Scandinavian aesthetic is deliberate: clean lines, a hot tub on the deck, and the sense that someone with exacting taste built something specifically for the view. Two guests. One bedroom. The kind of place that photographs the way it feels.'),
        embedBlock(ids[5]),

        heading('The A-Frame: Two Hours from Manhattan, Miles from Everything Else'),
        para('The A-frame is the shape that launched a thousand Instagram posts, but the version in Saugerties, New York, earns its keep through something the algorithm cannot replicate: a cedar barrel sauna on the property. Two hours from New York City, in the Catskills, with mountain views from a wrap-around deck and an all-wood interior that reads like a Scandinavian ski lodge that decided to stay in upstate New York.'),
        para('At $285 a night for four guests and two bedrooms, this is the group trip option. The sauna changes the rhythm of the day. Morning: coffee on the deck, cold air, warm cup. Afternoon: hike or drive into town. Evening: heat the sauna, sit in cedar steam, cool off under the Catskill sky. The A-frame itself is the structure; the sauna is the reason you keep coming back.'),
        embedBlock(ids[6]),

        heading('The Wildcard: A Grain Silo in Montana'),
        para('A converted grain silo in Corvallis, Montana, with circular rooms and panoramic views of the Bitterroot Valley. At $175 a night, it is the second-cheapest option here, and it may be the most memorable. The shape does things that no other structure can. Curved walls. Round windows that frame the Montana sky like a film projection. Dog-friendly acres outside the door.'),
        para('This is the stay for someone who wants their first glamping trip to produce a story that starts with "so we slept in a grain silo." Not because it is gimmicky, but because it is genuinely strange in the best way. Three guests, one bedroom, 87 reviews at 4.96 stars, and the kind of quiet that only exists in big sky country.'),

        heading('What to Know Before You Book Your First Glamping Trip'),
        para('Pick your comfort level. If you need a real bathroom and climate control, start with the dome, the A-frame, or the glass tiny home. If you want to stretch, try the yurt or the treehouse. If you want a story, book the silo or the hobbit house.'),
        para('Book early. These properties have hundreds of reviews for a reason. Weekend dates in peak season (June through October for most) book weeks or months ahead. Weekdays are easier and sometimes cheaper.'),
        para('Read the listing carefully. Glamping covers an enormous range. Some places have full kitchens. Others have a hot plate and a cooler. Some have flush toilets. Others have composting. The listing will tell you, and for your first trip, the details matter more than the photos.'),
        para('Pack for the structure, not just the weather. A yurt needs different gear than a dome. A treehouse needs different shoes than a tiny home on flat ground. Check what the host provides and fill the gaps.'),
        para('Bring less than you think. The best glamping trips involve very few possessions. A book, a jacket, ingredients for one good meal. The point is the place, not the luggage.'),

        heading('Frequently Asked Questions'),
        boldQuestion('What does glamping actually mean?', ' Glamping is a portmanteau of "glamorous camping," but the term has expanded far beyond its origins. In practice, it means staying in a structure that is neither a traditional hotel room nor a tent you pitch yourself. Domes, yurts, treehouses, tiny homes, converted silos, hobbit houses: all of it counts. The common thread is intentional design in a natural setting.'),
        boldQuestion('How much does a first glamping trip cost?', ' In the stays featured here, prices range from $145 a night for a Colorado yurt to $325 a night for a Vermont glass tiny home. The median is around $250. Compared to a hotel in the same destinations, glamping stays are often comparable in price but deliver a fundamentally different experience.'),
        boldQuestion('Is glamping suitable for beginners who have never camped?', ' That is the entire point. Glamping exists partly because traditional camping has barriers that not everyone wants to overcome. You do not need to own a tent, a sleeping bag, or a camp stove. The structure is provided. The amenities vary, but even the most rustic option in this guide (the Colorado yurt) is a long way from sleeping on the ground.'),
        linkPara('What should I pack for my first glamping trip? ', 'Less than you think. Check the listing for what the host provides. Most glamping stays include linens, towels, and basic kitchen equipment. Focus on weather-appropriate clothing, a book, food you want to cook, and whatever you need for the specific activity (hiking boots, a swimsuit, a bottle of wine). The ', 'remote worker\'s guide to unique stays', '/journal/remote-workers-guide-unique-stays', ' covers packing for work-friendly stays specifically.'),
        linkPara('How do I choose between a dome, yurt, treehouse, or something else? ', 'Start with what draws you. If you want to look up and see sky, pick a dome. If you want the sound of wind through trees, pick a treehouse. If you want the lowest price with the most atmosphere, pick a yurt. If you want a story nobody else has, pick the silo. The ', 'treehouse rentals guide', '/journal/best-treehouse-rentals-usa', ' and the ', 'lakefront stays roundup', '/journal/lakefront-unique-stays-water-cabins-domes-aframes', ' offer deeper dives into specific categories.'),
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
        title: 'Glamping for Beginners: Your First Unique Stay, Explained',
        excerpt: 'A practical guide to your first glamping trip, with seven specific stays across seven states that show the full range of what unique can mean.',
        status: 'draft',
      } as any,
    })
  }

  await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: {
      title: 'Glamping for Beginners: Your First Unique Stay, Explained',
      subtitle: 'Domes, yurts, treehouses, and converted silos: what glamping actually feels like, and where to start',
      excerpt: 'A practical guide to your first glamping trip, with seven specific stays across seven states that show the full range of what unique can mean, from a $145 yurt in Colorado to a glass tiny home in Vermont.',
      city: '',
      state: '',
      latitude: '',
      longitude: '',
      metaTitle: 'Glamping for Beginners | UniqueStaysUSA',
      metaDescription: 'Seven hand-picked stays that show what glamping actually feels like. Domes, yurts, treehouses, and more across seven states, from $145/night.',
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
