// Creates the Joshua Tree first journal post in Payload CMS
// Run: pnpm exec tsx scripts/create-joshua-tree-post.ts

import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

function text(content: string) {
  return { type: 'text', format: 0, style: '', mode: 'normal', text: content, detail: 0, version: 1 }
}

function para(content: string) {
  return {
    type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
    textFormat: 0, textStyle: '',
    children: [text(content)],
  }
}

function h2(content: string) {
  return {
    type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr',
    children: [text(content)],
  }
}

function embedBlock(stayId: number) {
  return {
    type: 'block', version: 2,
    fields: { id: crypto.randomUUID(), blockType: 'stayEmbed', stay: stayId },
  }
}

async function main() {
  const payload = await getPayload({ config })

  // Look up the three stays by slug
  const slugs = ['wander-joshua-tree-starfall', 'workfriendly-dome-joshua-tree', 'autocamp-joshua-tree-ca']
  const stayIds: Record<string, number> = {}

  for (const slug of slugs) {
    const result = await payload.find({ collection: 'stays', where: { slug: { equals: slug } }, depth: 0, limit: 1 })
    if (result.totalDocs === 0) throw new Error(`Stay not found: ${slug}`)
    stayIds[slug] = result.docs[0].id as number
    console.log(`Found ${slug}: id=${stayIds[slug]}`)
  }

  const wanderId = stayIds['wander-joshua-tree-starfall']
  const majesticId = stayIds['workfriendly-dome-joshua-tree']
  const autocampId = stayIds['autocamp-joshua-tree-ca']

  // Check if post already exists
  const existing = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: 'best-unique-stays-joshua-tree' } },
    depth: 0,
    limit: 1,
  })
  if (existing.totalDocs > 0) {
    console.log('Post already exists — aborting to avoid duplicate.')
    process.exit(0)
  }

  const content = {
    root: {
      type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
      children: [
        para('The road into Joshua Tree arrives in stages. First, the highway flattens until the horizon feels implausibly far away. Then the rocks appear: enormous granite formations stacked by time into shapes that look deliberate, like a sculptor left mid-project and never came back. The Joshua trees themselves appear like punctuation. Arms raised. Spines out. Completely unbothered.'),
        para('This park sits at the collision of two deserts. The Mojave, cold and high, presses in from the north. The Sonoran, low and electric, holds the south. What that collision produces is an ecosystem unlike anything else in the continental United States, and a quality of light that people drive six hours to see. At sunrise it\'s gold and horizontal, flooding every surface at once. At dusk it turns the boulders the color of old terracotta. At night, in genuine darkness thirty miles from the nearest city glow, the sky does something most Americans have never actually witnessed.'),
        para('People come here to disappear into something larger than themselves. To hike until their minds go quiet. To sit with a canyon view long enough that the urgency they arrived with starts to feel like someone else\'s problem.'),
        para('What you do not want, after all of that, is a forgettable room with a view of the parking lot.'),
        para('The best unique stays near Joshua Tree don\'t compete with the landscape. They participate in it. Three worth planning a trip around:'),

        h2('Wander Joshua Tree Starfall'),
        embedBlock(wanderId),
        para('Most desert stays offer a view. Wander Joshua Tree Starfall offers something closer to submersion.'),
        para('The floor-to-ceiling glass walls face the open Mojave, which means the landscape is present in every room, at every hour. Sunrise turns the interior amber without you leaving the bed. The boulder formations outside the windows are not decoration. They\'re the room, seen through glass. It\'s one of those properties where you notice, at some point, that you\'ve been sitting completely still for forty minutes watching the light change, and you feel no need to explain that to anyone.'),
        para('The stargazing deck is the evening ritual. Starfall was named honestly. The property sits far enough from town that the Milky Way shows itself the way it\'s supposed to: fully, and with some authority. After the desert air drops post-sunset (sharper than first-timers expect, even in spring) the heated pool is where the night usually ends.'),
        para('Wander is a hospitality brand with a specific philosophy: managed homes, hotel-grade service, Starlink WiFi, and a thoughtfulness in the details that makes a long weekend feel genuinely restorative rather than just logistically smooth. This property sleeps six across three bedrooms, right for a small group or two couples who want enough space to spend four days without tripping over each other.'),
        para('At $525 per night with a 4.97 rating across 142 reviews, Starfall earns both numbers.'),

        h2('Majestic Luxury Retreat with Stargazing Dome'),
        embedBlock(majesticId),
        para('Some trips are better when you bring everyone.'),
        para('This is a five-bedroom, sixteen-guest desert compound with a heated pool and spa, a pool table, mini golf, and the thing that distinguishes it from every other large desert rental: a dedicated stargazing dome installed for one specific purpose, which is to make the most of a sky that most people only half-see from a hot tub.'),
        para('The dome is not an amenity the way a coffee maker is an amenity. It\'s a structure, oriented toward the Mojave\'s clear horizon, that exists solely to frame the most dramatic night sky available in the lower forty-eight. Plan the itinerary around it. The rest arranges itself: morning hikes in the park, afternoons by the pool, sunsets from the highest boulder you can find, then the dome after dark.'),
        para('At $579 per night for sixteen guests, the per-head math becomes difficult to argue with. Split four ways, this is a reasonable long weekend. Split eight ways, it\'s the trip your group will reference for the next five years. The 4.96 rating across 87 reviews suggests no one has found a compelling reason to leave early.'),
        para('The property carries fast WiFi, which matters if your group includes remote workers who need one last day of productive coverage before going fully off-grid. The desert rewards that kind of practical planning.'),

        h2('AutoCamp Joshua Tree'),
        embedBlock(autocampId),
        para('The AutoCamp model is deceptively simple: take something inherently beautiful — a gleaming 31-foot Airstream — and place it somewhere the setting earns the design.'),
        para('Five minutes from Joshua Tree National Park\'s entrance, the camp has arranged its Airstreams against a backdrop of the boulder formations the park is famous for. Out here, the curved aluminum reads differently than it would in any ordinary campground. Against stacked granite and desert sky, the trailers look like they were always supposed to be here.'),
        para('The practical details are handled with the same care as the aesthetics. Heated pool. EV charging. A rotating program of stargazing events, guided in season by people who know where to point. The camp operates with a specific visual philosophy: intentional, designed, neither trying to feel rustic nor trying to feel like a hotel. There\'s a difference between a place that looks good in photos and a place that actually functions beautifully. AutoCamp has managed to be both.'),
        para('For couples, or anyone who wants genuine proximity to the park without the overhead of managing a full estate, this is the answer. At $229 per night with 892 reviews averaging 4.8 stars, AutoCamp has been doing this long enough to have worked out every edge case.'),

        h2('When to Go'),
        para('Spring, from late February through April, is peak season for a reason. When winter rainfall cooperates, the desert floor blooms: not a metaphor, but actual color across the sand. Temperatures sit in the low-to-mid seventies during the day and drop sharply after sunset, which means a light jacket is not optional so much as a condition of enjoying the evenings.'),
        para('Fall, October through mid-November, offers nearly identical temperatures with meaningfully fewer people. The October light is particular: angled, long, the color of something about to change. It is, by a narrow margin, the best time to be here.'),
        para('Summer means triple-digit heat and a different kind of visitor: people who specifically want the park empty. The crowds thin. The roads go quiet. If your lodging has air conditioning and a pool — all three properties above do — there\'s a genuine argument for it.'),
        para('Stargazing works year-round, but plan around the lunar calendar. A new moon week in any season clears the sky and reveals what the desert has been showing all along. Bring a headlamp and actually use it. The dark here is real, and the path to a stargazing dome at midnight is not the place to discover otherwise.'),

        para('More extraordinary stays — desert compounds, mountain treehouses, glass cabins, and converted everything — live in the full directory. If Joshua Tree opened something in you, there\'s a whole American landscape worth exploring the same way.'),
      ],
    },
  }

  const post = await payload.create({
    collection: 'blog-posts',
    data: {
      slug: 'best-unique-stays-joshua-tree',
      title: 'The Best Unique Stays in Joshua Tree (Airstreams, Domes & Glass Villas)',
      subtitle: 'Where the Mojave meets your morning coffee.',
      status: 'published',
      publishedAt: '2026-05-09T00:00:00.000Z',
      excerpt: 'Three extraordinary places to stay near Joshua Tree National Park — from a glass-walled desert villa to a stargazing dome compound to polished Airstreams steps from the entrance. No ordinary rooms.',
      content,
      linkedStays: [wanderId, majesticId, autocampId],
      city: 'Joshua Tree',
      state: 'California',
      latitude: '34.1347',
      longitude: '-116.3131',
      metaTitle: 'Best Unique Stays in Joshua Tree | Domes, Airstreams & More',
      metaDescription: 'Three extraordinary ways to sleep in Joshua Tree: a glass-walled Wander villa, a stargazing dome compound for 16, and polished Airstreams steps from the park.',
    },
  })

  console.log(`\nCreated blog post: id=${post.id} slug=${post.slug as string}`)
  console.log(`View at: http://localhost:3000/journal/${post.slug as string}`)
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
