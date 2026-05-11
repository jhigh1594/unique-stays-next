// Updates the treehouses article with stayEmbed blocks, linkedStays, and hero image
// Run: pnpm exec tsx --env-file=.env.local scripts/update-treehouse-article.ts

import { getPayload } from 'payload'
import config from '@payload-config'

const POST_SLUG = 'most-extraordinary-treehouses-america'

// Hero image — Secluded Intown Treehouse (Airbnb's #1 Most Wished-For, iconic rope bridge shot)
const HERO_IMAGE_URL = 'https://a7v1qq3bzbgnznqq.public.blob.vercel-storage.com/stays/secluded-intown-treehouse-ga.jpg'

// Stay slugs in article order → IDs verified from production
const STAY_MAP: Record<string, number> = {
  'secluded-intown-treehouse-ga': 74,
  'toccoa-waterfall-treehouse-ga': 75,
  'redwood-treehouse-ca': 28,
  'treehouse-point-temple-wa': 58,
  'meadowlark-treehouse-mt': 55,
  'rocky-mountain-treehouse-co': 57,
  'planetarium-treehouse-ar': 10,
  'elm-treehouse-grove-tn': 64,
  'willow-treehouse-ny': 73,
  'basecamp-treeloft-mo': 7,
}

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

async function main() {
  const payload = await getPayload({ config })

  // 1. Find the post
  const posts = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    limit: 1,
    depth: 0,
  })
  if (posts.totalDocs === 0) throw new Error(`Post not found: ${POST_SLUG}`)
  const post = posts.docs[0]
  console.log(`Found post: id=${post.id}, title="${post.title}"`)

  // 2. Upload hero image
  console.log('Downloading hero image...')
  const imgRes = await fetch(HERO_IMAGE_URL)
  if (!imgRes.ok) throw new Error(`Failed to fetch hero image: ${imgRes.status}`)
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
  console.log(`Downloaded ${(imgBuffer.byteLength / 1024).toFixed(0)}KB`)

  const existingMedia = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'treehouses-hero.jpg' } },
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
      data: { alt: 'Secluded Intown Treehouse in Atlanta — rope bridges connecting three cabins in a forest canopy' },
      file: { data: imgBuffer, mimetype: 'image/jpeg', name: 'treehouses-hero.jpg', size: imgBuffer.byteLength },
    })
    console.log(`Media created: id=${media.id}`)
  }

  // 3. Verify stays exist
  const stayIds = Object.values(STAY_MAP)
  console.log('Verifying stays...')
  for (const id of stayIds) {
    const stay = await payload.findByID({ collection: 'stays', id, depth: 0 })
    console.log(`  Found: ${stay.title} (id=${id})`)
  }

  // 4. Build full article content with proper stayEmbed blocks
  const content = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        para('There is a particular silence that exists only twenty feet off the ground.'),
        para('It arrives when the ladder drops away beneath you and the forest floor becomes someone else\'s world. The sounds change — or maybe you just start hearing them for the first time. Wind through leaves. A creek somewhere below. The particular creak of wood that reminds you this structure is alive in a way that no hotel room will ever be.'),
        para('We searched through every treehouse listing in our directory, cross-referenced thousands of guest reviews, and narrowed thirty-two candidates down to the ten that genuinely stopped us mid-scroll. Not because they were the most expensive or the most photographed, but because each one offered something we couldn\'t shake after closing the tab.'),
        para('Each one made us forget, at least for a few hours, that we had somewhere else to be.'),

        // 1. Secluded Intown Treehouse
        h2('The Impossible Urban Escape'),
        embedBlock(STAY_MAP['secluded-intown-treehouse-ga']),
        para('Peter Bahouth built three cabins in an Atlanta forest using 80-year-old recycled windows, suspended them among the trees, and connected them with rope bridges strung with fairy lights. The result became Airbnb\'s original #1 Most Wished-For listing in the world — a title it held for years. At $195 per night for two guests, it remains one of the most extraordinary stays in any American city, let alone one where the airport is twenty minutes away. The 1,820 reviews carry a 4.97 rating, which is the kind of consistency that makes you trust the algorithm.'),

        // 2. Toccoa Waterfall Treehouse
        h2('The One With the Waterfall'),
        embedBlock(STAY_MAP['toccoa-waterfall-treehouse-ga']),
        para('A private waterfall cascading directly below your deck. That sentence alone should be enough, but the details compound: the Toccoa River downstream, the Blue Ridge mountain ridge line at dawn, a hot tub positioned so the mist from the falls reaches you on the right kind of evening. $315 per night, 4.97 across 224 reviews. This is the treehouse for people who thought they\'d seen everything the Southeast had to offer.'),

        // 3. Redwood Treehouse
        h2('Among Giants'),
        embedBlock(STAY_MAP['redwood-treehouse-ca']),
        para('Minutes from Muir Woods, suspended in a grove of redwoods that predate the country. The beams soar. The windows face nothing but trunk and canopy. The creek below provides the only alarm clock worth setting. Six guests, $385 per night, and a 4.96 rating from 312 reviewers who apparently all agreed that this was the place where their expectations of a "treehouse" were permanently upgraded. One of the few treehouse stays in America that welcomes dogs.'),

        // 4. TreeHouse Point — Temple of the Blue Moon
        h2('The Parthenon in the Pines'),
        embedBlock(STAY_MAP['treehouse-point-temple-wa']),
        para('Pete Nelson built his first treehouse at twelve years old. Decades later, he built TreeHouse Point on the Raging River in Fall City, Washington — thirty minutes from Seattle and a world away from it. The Temple of the Blue Moon is his flagship: inspired by classical Parthenon lines, wrapped in old-growth forest, with river views that reframe what "window" means. Two guests, $489 per night, and the rare distinction of being a treehouse designed by someone who has dedicated his entire career to them.'),

        // 5. Meadowlark Treehouse
        h2('Where the Trees Grow Through the Floor'),
        embedBlock(STAY_MAP['meadowlark-treehouse-mt']),
        para('Two living trees grow straight through the interior of this two-story treehouse in Columbia Falls, Montana. Not around it. Through it. The floor, the ceiling, the decks on all four sides — the trees are structural participants, not decoration. Featured on HGTV and DIY Network, and located thirty minutes from Glacier National Park. $429 per night for four guests, with a 4.86 rating from 312 reviews. The living trees are the headline, but the setting — mountain light through Montana pine — is what you\'ll remember.'),

        // 6. Rocky Mountain Treehouse
        h2('Fifty Years in the Canopy'),
        embedBlock(STAY_MAP['rocky-mountain-treehouse-co']),
        para('In 1971, someone built a treehouse twenty-five feet above Cattle Creek in the Roaring Fork Valley, Colorado. Over fifty years later, it\'s still there — still hosting guests, still making the same impression it made when Nixon was president. The charm is not in luxury (though it has what you need); it\'s in the fact that this structure has been standing in the canopy for longer than most of its guests have been alive. $285 per night, 4.93 rating from 287 reviews, and the best value on this list for what it delivers.'),

        // 7. Planetarium Treehouse
        h2('The Observatory in the Oaks'),
        embedBlock(STAY_MAP['planetarium-treehouse-ar']),
        para('One of 100 worldwide winners of Airbnb\'s OMG! Fund — a contest that received tens of thousands of entries and selected the most extraordinary ideas. This one: a planetarium-themed treehouse overlooking Beaver Lake in the Arkansas Ozarks, designed so the stargazing experience is built into the architecture rather than left to chance. $255 per night, 4.94 rating from 138 reviewers, and proof that the middle of the country is building things worth crossing state lines for.'),

        // 8. The Elm at Treehouse Grove
        h2('The Master\'s Work'),
        embedBlock(STAY_MAP['elm-treehouse-grove-tn']),
        para('Pete Nelson\'s second appearance on this list — this time in the Smoky Mountains. The Elm is part of Treehouse Grove at Norton Creek, a collection of luxury treehouses perched over mountain streams. The design is unmistakably Nelson: sophisticated, warm, built to feel like the forest invited you rather than the other way around. $568 per night. The most expensive stay on this list, and the 4.97 rating across 452 reviews says the price is justified.'),

        // 9. Willow Treehouse
        h2('The Architect\'s Glass Box'),
        embedBlock(STAY_MAP['willow-treehouse-ny']),
        para('UK architect Antony Gibbon designed this 500-square-foot glass treehouse on 34 private acres near Woodstock, New York. There is no WiFi. There is no cell service. There is a wood-fired hot tub, a private swimmable pond, a vinyl collection, and 34 acres of Catskill forest that ask nothing of you except that you show up. $295 per night for two, 4.97 from 198 reviews. The only treehouse on this list where the absence of connectivity is the point.'),

        // 10. BaseCamp TreeLoft
        h2('The Midwest\'s Perfect Score'),
        embedBlock(STAY_MAP['basecamp-treeloft-mo']),
        para('A 5.0 rating across 692 reviews. Read that again. Not 4.9. Not 4.97. Five point zero. Nearly seven hundred people stayed here and not one of them found a reason to dock a star. That\'s not a rating — that\'s a consensus. The TreeLoft is the first of two treehouses at BaseCamp in Perryville, Missouri, designed for cozy seclusion, romance, and rest. Private hot tub, string lights, Missouri woods. $245 per night. The Midwest\'s best-kept secret, except 692 people have already told the internet.'),

        // How to Choose section
        h2('How to Choose Your Treehouse'),
        para('Not all treehouses serve the same purpose. Some are for disappearing. Some are for celebrating. Some are for proving to yourself that you still know how to climb a ladder. Here\'s how we\'d decide:'),

        para('For romance: Willow Treehouse or BaseCamp TreeLoft — both are built for two, both have hot tubs, and both offer the kind of seclusion that makes a long weekend feel like a real trip rather than a change of address.'),
        para('For a group: Redwood Treehouse sleeps six in a grove of ancient giants. The math works for two couples or a family that\'s ready to graduate from hotel rooms.'),
        para('For the experience over the room: The Secluded Intown Treehouse. The rope bridges, the fairy lights, the recycled windows — this is the one that makes people say "I stayed in a treehouse" and mean something specific by it.'),
        para('For budget: The Rocky Mountain Treehouse at $285 per night, or the BaseCamp TreeLoft at $245. Both deliver far more than their price suggests.'),
        para('Book ahead. Treehouse seasons fill faster than hotels, the inventory is smaller, and the best properties are often booked months in advance. If you\'re reading this in spring, your window for a fall trip is now.'),

        hr(),
        para('The treehouse collection is growing in the directory — and these ten are just the beginning. Browse the full collection at uniquestaysusa.com/collection?category=treehouses.'),
      ],
    },
  }

  // 5. Update: hero + linkedStays first, then content (two-step like workcation script)
  console.log('Step 1: Updating heroImage + linkedStays...')
  await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: {
      heroImage: media.id as number,
      linkedStays: stayIds,
    } as any,
  })
  console.log('Hero image + linked stays updated.')

  console.log('Step 2: Updating content with stayEmbed blocks...')
  const updated = await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: { content } as any,
  })

  console.log(`\nPost updated successfully!`)
  console.log(`  Hero image: ${media.id}`)
  console.log(`  Linked stays: ${stayIds.join(', ')}`)
  console.log(`  Content children: ${(updated.content as any).root.children.length}`)
  console.log(`  View at: https://www.uniquestaysusa.com/journal/${POST_SLUG}`)

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
