// Updates the Workcation Manifesto blog post with stayEmbed blocks, linkedStays, and hero image
// Run: pnpm exec tsx --env-file=.env.local scripts/update-workcation-post.ts

import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'

const POST_SLUG = 'workcation-manifesto-remote-work-treehouse'

// Hero image — Rustic cabin on a mountainside at sunset (Unsplash)
const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?fm=jpg&q=85&w=2400&auto=format&fit=crop'

// Stay IDs to embed and link
const STAY_IDS = [34, 16, 40] // Fox A-Frame, Modern Dome, Wellington Cottage

async function main() {
  const payload = await getPayload({ config })

  // 1. Upload hero image
  console.log('Downloading hero image...')
  const imgRes = await fetch(HERO_IMAGE_URL)
  if (!imgRes.ok) throw new Error(`Failed to fetch hero image: ${imgRes.status}`)
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
  console.log(`Downloaded ${(imgBuffer.byteLength / 1024).toFixed(0)}KB`)

  // Check if hero already uploaded
  const existingMedia = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'workcation-hero.jpeg' } },
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
      data: { alt: 'Creekside A-frame cabin in the Colorado Rockies — the perfect workcation escape' },
      file: { data: imgBuffer, mimetype: 'image/jpeg', name: 'workcation-hero.jpeg', size: imgBuffer.byteLength },
    })
    console.log(`Media created: id=${media.id}`)
  }

  // 2. Verify stays exist (just need IDs for relationship)
  console.log('Verifying stays...')
  for (const id of STAY_IDS) {
    const stay = await payload.findByID({ collection: 'stays', id, depth: 0 })
    console.log(`  Found: ${stay.title} (id=${id})`)
  }

  // 3. Build stayEmbed blocks (relationship field stores just the ID)
  const stayEmbeds = STAY_IDS.map(id => ({
    type: 'block',
    version: 2,
    fields: {
      blockType: 'stayEmbed',
      id: crypto.randomUUID(),
      stay: id,
    },
  }))

  // 4. Build content
  function text(t: string, format = 0) {
    return { type: 'text', text: t, format, style: '', mode: 'normal', detail: 0, version: 1 }
  }
  function boldText(t: string) { return text(t, 1) }
  function italicText(t: string) { return text(t, 2) }
  function linkText(t: string) {
    return text(t, 4) // underlined instead of link since LinkFeature not enabled
  }
  function para(children: any[]) {
    return { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', children }
  }
  function heading(textContent: string) {
    return { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(textContent)] }
  }

  const content = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        heading('The Workcation Manifesto: Why Your Next Remote Work Week Should Be in a Treehouse'),
        para([text("You're reading this from a desk. I'd bet money on it.")]),
        para([text("Maybe it's a standing desk in a spare bedroom, or a corner table at a coworking space that charges $350 a month for the privilege of hearing someone else's sales calls. Maybe it's your kitchen table, where the ergonomic situation is \"laptop on a cookbook\" and your back has been sending complaint letters since Tuesday.")]),
        para([text("Here's a number: 68% of remote workers have taken a workcation. More than two out of three. That's not a trend anymore — that's just how people work now.")]),
        para([text("And here's the part most people get wrong about workcations: they book a boring place in a fun city. A corporate apartment in Austin. A beach condo in San Diego with \"resort WiFi\" that peaks at 12 Mbps on a good day. They spend the week in a room that looks like every other room they've ever worked in, except there's a palm tree visible through the window.")]),
        para([text("The room isn't the problem. The room was never the problem. The problem is spending your work hours in a space designed for nobody in particular, in a place you'll forget by next month.")]),

        heading('The Case for Working Somewhere Extraordinary'),
        para([text("The best work happens when your environment does something to your brain that a cubicle can't.")]),
        para([text("There's actual science behind this, though you probably don't need a study to tell you that staring at a forest canopy from 25 feet up produces a different quality of thinking than staring at a whiteboard with someone else's Sprint retrospective still on it. The shift is immediate. The canopied light changes how you see the screen. The sounds — wind, birds, a creek somewhere below — replace the ambient drone of HVAC and notifications.")]),
        para([text("And then the work gets better. Not because you're trying harder. Because your brain is in a different mode.")]),
        para([text("WiFi quality is now a top-three booking factor for vacation rentals — it was barely top ten in 2020. The infrastructure has caught up. You can get 500 Mbps fiber in a geodome in the Shawnee National Forest. Starlink covers properties that used to be genuinely off-grid. The \"no WiFi\" excuse is dead.")]),
        para([text("What hasn't caught up is how people think about where they work. Most remote workers still approach a workcation like they're sneaking work into a vacation. They should be thinking about it the other way around: sneaking vacation into work.")]),

        heading('What a Real Workcation Looks Like'),
        para([text("Forget the stock photo version — laptop on a beach, sunset, margarita within arm's reach. Nobody actually works on a beach. The glare is terrible, the sand destroys keyboards, and you'll spend the whole day squinting at a screen you can't read.")]),
        para([text("A real workcation is a Monday morning where you wake up in a treehouse, make coffee on a wood-burning stove, and take your first call at a desk that overlooks a mountain valley instead of a parking garage. You work the same hours. You meet the same deadlines. But at 6 PM you don't close your laptop and stare at the same four walls. You close your laptop and walk out onto a deck that's suspended in the canopy, and you eat dinner watching the light change over the Blue Ridge.")]),
        para([text("That's not a fantasy. That's Tuesday.")]),

        heading('Three Properties That Get It Right'),
        para([text("We built a whole work-friendly category on UniqueStaysUSA because the existing filters on most platforms are useless. \"WiFi available\" tells you nothing. Every property on earth claims WiFi. What matters is the speed, the reliability, and whether there's an actual workspace — not a breakfast bar that's supposed to double as a desk.")]),
        para([text("Here are three that do it properly:")]),

        // Stay 1: Fox A-Frame (id=34)
        heading('The Fox A-Frame | An Intimate Mountain Retreat'),
        stayEmbeds[0],
        para([text("An A-frame cabin in the Colorado Rockies with real internet and a real workspace. The kind of place where you close the laptop and you're already in vacation mode — no travel required. The mountains are right there. Ski season, hiking season, or the quiet months in between when Breckenridge belongs to the locals.")]),
        para([text("The Fox A-Frame sits creekside, five minutes from downtown Breckenridge, which means you can finish a day of calls and be on a trail in ten minutes. The sound of the creek is the only background noise your microphone will pick up — and your colleagues will notice. At $285 per night with a 4.86 rating across 229 reviews, this is the workcation sweet spot: affordable enough for a full week, remote enough to feel like an escape, connected enough that nobody on the other end of your Zoom call will know the difference.")]),

        // Stay 2: Modern Dome (id=16)
        heading('Modern Dome in Shawnee Forest'),
        stayEmbeds[1],
        para([text("Yes, a dome in a national forest has better internet than most downtown apartments. The universe has a sense of humor. The forest is quiet enough to think. The internet is fast enough to forget you're not in an office.")]),
        para([text("At $250 per night with a 4.99 rating across 126 reviews, the Modern Dome in Shawnee Forest is the most complete dome experience in the Midwest. The 500 Mbps fiber connection is the headline — but the 6-person hot tub, outdoor TV, fire pit, and rainfall shower are what make it a full experience rather than a novelty. You work from the dome during the day, soak in the hot tub at dusk, and fall asleep to the sound of wind through tall pines. The Shawnee National Forest surrounds you on all sides. This is what \"remote work\" was supposed to mean.")]),

        // Stay 3: Wellington Cottage (id=40)
        heading('Wellington Cottage | Modern Boho Work Retreat'),
        stayEmbeds[2],
        para([text("The best value on this list. A modern boho cottage in Asheville with fiber internet and a proper workspace. Asheville has the restaurant scene, the brewery scene, the Blue Ridge Parkway — and this cottage has the bandwidth to let you enjoy all of it without falling behind.")]),
        para([text("At $179 per night, Wellington Cottage is the most accessible entry point on this list. The dedicated workspace and fast WiFi mean business as usual during working hours. The Blue Ridge Mountains outside your window mean everything else is extraordinary. Step out for a morning walk on the Parkway between meetings. Grab lunch at one of Asheville's celebrated restaurants. Close the laptop at 5 and watch the sunset paint the mountains. This is what a $179 workcation looks like when you stop settling for corporate apartments.")]),

        heading('The Practical Part'),
        para([text("If you're going to do this — and you should — here's what we've learned from the listings and the data:")]),
        para([boldText('Book at least five nights.'), text(' The sweet spot for a workcation is 5-7 days. Two days is a disruption, not a reset. Five days gives you time to settle in, establish a routine, and actually experience the place. 28-day-plus stays are the fastest growing segment on Airbnb — some people never go back.')]),
        para([boldText('Test the WiFi before your first call.'), text(' Even properties with listed speeds can have dead zones. Run a speed test from the exact spot where you\'ll be working, not from the front door.')]),
        para([boldText('Book early in the week.'), text(' Sunday through Thursday is cheaper at almost every property. Friday and Saturday are when the weekend crowd shows up and the rates double. A Monday-to-Friday workcation at a treehouse can cost less than a weekend at a Holiday Inn.')]),
        para([boldText('Tell your team.'), text(" Not because you need permission. Because your background on Zoom will be a forest canopy, and someone will ask. Might as well get ahead of it.")]),
        para([boldText('Bring the right cable.'), text(' Many of these properties have the bandwidth but not the ethernet port. A USB-C to ethernet adapter costs $15 and saves you from the "WiFi is fine except when it isn\'t" experience.')]),

        heading('Why This Matters'),
        para([text("The remote work revolution already happened. The office is optional for millions of people, and that's not going back. What hasn't happened yet is the second-order realization: if you can work from anywhere, \"anywhere\" should be somewhere worth being.")]),
        para([text("You don't need to work from a treehouse. But you could. The WiFi is fast enough, the desk is real, and the view beats the coworking space. The only thing standing between you and a Tuesday morning in the canopy is the assumption that work has to happen in a space designed for work.")]),
        para([text("It doesn't. It just needs good internet and a place to sit.")]),
        para([text("We found both. In treehouses, domes, A-frames, and cottages across the country. They're waiting at uniquestaysusa.com/work-friendly.")]),
        para([text('Go work somewhere worth remembering.')]),

        { type: 'horizontalrule', version: 1 },
        para([italicText('UniqueStaysUSA — The Wanderer\'s Postcard Collection. Extraordinary stays, curated by people who actually stayed there.')]),
      ],
    },
  }

  // 5. Find and update the blog post
  const posts = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    limit: 1,
    depth: 0,
  })
  if (posts.totalDocs === 0) throw new Error(`Post not found: ${POST_SLUG}`)
  const post = posts.docs[0]
  console.log(`Found post: id=${post.id}, title="${post.title}"`)

  // First: test update with just heroImage + linkedStays (no content change)
  console.log('Step 1: Updating heroImage + linkedStays...')
  await payload.update({
    collection: 'blog-posts',
    id: post.id as number,
    data: {
      heroImage: media.id as number,
      linkedStays: STAY_IDS,
    } as any,
  })
  console.log('Hero image + linked stays updated.')

  // Second: update content
  console.log('Step 2: Updating content with stayEmbed blocks...')
  try {
    const updated = await payload.update({
      collection: 'blog-posts',
      id: post.id as number,
      data: {
        content,
      } as any,
    })
    console.log(`Post updated successfully!`)
    console.log(`  Hero image: ${media.id}`)
    console.log(`  Linked stays: ${STAY_IDS.join(', ')}`)
    console.log(`  Content children: ${(updated.content as any).root.children.length}`)
  } catch (err: any) {
    console.error('Content update failed!')
    console.error('Error:', err.message)
    if (err.data?.errors) {
      for (const e of err.data.errors) {
        console.error('  Error detail:', JSON.stringify(e, null, 2))
      }
    }
    // Write the content JSON for debugging
    fs.writeFileSync('/tmp/workcation-content-debug.json', JSON.stringify(content, null, 2))
    console.log('Content written to /tmp/workcation-content-debug.json for debugging')
    process.exit(1)
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
