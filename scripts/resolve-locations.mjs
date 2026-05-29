// Resolve location/state from slug patterns and known properties
// Run: export $(grep -v '^#' .env.local | xargs) && node scripts/resolve-locations.mjs

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pg = require('/Users/jon.high/unique-stays-next/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js')

const STATE_ABBREV = {
  'al':'Alabama','ak':'Alaska','az':'Arizona','ar':'Arkansas','ca':'California',
  'co':'Colorado','ct':'Connecticut','de':'Delaware','fl':'Florida','ga':'Georgia',
  'hi':'Hawaii','id':'Idaho','il':'Illinois','in':'Indiana','ia':'Iowa',
  'ks':'Kansas','ky':'Kentucky','la':'Louisiana','me':'Maine','md':'Maryland',
  'ma':'Massachusetts','mi':'Michigan','mn':'Minnesota','ms':'Mississippi','mo':'Missouri',
  'mt':'Montana','ne':'Nebraska','nv':'Nevada','nh':'New Hampshire','nj':'New Jersey',
  'nm':'New Mexico','ny':'New York','nc':'North Carolina','nd':'North Dakota','oh':'Ohio',
  'ok':'Oklahoma','or':'Oregon','pa':'Pennsylvania','ri':'Rhode Island','sc':'South Carolina',
  'sd':'South Dakota','tn':'Tennessee','tx':'Texas','ut':'Utah','vt':'Vermont',
  'va':'Virginia','wa':'Washington','wv':'West Virginia','wi':'Wisconsin','wy':'Wyoming',
  'dc':'District of Columbia',
}

// Manual overrides: id -> { location, state }
const MANUAL = {
  265: { location: 'Highlands', state: 'North Carolina' },       // slug has "highlands-nc"
  266: { location: 'Gatlinburg', state: 'Tennessee' },           // Smoky Mountains
  267: { location: 'Gatlinburg', state: 'Tennessee' },           // cabin on the river
  272: { location: 'Broken Bow', state: 'Oklahoma' },            // Pine Creek Haven
  273: { location: 'Seattle', state: 'Washington' },             // Mt Rainier view, Queen Anne area
  274: { location: 'Pembrokeshire', state: 'Wales' },            // Stonor is UK-based — non-US, flag
  275: { location: 'Greybull', state: 'Wyoming' },               // Glamping on the Greys
  293: { location: 'Accord', state: 'New York' },                // Catskills treehouse
  295: { location: 'Joshua Tree', state: 'California' },         // Invisible House
  297: { location: 'Hocking Hills', state: 'Ohio' },             // Carpenter's Cabin
  298: { location: 'Suches', state: 'Georgia' },                 // slug has "suches"
  299: { location: 'Broken Bow', state: 'Oklahoma' },            // Broken Bow area
  300: { location: 'Portland', state: 'Oregon' },                // Pacific Bin
  303: { location: 'Cayo', state: 'Belize' },                    // Non-US — flag
  304: { location: 'Rockwall', state: 'Texas' },                 // enjoyuniquestays
  305: { location: 'Fall City', state: 'Washington' },           // Treehouse Point
  306: { location: 'Denmark', state: 'Maine' },                  // Baumhaus Cabin
  307: { location: 'Sinclair', state: 'Maine' },                 // Sunset Cove
  308: { location: 'North Hero', state: 'Vermont' },             // Timber Stilts
  309: { location: 'Palmetto', state: 'Georgia' },               // Alpaca Treehouse
  310: { location: 'Atlanta', state: 'Georgia' },                // Birdsong double-decker bus
  311: { location: 'Seattle', state: 'Washington' },             // Queen Anne
  312: { location: 'Van Buren County', state: 'Michigan' },      // slug
  313: { location: 'Douglas County', state: 'Oregon' },          // slug
  314: { location: 'Broken Bow', state: 'Oklahoma' },            // luxury cabin hot tub
  315: { location: 'Owego', state: 'New York' },                 // slug
  316: { location: 'Juneau County', state: 'Wisconsin' },        // slug, Wisconsin Dells area
  317: { location: 'Welches', state: 'Oregon' },                 // slug
  318: { location: 'Nash Point', state: 'Wales' },               // VRBO UK — non-US, flag
  319: { location: 'Beaufort', state: 'North Carolina' },        // slug
  320: { location: 'Chattanooga', state: 'Tennessee' },          // slug
  321: { location: 'Incline Village', state: 'Nevada' },         // Tahoe, slug
  322: { location: 'Gatlinburg', state: 'Tennessee' },           // slug, Norton Creek
  323: { location: 'Warren County', state: 'Kentucky' },         // slug
  324: { location: 'Vallejo', state: 'California' },             // slug
  325: { location: 'Polk County', state: 'Florida' },            // slug
  326: { location: 'Fannin County', state: 'Georgia' },          // slug
  327: { location: 'Blue Ridge', state: 'Georgia' },             // A-frame hot tub forest
  328: { location: 'Big Sur', state: 'California' },             // cliffside bungalow
  329: { location: 'Gatlinburg', state: 'Tennessee' },           // Smoky Mountain treehouse
  330: { location: ' Asheville', state: 'North Carolina' },      // riverside retreat sauna
  331: { location: 'Gatlinburg', state: 'Tennessee' },           // Solace Sphere
  332: { location: 'Moundsville', state: 'West Virginia' },      // Washington Bottom
  333: { location: 'Old Fort', state: 'North Carolina' },        // Catawba Falls
  334: { location: 'Marshall', state: 'North Carolina' },        // Panther Branch Farm
  335: { location: 'Asheville', state: 'North Carolina' },       // luxury treehouse
  336: { location: 'Covington', state: 'Georgia' },              // Vampire Diaries Lockwood
  337: { location: 'Freeport', state: 'Maine' },                 // slug
  338: { location: 'Hocking Hills', state: 'Ohio' },             // timber frame
  339: { location: 'Fredericksburg', state: 'Texas' },           // walk to Main St
  340: { location: 'Fredonia', state: 'Kentucky' },              // 250-acre estate
  341: { location: 'Port Townsend', state: 'Washington' },       // Olympic Peninsula
  342: { location: 'Wimberley', state: 'Texas' },                // big oak hillside
  343: { location: 'Broken Bow', state: 'Oklahoma' },            // Liberty Hills
  344: { location: 'Hocking Hills', state: 'Ohio' },             // Coral Ridge
  345: { location: 'Pigeon Forge', state: 'Tennessee' },         // Big Bottom Bungalow
  346: { location: 'Hocking Hills', state: 'Ohio' },             // into the woods aframe
  347: { location: 'Sedona', state: 'Arizona' },                 // stargazer rooftop deck
  348: { location: 'Ruidoso', state: 'New Mexico' },             // backcountry lodge natl forest
  349: { location: 'Government Camp', state: 'Oregon' },         // Alpine A-frame barrel sauna
  350: { location: 'Round Top', state: 'Texas' },                // Binocular architect cottage
  351: { location: 'Lake Travis', state: 'Texas' },              // waterfront hot tub secluded
  352: { location: 'Hudson Valley', state: 'New York' },         // A-frame 80 acres sauna
  353: { location: 'Ashford', state: 'Washington' },             // Mystic Pond, near Mt Rainier
  354: { location: 'Wimberley', state: 'Texas' },                // Lost Creek
  355: { location: 'Huntingdon', state: 'Tennessee' },           // Goat Daddy's farm
  356: { location: 'Norfork', state: 'Arkansas' },               // Norfork Lake
  357: { location: 'Blue Ridge', state: 'Georgia' },             // modern a-frame stargazing dome
  358: { location: 'Crestone', state: 'Colorado' },              // CrestDomes
  359: { location: 'Burlington', state: 'Washington' },          // Dome at Blueberry Hill
  360: { location: 'Bloomington', state: 'Indiana' },            // Highland Grainbin
  361: { location: 'Helen', state: 'Georgia' },                  // mountain escape hot tub
  362: { location: 'South Hero', state: 'Vermont' },             // schoolhouse spa Vermont farm
  363: { location: 'Austin', state: 'Texas' },                    // minutes from downtown treehouse
  364: { location: 'Sylva', state: 'North Carolina' },           // Little Red Treehouse
  365: { location: 'Boulder', state: 'Colorado' },               // slug
  366: { location: 'Appleton', state: 'Washington' },            // slug
  368: { location: 'Dahlonega', state: 'Georgia' },              // TreeCastle Roundhouse
  372: { location: 'Townshend', state: 'Vermont' },              // Weasley's Vermont
  373: { location: 'Asheville', state: 'North Carolina' },       // Mama Moon Treehouse
  377: { location: 'Tjeldstø', state: 'Norway' },               // Non-US — flag
  378: { location: 'Blue Ridge', state: 'Georgia' },             // mountainside dome
  379: { location: 'Northland', state: 'New Zealand' },          // Non-US — flag
}

