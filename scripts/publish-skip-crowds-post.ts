// Publishes "Skip the Crowds: National Park Alternatives" post to Payload CMS
// Run: pnpm exec tsx --env-file=.env.local scripts/publish-skip-crowds-post.ts

import { getPayload } from 'payload'
import config from '@payload-config'

const POST_SLUG = 'skip-the-crowds-national-park-alternatives'

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

function hr() {
  return { type: 'horizontalrule', version: 1 }
}

// Stay IDs from Payload - must match the slugs in the article
const STAY_IDS: Record<string, number> = {
  'stargazer-aframe-abingdon-va': 122,
  'escalante-yurt-resort-ut': 88,
  'glamping-montana': 38,
  'sierra-dome-arnold-ca': 131,
  'houseboat-nomad-pemaquid-me': 199,
  'hanksville-cave-home-ut': 21,
  'safari-tent-buena-vista-co': 104,
  'blue-ridge-river-aframe-wv': 125,
  'waterfront-aframe-rhododendron-or': 107,
  'coconino-aframe-flagstaff-az': 111,
}

const linkedStayIds = Object.values(STAY_IDS)

const content = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      para('There is a particular disappointment that no travel writer talks about honestly. You saved up. You planned for months. You drove six hours or flew across the country. And when you arrived, you found a parking lot, a queue, and a crowd so dense that the landscape you came to see was barely visible behind the selfie sticks.'),

      para('It happens at the Grand Canyon. It happens at Zion. It happens at every place the travel industry has decided is worth a photograph. The National Park Service reported over 325 million recreation visits in 2025, and the math is unforgiving: that many people, concentrated into 63 parks, with the vast majority funneling into the same ten.'),

      para('The places below are not consolation prizes. They are quieter, cheaper, less mediated by tourism infrastructure, and more likely to produce the kind of experience that made you want to travel in the first place. Each one pairs a crowded park with a specific alternative, and each alternative comes with a place to stay that puts you inside the landscape rather than driving past it.'),

      // 1. Dark Skies and Empty Trails
      h2('Dark Skies and Empty Trails'),

      para('Great Smoky Mountains National Park received 11.5 million visitors in 2025. Eleven and a half million. The gateway towns of Gatlinburg and Pigeon Forge have become tourism monocultures of go-kart tracks and outlet malls. The most popular trails are so congested on weekends that the Park Service has implemented timed-entry permits. You did not cross the country to stand in a line on a mountain.'),

      para('The Virginia Blue Ridge offers the same ridge-line grandeur at roughly 12% of the traffic. Abingdon sits at the edge of the Virginia Highlands, where the Virginia Creeper Trail follows an old railroad grade for 34 miles through deciduous forest, and Mount Rogers rises to 5,729 feet, the highest point in the state. The air is clean. The trails are quiet. And at night, the Bortle-class dark skies over the Highlands produce a Milky Way so dense it reads as a physical structure, not a smear of light.'),

      embedBlock(STAY_IDS['stargazer-aframe-abingdon-va']),

      para('The Stargazer Cabin is a timber A-frame on a hillside above a mountain lake, 15 minutes from Abingdon. Two bedrooms, a wall of glass facing the Blue Ridge, and a deck built for the specific purpose of watching the sky go dark. $178 a night, 4.94 across 89 reviews. The kind of quiet that recalibrates something. If the Blue Ridge calls to you, our guide to the most extraordinary treehouses in America includes two more Virginia stays worth the detour.'),

      // 2. Slot Canyons Without the Shuttle
      h2('Slot Canyons Without the Shuttle'),

      para('Zion received 4.9 million visitors in 2025. Angels Landing now requires a permit lottery. The shuttle system that was introduced to reduce congestion has itself become congested. The Narrows, the park\'s signature hike, is so popular on summer weekends that rangers describe the experience as "a traffic jam in a river."'),

      para('Eighty miles northeast, the Grand Staircase-Escalante National Monument protects 1.87 million acres of the Colorado Plateau. Slot canyons, sandstone arches, petrified wood, and some of the most remote terrain in the contiguous United States. The monument receives roughly a quarter of Zion\'s traffic spread across an area nearly four times as large. You can hike an entire day here without seeing another human being.'),

      embedBlock(STAY_IDS['escalante-yurt-resort-ut']),

      para('The Escalante Yurt Resort sits half a mile from the monument boundary, equidistant between all five Utah national parks. Private bathroom, gourmet breakfast, and slot canyon hikes that start from the front gate. $289 a night, 4.95 across 143 reviews. The kind of place that makes you realize "camping" and "comfort" were never actually opposed.'),

      // 3. The Wild North Fork
      h2('The Wild North Fork'),

      para('Yellowstone\'s boardwalks around Old Faithful and Grand Prismatic Spring are genuinely crowded from June through August. The wildlife viewing has become a spectator sport conducted from the windows of rental cars backed up along the park road. Four and a half million people, concentrated in the same two thermal basins.'),

      para('Glacier National Park gets its share of attention, but the North Fork section, accessible only via a gravel road from the tiny town of Polebridge, sees a fraction of the traffic that chokes the Going-to-the-Sun Road. The North Fork is the wild part of Glacier. Grizzly country. Wolf country. The kind of landscape where the sound of the river replaces the sound of car doors. Polebridge itself is a town of roughly 50 permanent residents, a general store that sells fresh-baked huckleberry bear claws, and the northernmost mercantile in the lower 48.'),

      embedBlock(STAY_IDS['glamping-montana']),

      para('A safari tent in the North Fork River Valley, 10 minutes from the park\'s wild entrance and 30 minutes from Going-to-the-Sun. Off-grid, quiet, and $123 a night. 4.94 across 89 reviews. The cheapest stay on this list, and possibly the most memorable.'),

      // 4. Dome and Sequoia
      h2('Dome and Sequoia'),

      para('Yosemite Valley in July is one of the most concentrated tourism experiences in America. The park received 3.7 million visitors in 2025, and the valley floor funnels most of them into a seven-square-mile area where the traffic noise never quite stops. Half Dome permits are awarded by lottery. The meadows that John Muir wrote about are now bordered by parking lots.'),

      para('The Sierra Nevada foothills, two hours south, contain the same granite and forest and light, without the crowds. Calaveras Big Trees State Park protects a grove of giant sequoias, some exceeding 250 feet, that receive a fraction of Yosemite\'s foot traffic. The hiking trails in the Stanislaus National Forest are empty on weekdays. The Gold Rush towns along Highway 4, from Murphys to Arnold, have the quiet self-possession of places that were interesting long before the travel industry noticed them.'),

      embedBlock(STAY_IDS['sierra-dome-arnold-ca']),

      para('A geodesic dome in the Sierra Nevada forest near Arnold, with hiking trails from the front door. Two bedrooms, two baths, king master suite, and the kind of curved architecture that makes a rectangular room feel like a constraint. $250 a night, 4.88 across 113 reviews. Calaveras County is not a detour. It is an argument for paying less attention to brand names.'),

      // 5. The Quiet Coast
      h2('The Quiet Coast'),

      para('Bar Harbor and Acadia National Park receive 3.5 million visitors a year, with cruise ships disgorging thousands of day-trippers onto a Main Street that has been progressively converted from a working fishing community into a tourism service economy. The town\'s population of 5,500 is overwhelmed from June through September.'),

      para('Mid-coast Maine, 90 miles southwest, is what Bar Harbor used to be. Fishing villages, working harbors, lobster boats that are not painted for photographs. The peninsula towns of Bremen, Damariscotta, and New Harbor sit on a stretch of coastline where the tidal rhythm still governs the day. Lake Pemaquid is a freshwater lake ringed with white pines, quiet enough that the loons are the loudest thing on the water at dawn.'),

      embedBlock(STAY_IDS['houseboat-nomad-pemaquid-me']),

      para('NOMAD is a classic houseboat on Lake Pemaquid, two bedrooms with a wrap deck, moored in a cove where the pine trees come down to the waterline. $275 a night, 4.88 across 172 reviews. The kind of morning where the coffee is still warm when you realize you have not checked your phone in two hours.'),

      // 6. The Cowboy's Cave
      h2('The Cowboy\'s Cave'),

      para('Moab receives more than three million visitors a year against a permanent population of 5,000. Arches National Park now requires timed-entry reservations and frequently reaches capacity by mid-morning. The town\'s housing costs have displaced the outdoor-recreation community that made Moab worth visiting in the first place.'),

      para('Capitol Reef is the least-visited of Utah\'s "Mighty Five" national parks, roughly 26% of Zion\'s traffic. The Fruita Historic District, a 19th-century Mormon settlement inside the park, still maintains 2,700 fruit trees that visitors can pick from during harvest season. There is no shuttle. There is no lottery. There is just a 100-mile geologic monocline called the Waterpocket Fold that produces some of the most varied landscape on the Colorado Plateau.'),

      para('Thirty miles east of Capitol Reef, outside Hanksville, a local cowboy named A.C. Ekker decided in the 1980s that he wanted to live in a cliff. He blasted a home directly into the red rock. The result is a two-bedroom cave dwelling, recently remodeled with modern plumbing and electricity, that maintains the essential character of a man who looked at a sandstone wall and saw a floor plan.'),

      embedBlock(STAY_IDS['hanksville-cave-home-ut']),

      para('$225 a night, 4.85 across 242 reviews. The walls are the earth. The ceiling is the cliff. The nearest neighbor is a horizon line. Ekker\'s cave is proof that the most interesting places to stay are usually built by people who were not trying to impress anyone.'),

      // 7. Canvas and the Arkansas River
      h2('Canvas and the Arkansas River'),

      para('Rocky Mountain National Park\'s Trail Ridge Road and Bear Lake corridor received 4.1 million visitors in 2025. The parking lots at the most popular trailheads fill by 8 a.m. from June through September. Estes Park, the gateway town, has the tourism density of a ski resort in July.'),

      para('The Arkansas River valley near Buena Vista, two hours south, contains the same Rocky Mountain granite, the same alpine light, and a river that is genuinely wild. The Arkansas Headwaters Recreation Area manages 152 miles of river, from Class II float trips to Class V rapids, and the mountain biking trails in the surrounding San Isabel National Forest are empty compared to anything near the Front Range. The Collegiate Peaks, a string of fourteeners that frame the valley to the west, produce sunsets that stop conversations.'),

      embedBlock(STAY_IDS['safari-tent-buena-vista-co']),

      para('A safari tent ranked #1 in America by a national glamping roundup. Plumbed, heated, king bed, mountain views that earned the ranking. $155 a night, 4.96 across 389 reviews. The kind of place that makes you understand why "glamping" was invented. Not as a compromise between camping and comfort, but as an argument that you can have both. For more stays in this price range with this kind of rating, see our roundup of the best A-frame cabin rentals in America.'),

      // 8. America's Newest Park
      h2('America\'s Newest Park'),

      para('Asheville\'s Blue Ridge Parkway corridor has become one of the most congested tourism routes in the eastern United States. The city\'s short-term rental saturation has driven housing costs to levels that have displaced much of the creative community that made Asheville distinctive. The parkway itself, especially near the most photographed overlooks, resembles a parking lot on autumn weekends.'),

      para('New River Gorge became a national park in December 2020. Seventy thousand acres of sandstone cliffs, old-growth forest, and one of the oldest rivers in North America, carved through the Appalachian Plateau over an estimated 320 million years. The park receives 1.6 million visitors a year, but the vast majority concentrate around the famous New River Gorge Bridge, leaving the backcountry largely empty. The climbing routes, over 1,400 of them on Nuttall sandstone, are some of the best in the eastern United States. The whitewater, Class IV-V on the Lower Gorge, draws paddlers from across the country.'),

      embedBlock(STAY_IDS['blue-ridge-river-aframe-wv']),

      para('A riverside A-frame in Thurmond, West Virginia, nine miles from McRitchie Winery and the best whitewater rafting in the East. $185 a night, 4.9 across 58 reviews. The New River is not an alternative to the Blue Ridge. It is the Blue Ridge without the audience.'),

      // 9. Mountain and Water
      h2('Mountain and Water'),

      para('Olympic National Park\'s Hoh Rain Forest and Hurricane Ridge received 2.9 million visitors in 2025. The rain forest\'s Hall of Mosses trail, a 0.8-mile loop, can feel like a museum exhibit with a line. The park\'s coastal sections, while spectacular, are managed for the volume of foot traffic they receive.'),

      para('The Mt. Hood corridor, 90 minutes south, offers the same Pacific Northwest intensity of forest, water, and volcanic geology without the national park branding that drives the crowds. Timberline Lodge, the 1936 WPA masterpiece on Mt. Hood\'s south face, is open to the public year-round and sees a fraction of Olympic\'s traffic. The Pacific Crest Trail crosses Highway 26 near Rhododendron, and the section north toward Mt. Hood is one of the most beautiful and least-hiked stretches of the entire trail.'),

      embedBlock(STAY_IDS['waterfront-aframe-rhododendron-or']),

      para('A classic Pacific Northwest A-frame on the water in Rhododendron, with a wraparound deck and full kitchen. Ski Timberline in winter, hike the PCT in summer. Both are minutes from the front door. $189 a night, 4.88 across 217 reviews. The kind of place where the distinction between indoor and outdoor dissolves somewhere around the second cup of coffee.'),

      // 10. Ponderosa and the Canyon's Shadow
      h2('Ponderosa and the Canyon\'s Shadow'),

      para('Grand Canyon South Rim received 4.7 million visitors in 2025. The rim trail between Mather Point and Yavapai Observation Station is so congested on summer mornings that rangers have compared it to a theme park queue line. The sunrise photographs that appear in every Arizona tourism brochure are real. What the brochures do not show is the 40-minute wait for a parking space that precedes them.'),

      para('Flagstaff sits 90 minutes south, at 6,900 feet, in the largest contiguous ponderosa pine forest on earth. The Coconino National Forest surrounds the city with 1.8 million acres of high-altitude wilderness that receives a fraction of the canyon\'s traffic. The Arizona Snowbowl ski area, on the flanks of the San Francisco Peaks, offers a scenic chairlift ride to 11,500 feet with views across the entire Colorado Plateau. The Grand Canyon is within an hour\'s drive, which means you can visit it on your terms, in the early morning or late afternoon, and spend the rest of your trip in a place where the air smells like pine resin instead of exhaust.'),

      embedBlock(STAY_IDS['coconino-aframe-flagstaff-az']),

      para('An A-frame cabin on 1.5 private acres bordering the Coconino National Forest, surrounded by ponderosa pines tall enough to block the satellite signal. Flagstaff\'s walkable downtown is 15 minutes away. The Grand Canyon is an hour. $185 a night, 4.89 across 143 reviews. The trees make a sound in the wind that is not silence but might as well be.'),

      // How to Plan Your Escape
      h2('How to Plan Your Escape'),

      para('The 10 pairs above share a pattern. The crowded parks have a single iconic feature that the travel industry has decided is worth a photograph, and they are located on or near major transportation routes. The alternatives require either more effort to reach or more willingness to engage with a landscape on its own terms.'),

      para('For solitude: Polebridge, Montana, and Escalante, Utah. The two most remote stays on this list. Both reward the drive with the kind of silence that cities have made people forget exists.'),

      para('For budget: The North Fork safari tent ($123) and the Buena Vista safari tent ($155). Both under $160 a night, both rated above 4.9, both proof that the most memorable stays are not the most expensive ones.'),

      para('For couples: The Stargazer A-frame in Virginia and the Waterfront A-frame in Oregon. Both built around the idea that a wall of glass facing something beautiful is the only architectural statement that matters.'),

      para('For families: The Sierra Nevada dome (sleeps 6, $250) and the Coconino A-frame (sleeps 6, $185). Both give kids the kind of space that hotel rooms do not, in places where the outdoor activity starts at the front door.'),

      para('When to go: The shoulder seasons, April through May and September through October, are the answer to almost every question about timing. The crowds thin. The prices drop. The light in both periods, the long golden hours of spring and the low amber of autumn, produces the kind of photographs that do not require a caption. Summer is when everyone else goes. That is precisely the argument for going somewhere else.'),

      para('The stays listed here are part of the equation. A cave home near Capitol Reef, a houseboat on a Maine lake, a safari tent at the edge of Glacier. These are not just places to sleep. They are the mechanism by which a destination becomes an experience rather than a checklist.'),

      // FAQ
      h2('Frequently Asked Questions'),

      h3('What are the best national park alternatives for avoiding crowds?'),
      para('The least crowded alternatives to the most visited national parks include Shenandoah (12% of Great Smoky Mountains traffic), Capitol Reef (26% of Zion\'s traffic), Theodore Roosevelt in North Dakota (18% of Yellowstone\'s traffic), and Lassen Volcanic in California (13% of Yosemite\'s traffic). Each offers comparable geology and ecology with a fraction of the visitors.'),

      h3('When is the best time to visit national park alternatives?'),
      para('April through May and September through October offer the best combination of mild weather, lower prices, and minimal crowds. Summer brings peak visitation even to alternative destinations. Winter access varies by location, with some roads closing seasonally at higher elevations.'),

      h3('How much do unique stays near national parks cost?'),
      para('Prices range from $123 per night for a safari tent in Montana\'s North Fork to $289 for a luxury yurt resort near Utah\'s Grand Staircase. The average across the stays in this guide is $205 per night. All include amenities you would not expect at the price point: private bathrooms, king beds, hot tubs, direct trail access.'),

      h3('Are these national park alternatives suitable for families?'),
      para('Several destinations on this list accommodate families well. The Sierra Nevada geodesic dome sleeps 6 and has hiking from the front door. The Coconino A-frame in Flagstaff sleeps 6 and borders a national forest. The Virginia Blue Ridge A-frame sleeps 4 and is 15 minutes from the Virginia Creeper Trail, a 34-mile car-free path suitable for all ages.'),

      h3('How do I get to these alternative destinations?'),
      para('Most are accessible by car from major airports within 2 to 4 hours. Polebridge, Montana (Glacier North Fork) and Hanksville, Utah (Capitol Reef) are the most remote, requiring drives on gravel or secondary roads. That remoteness is the point. The destinations that require the most effort to reach tend to reward that effort most directly.'),
    ],
  },
}

