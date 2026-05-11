// Publishes the A-frame cabin roundup post to Payload CMS
// Run: pnpm exec tsx --env-file=.env.local scripts/publish-aframe-post.ts

import { getPayload } from 'payload'
import config from '@payload-config'

const POST_SLUG = 'best-aframe-cabins-america'

function text(t: string) {
  return { type: 'text', text: t, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }
}

function para(t: string) {
  return {
    type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
    textFormat: 0, textStyle: '',
    children: [text(t)],
  }
}

function paraWithLink(beforeText: string, linkText: string, linkUrl: string, afterText: string) {
  return {
    type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
    textFormat: 0, textStyle: '',
    children: [
      text(beforeText),
      { type: 'link', version: 1, fields: { linkType: 'custom', url: linkUrl }, format: 0, direction: 'ltr', children: [text(linkText)] },
      text(afterText),
    ],
  }
}

function h2(t: string) {
  return { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] }
}

function h3(t: string) {
  return { type: 'heading', tag: 'h3', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] }
}

function embedBlock(stayId: number) {
  return { type: 'block', version: 2, fields: { id: crypto.randomUUID(), blockType: 'stayEmbed', stay: stayId } }
}

function boldPara(boldText: string, normalText: string) {
  return {
    type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
    textFormat: 0, textStyle: '',
    children: [
      { type: 'text', format: 1, style: '', mode: 'normal', text: boldText, detail: 0, version: 1 },
      text(normalText),
    ],
  }
}