const NON_US_IDS = [274, 303, 318, 377, 379]

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URI)
  const client = new pg.Client({
    host: dbUrl.hostname, port: parseInt(dbUrl.port || '5432'),
    database: dbUrl.pathname.slice(1), user: dbUrl.username, password: dbUrl.password,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  const { rows } = await client.query(`
    SELECT id, slug, location, state, affiliate_url
    FROM stays WHERE needs_review = true AND location = 'Unknown' ORDER BY id
  `)

  console.log(`Processing ${rows.length} stays with Unknown location...\n`)

  let updated = 0
  let nonUs = 0
  let unresolved = 0

  for (const row of rows) {
    const m = MANUAL[row.id]
    if (!m) {
      console.log(`SKIP (no mapping): ${row.id} | ${row.slug}`)
      unresolved++
      continue
    }

    if (NON_US_IDS.includes(row.id)) {
      console.log(`NON-US: ${row.id} | ${row.slug} | ${m.location}, ${m.state}`)
      nonUs++
      // Still update so it's not "Unknown" — mark review_reason for deletion
      await client.query(
        `UPDATE stays SET location = $1, state = $2, review_reason = 'Non-US listing — remove from directory' WHERE id = $3`,
        [m.location, m.state, row.id]
      )
      updated++
      continue
    }

    await client.query(
      `UPDATE stays SET location = $1, state = $2 WHERE id = $3`,
      [m.location.trim(), m.state, row.id]
    )
    console.log(`OK: ${row.id} | ${row.slug} | ${m.location.trim()}, ${m.state}`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Non-US flagged: ${nonUs}, Unresolved: ${unresolved}`)
  await client.end()
}

main().catch(console.error)