async function main() {
  const payload = await getPayload({ config })

  // Check for existing post
  const existing = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: POST_SLUG } },
    depth: 0,
    limit: 1,
  })

  let postId: number

  if (existing.totalDocs === 0) {
    // Create new post
    const post = await payload.create({
      collection: 'blog-posts',
      data: {
        slug: POST_SLUG,
        title: 'Skip the Crowds: 10 National Park Alternatives With Extraordinary Places to Stay',
        subtitle: 'Overcrowded parks, quieter landscapes, and the stays that make the detour worth it',
        excerpt: 'Ten quieter alternatives to America\'s most crowded national parks, each paired with a specific place to stay that puts you inside the landscape instead of driving past it.',
        status: 'published',
        publishedAt: new Date().toISOString(),
        linkedStays: linkedStayIds,
        metaTitle: 'Skip the Crowds: National Park Alternatives | UniqueStaysUSA',
        metaDescription: 'Ten quieter alternatives to overcrowded national parks, each with a specific unique stay. From Glacier\'s North Fork to Capitol Reef\'s cave homes.',
      } as any,
    })
    postId = post.id
    console.log(`Created post ${postId}`)
  } else {
    postId = existing.docs[0].id
    // Update metadata
    await payload.update({
      collection: 'blog-posts',
      id: postId,
      data: {
        title: 'Skip the Crowds: 10 National Park Alternatives With Extraordinary Places to Stay',
        subtitle: 'Overcrowded parks, quieter landscapes, and the stays that make the detour worth it',
        excerpt: 'Ten quieter alternatives to America\'s most crowded national parks, each paired with a specific place to stay that puts you inside the landscape instead of driving past it.',
        status: 'published',
        publishedAt: new Date().toISOString(),
        linkedStays: linkedStayIds,
        metaTitle: 'Skip the Crowds: National Park Alternatives | UniqueStaysUSA',
        metaDescription: 'Ten quieter alternatives to overcrowded national parks, each with a specific unique stay. From Glacier\'s North Fork to Capitol Reef\'s cave homes.',
      } as any,
    })
    console.log(`Updated post ${postId} metadata`)
  }

  // Update content (separate call to avoid Payload content field issues)
  await payload.update({
    collection: 'blog-posts',
    id: postId,
    data: {
      content: content,
    } as any,
  })
  console.log(`Updated post ${postId} content`)

  // Verify
  const verified = await payload.findByID({
    collection: 'blog-posts',
    id: postId,
    depth: 1,
  })
  console.log(`\nPost verified:`)
  console.log(`  ID: ${verified.id}`)
  console.log(`  Slug: ${verified.slug}`)
  console.log(`  Title: ${verified.title}`)
  console.log(`  Status: ${verified.status}`)
  console.log(`  Linked stays: ${(verified.linkedStays as any[])?.length || 0}`)
  console.log(`  Published at: ${verified.publishedAt}`)

  await payload.destroy()
}

main().catch(console.error)