const STAYS: { title: string; id: number; body: string }[] = [
  {
    title: 'The Cedar and the Steam',
    id: 118,
    body: 'Two hours north of Manhattan, in the Catskills town of Saugerties, there is an A-frame whose all-wood interior smells like a Scandinavian ski lodge before you even cross the threshold. The source is a cedar barrel sauna on the wrap-around deck, where the heat opens your pores while the mountain views do something quieter to your sense of time. Inside: a fireplace, two bedrooms sleeping four, and windows that frame nothing but canopy. 203 guests have left reviews at 4.95 stars. $285/night. The kind of place that makes a long weekend feel like a full reset.',
  },
  {
    title: 'The Triangle and the Peak',
    id: 110,
    body: 'At 9,000 feet above sea level in the Colorado Rockies, the air arrives thin and clean and slightly sharp. This modern A-frame near Florissant was built to frame Pikes Peak, and it does: the massif fills the gable-end glass like a portrait painted in granite and snow. Elk wander the meadows at dawn. After dark, the sky opens into a darkness that most Americans have never actually seen — Bortle-class darkness, the kind that reveals the Milky Way\'s structure. Private hot tub. Two bedrooms for four. $265/night. 87 reviews at 4.95 stars.',
  },
  {
    title: 'Eight Acres on a River Bend',
    id: 112,
    body: 'The Pedernales River makes a slow, deliberate turn through eight private acres of Texas Hill Country, and someone had the sense to perch an A-frame right on the bend. Fredericksburg\'s wine country is close enough for a tasting tour and far enough that the only sounds after sunset are the river and the cicadas. The cabin itself is brand new — clean lines, generous windows, sleeping six across two bedrooms. Wildflowers in spring. Vineyards on the horizon. $325/night, 76 reviews at 4.95 stars.',
  },
  {
    title: 'Three Hundred and Twelve Agreements',
    id: 120,
    body: 'Three hundred and twelve guests have left five-star reviews for this all-pine A-frame in Center Conway, and the number keeps climbing. That kind of consensus is rare in vacation rentals, where one broken faucet can tank a rating. The Warm Pine, as the name suggests, is all golden wood and dappled light filtering through the surrounding trees. It sits at the gateway to the White Mountains: Mount Washington, the Kancamagus Highway, and some of the best fall foliage in North America are all within a short drive. Two bedrooms, sleeps four. $169/night — the most affordable cabin on this list, and the most proven.',
  },
  {
    title: 'Above the Valley, Below the Clouds',
    id: 126,
    body: 'The name does the work: A Walk in the Clouds sits above the Blue Ridge Valley in northern Georgia, where the ridgeline stacks up in layers of blue and green that shift with the light. Steps away, the Toccoa River runs cold and clear. Fifteen minutes by car, North Georgia\'s wine country begins — a cluster of vineyards producing surprisingly good European varietals in foothill soil. The A-frame itself is new and thoughtfully finished: two bedrooms, sleeps four, $215/night. 67 reviews at 4.95 stars. The Southeast is underrepresented in most national cabin roundups, and this stay is the reason that should change.',
  },
  {
    title: 'The Lake and the Dock',
    id: 109,
    body: 'Most lakefront rentals give you a view of the water. This one gives you a private beach, boat docks, and a hot tub positioned so that the pine-lined shoreline fills your peripheral vision while the Coeur d\'Alene sky does the rest. The A-frame sleeps eight across three bedrooms, making it the rare cabin on this list built for a group rather than a couple. Four seasons: swim and kayak in summer, ski Schweitzer Mountain in winter. $279/night. 112 reviews at 4.93 stars. North Idaho doesn\'t ask for attention — it rewards those who show up.',
  },
  {
    title: 'Cascade Glass and Hot Water',
    id: 105,
    body: 'Ninety minutes from Seattle, in the Central Cascades near Gold Bar, this modern A-frame has a private hot tub and panoramic mountain views that shift from steel gray to purple depending on the cloud cover. Stevens Pass ski area is close enough to see the lights at night. The cabin itself is a study in restraint: clean angles, nothing extraneous, air conditioning for August and a wood stove for January. Two bedrooms, sleeps four. $218/night. 156 reviews at 4.94 stars.',
  },
  {
    title: 'Where the River Does the Talking',
    id: 117,
    body: 'The Indian River runs through Northern Michigan\'s inland lake country, and this riverfront A-frame sits close enough to hear it from bed. A private hot tub on the deck overlooks the current. A canoe waits at the bank for the paddle to Burt Lake via the Inland Waterway — a chain of rivers and lakes that connects three towns without a single highway. The cabin sleeps four across two bedrooms at $195/night, and the 78 guests who have reviewed it at 4.93 stars all seem to arrive at the same conclusion: this is what a Michigan summer is supposed to feel like.',
  },
  {
    title: 'Dark Skies and Blue Ridge',
    id: 122,
    body: 'The Virginia Highlands near Abingdon are dark enough at night that the Milky Way casts faint shadows on the ground. This A-frame, positioned above a mountain lake with Blue Ridge ridgelines rising behind it, was built for that darkness. Floor-to-ceiling glass. A deck wide enough to lie flat and watch satellites trace their arcs. By day, the Virginia Creeper Trail and Mount Rogers National Recreation Area are minutes away. Two bedrooms, sleeps four. $178/night. 89 reviews at 4.94 stars.',
  },
  {
    title: 'The Mountain and the Signal',
    id: 6,
    body: 'At $555/night, this is the most expensive cabin on this list, and the only one with Starlink WiFi and smart home technology built into the structure. It is also the only one where every window frames the Cascade Mountains in their full, glacier-carved scale. The Wander Bend Retreat is a luxury property in the truest sense: nothing decorative, nothing performative, just careful design in service of a landscape that needs no embellishment. Four bedrooms sleep eight. Mt. Bachelor ski resort is 30 minutes away. 134 reviews at 4.96 stars — the highest rating on this list. (If you\'re considering a work-from-anywhere trip, the Wander properties include dedicated workspaces — our remote work stay guide covers that angle in depth.)',
  },
]

async function main() {
  const payload = await getPayload({ config })

  // 1. Check for existing post
  const existing = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    depth: 0,
    limit: 1,
  })

  let postId: number

  if (existing.totalDocs > 0) {
    postId = existing.docs[0].id
    console.log(`Existing post found: ID ${postId}`)
  } else {
    // 2. Create the post
    console.log('Creating blog post...')
    const created = await payload.create({
      collection: 'blog-posts',
      data: {
        slug: POST_SLUG,
        title: 'The 10 Best A-Frame Cabin Rentals in America',
        subtitle: 'From a cedar sauna in the Catskills to a private lake in North Idaho, the triangle-roofed cabins that earn their place',
        excerpt: 'We sorted through every A-frame cabin rental in our directory and narrowed the field to ten that do more than look good in photos — each one earned its place through architecture that serves the land around it, from a cedar sauna in the Catskills to a private lake in North Idaho.',
        status: 'published',
        publishedAt: '2026-05-11T20:00:00.000Z',
        metaTitle: 'The 10 Best A-Frame Cabin Rentals in America',
        metaDescription: 'From a Catskills cedar sauna to a North Idaho private lake, ten A-frame cabin rentals that turn the most iconic American cabin shape into something worth remembering.',
        linkedStays: [126, 122, 120, 118, 117, 112, 110, 109, 105, 6],
      },
    })
    postId = created.id
    console.log(`Post created: ID ${postId}`)
  }

  // 3. Build Lexical content
  console.log('Building Lexical content...')
  const children: any[] = []

  // Opening
  children.push(para('The A-frame cabin is the most recognizable rental shape in America. Two walls that lean together and meet at a peak, like hands pressed in prayer. An A-frame cabin rental is a vacation property defined by its steeply pitched triangular roof and open-beam interior — a form originally popularized in the 1950s as an affordable, snow-shedding second home, now the most requested architectural style on Airbnb and VRBO. The shape has been around since ancient Japan, but it took postwar American optimism — and a 1957 article in Sunset magazine — to turn it into the country\'s defining cabin silhouette.'))

  children.push(paraWithLink(
    'What makes the best A-frame cabin rentals endure is not nostalgia. It is the way a steeply pitched roof sheds snow in Colorado and rain in the Cascades with equal indifference. The way floor-to-ceiling glass at the gable end turns a wall into a projector screen for whatever landscape sits outside. The way the interior narrows as it rises, creating a loft that feels like a treehouse built by adults who refused to stop climbing. (Speaking of which, if it\'s the canopy you\'re after, our ',
    'guide to America\'s most extraordinary treehouses',
    '/journal/most-extraordinary-treehouses-america',
    ' covers ten that earned their place in the branches.)'
  ))

  children.push(para('We sorted through every A-frame in our directory — thirty across twelve states — and narrowed the field to ten that do more than look good in photos. Each one earned its place through a detail that no other property shares: a cedar barrel sauna in the Catskills, a river that runs through eight private acres in Texas Hill Country, 312 five-star reviews in the White Mountains from guests who keep coming back.'))

  // Stay sections
  for (const stay of STAYS) {
    children.push(h2(stay.title))
    children.push(embedBlock(stay.id))
    children.push(para(stay.body))
  }

  // How to Choose
  children.push(h2('How to Choose the Right A-Frame Cabin Rental'))
  children.push(para('A-frames reward clarity about what you want from a cabin trip. The shape itself delivers the same thing everywhere: dramatic interior height, generous glazing, a sense of architectural personality that most rectangles lack. The differences that matter are the ones outside the walls.'))
  children.push(boldPara('For couples seeking quiet: ', 'The Saugerties cedar sauna (NY) and the Abingdon dark skies (VA) offer the most intimate settings, both under $285/night.'))
  children.push(boldPara('For families or groups: ', 'The Coeur d\'Alene lakeside (ID) sleeps eight with private beach access. The Wander Bend Retreat (OR) is the same capacity with mountain luxury.'))
  children.push(boldPara('For the budget-conscious: ', 'The Warm Pine A-frame in New Hampshire delivers the highest value on this list — $169/night with 312 five-star reviews. The Georgia Blue Ridge cabin at $215/night is the next best value.'))
  children.push(boldPara('For seasonal timing: ', 'Spring wildflowers in Texas Hill Country. Summer lake season in Idaho and Michigan. Fall foliage in the White Mountains and Blue Ridge. Winter skiing in Colorado, Oregon, and Washington.'))
  children.push(para('Every A-frame on this list is available to book now through their respective platforms. We verify affiliate links and guest ratings monthly.'))

  // FAQ
  children.push(h2('Frequently Asked Questions'))
  children.push(h3('What makes an A-frame cabin different from a regular cabin?'))
  children.push(para('An A-frame cabin has a steeply pitched triangular roof that extends from the ridge to near ground level on both sides, creating the characteristic "A" shape. Unlike conventional cabins with separate walls and roof, the A-frame\'s roof is the wall. This design sheds snow efficiently, allows for dramatic floor-to-ceiling windows at the gable ends, and creates open-beam interiors with a loft-like feeling. The form became popular in the 1950s and has seen a sustained resurgence in vacation rental demand since 2020.'))
  children.push(h3('How much does an A-frame cabin rental cost?'))
  children.push(para('Prices range from $169/night for a proven two-bedroom in New Hampshire\'s White Mountains to $555/night for a luxury four-bedroom in Bend, Oregon. The median price on this list is $262/night. Most A-frame cabins sleep four to six guests, and splitting costs between two couples brings the per-person rate below most hotel rooms in comparable destinations.'))
  children.push(h3('When is the best time to rent an A-frame cabin?'))
  children.push(para('It depends on the region. Colorado and Oregon A-frames peak in winter for ski access and summer for dark-sky stargazing. Texas Hill Country is at its best during spring wildflower season (March-April). New England and the Blue Ridge shine during fall foliage (late September through October). Northern Michigan and Idaho lake cabins are summer properties at heart, with kayaking and swimming from June through September.'))
  children.push(h3('Are A-frame cabins good for families?'))
  children.push(para('The A-frames on this list sleep between four and eight guests. The Coeur d\'Alene lakeside cabin in Idaho (three bedrooms, private beach) and the Wander Bend Retreat in Oregon (four bedrooms, smart home) are the best options for larger groups. Most two-bedroom A-frames work well for couples or a family of four, though the loft-access bedrooms in some properties may not suit very young children.'))
  children.push(h3('Where are the best A-frame cabin rentals in the US?'))
  children.push(para('The ten on this list span ten states: Oregon, Washington, Colorado, Texas, New Hampshire, New York, Georgia, Idaho, Michigan, and Virginia. The Pacific Northwest and Northeast have the highest concentration of quality A-frame rentals overall, but the Southeast and Mountain West are producing strong contenders — particularly the Blue Ridge Valley in Georgia and the Pikes Peak region of Colorado.'))

  // Closing
  children.push(h2('The Shape That Keeps Earning Its Place'))
  children.push(para('The A-frame outlived midcentury modernism, outlived the rustic cabin revival, and will outlive whatever Instagram aesthetic is currently renaming it. The reason is structural: no other shape does so much with so little. Two walls, a peak, and a window. The rest is whatever land you choose to point it at.'))
  children.push(para('These ten cabins are pointed at land worth crossing state lines for. The rest of our directory has two hundred more, if you want to keep exploring.'))

  const lexicalContent = {
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  }

  // 4. Update content
  console.log('Updating content...')
  await payload.update({
    collection: 'blog-posts',
    id: postId,
    data: { content: lexicalContent },
  })
  console.log('Content updated.')

  // 5. Verify
  const verified = await payload.findByID({ collection: 'blog-posts', id: postId, depth: 1 })
  console.log(`Verified: "${verified.title}" — status: ${verified.status}, linkedStays: ${(verified.linkedStays as any[])?.length || 0}`)

  await payload.destroy()
}

main().catch(console.error)
