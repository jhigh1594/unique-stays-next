// Batch-set hero images on the 21 heroless journal posts.
// Source: real stay gallery photo (R2, accurate airbnb-pp-cli pipeline) per the
// approved mapping in docs/superpowers/specs/2026-06-13-journal-post-heroes-design.md
//
// Dry run (no writes):
//   pnpm exec tsx --env-file=.env.local scripts/set-post-heroes-batch.ts --dry
// Live:
//   pnpm exec tsx --env-file=.env.local scripts/set-post-heroes-batch.ts
//
// Writes go DIRECTLY to prod Neon (DATABASE_URI) + prod R2 (R2_* creds).

import { getPayload } from 'payload'
import config from '@payload-config'

const PROD_URL = 'https://www.uniquestaysusa.com'
const DRY = process.argv.includes('--dry')

// [postSlug, staySlug] — approved 2026-06-13
const MAPPING: Array<[string, string]> = [
  ['romantic-cabin-getaways-couples', 'basecamp-treeloft-mo'],
  ['hidden-untouched-places-usa', 'willow-treehouse-ny'],
  ['alternatives-overcrowded-destinations', 'treefarm-silo-lapine-or'],
  ['quiet-great-lakes-summer-guide', 'turtle-yurts-bayfield-wi'],
  ['undiscovered-summer-vacation-spots-usa', 'secluded-intown-treehouse-ga'],
  ['cool-weather-summer-escapes-america', 'glamping-montana'],
  ['lakefront-unique-stays-water-cabins-domes-aframes', 'tugboat-private-lake-va'],
  ['halloween-getaways-unique-stays', 'meadowlark-treehouse-mt'],
  ['thanksgiving-getaways-unique-stays', 'sauna-aframe-saugerties-ny'],
  ['snow-globe-stays', 'desert-dome-ut'],
  ['october-unique-stays', 'bar-harbor-treehouse-me'],
  ['fishing-cabins-unique-stays-anglers', 'lake-vermilion-houseboat-mn'],
  ['unique-stays-near-national-forests', 'wander-arch-cape-forest'],
  ['stargazing-getaways-dark-sky-unique-stays', 'romantic-mountain-dome-nc'],
  ['extraordinary-treehouses-america', 'treehouse-point-temple-wa'],
  ['best-unique-stays-joshua-tree', 'wander-joshua-tree-starfall'],
  ['skip-the-crowds-national-park-alternatives', 'tiny-community-lancaster-pa'],
  ['remote-workers-guide-unique-stays', 'wander-lake-bomoseen-5-bedroom-vacation-rental-in-castleton-vermont-wander'],
  ['unique-stays-with-pools', 'autocamp-yosemite-ca'],
  ['glamping-for-beginners', 'dreamy-yurt-steamboat-co'],
  ['best-aframe-cabins-america', 'wander-bend-retreat'],
]

type StayDoc = {
  id: number
  slug: string
  title: string
  location?: string
  galleryImages?: Array<{ imageUrl?: string }>
}

async function revalidate(tag: string) {
  try {
    const res = await fetch(`${PROD_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': process.env.REVALIDATE_SECRET ?? '' },
      body: JSON.stringify({ tag }),
    })
    return res.ok ? 'ok' : `${res.status}`
  } catch (e) {
    return `error:${(e as Error).message.slice(0, 40)}`
  }
}

async function main() {
  console.log(`${DRY ? '[DRY RUN] ' : ''}Journal post heroes — ${MAPPING.length} rows\n`)
  const payload = await getPayload({ config })

  const slugsDone: string[] = []
  const results: Array<{ post: string; status: string; detail: string }> = []

  for (const [postSlug, staySlug] of MAPPING) {
    try {
      const postRes = await payload.find({
        collection: 'blog-posts',
        where: { slug: { equals: postSlug } },
        limit: 1,
        depth: 0,
      })
      if (postRes.totalDocs === 0) {
        results.push({ post: postSlug, status: 'MISSING_POST', detail: staySlug })
        continue
      }
      const post = postRes.docs[0] as { id: number; heroImage?: unknown }
      if (post.heroImage) {
        results.push({ post: postSlug, status: 'SKIP_HAS_HERO', detail: staySlug })
        continue
      }

      const stayRes = await payload.find({
        collection: 'stays',
        where: { slug: { equals: staySlug } },
        limit: 1,
        depth: 1,
      })
      if (stayRes.totalDocs === 0) {
        results.push({ post: postSlug, status: 'MISSING_STAY', detail: staySlug })
        continue
      }
      const stay = stayRes.docs[0] as StayDoc
      const galleryUrl = stay.galleryImages?.find((g) => g.imageUrl)?.imageUrl
      if (!galleryUrl) {
        results.push({ post: postSlug, status: 'NO_GALLERY', detail: staySlug })
        continue
      }

      if (DRY) {
        console.log(`[DRY] ${postSlug}\n       ← ${staySlug}  ${galleryUrl.slice(0, 80)}`)
        results.push({ post: postSlug, status: 'PLAN', detail: `${staySlug}` })
        continue
      }

      // LIVE: download → media → link → revalidate → verify
      const filename = `${postSlug}-hero.jpg`
      const imgRes = await fetch(galleryUrl)
      if (!imgRes.ok) throw new Error(`fetch gallery: ${imgRes.status}`)
      const buffer = Buffer.from(await imgRes.arrayBuffer())

      const alt = `${stay.title}${stay.location ? ` — ${stay.location}` : ''}`

      const media = await payload.create({
        collection: 'media',
        data: { alt },
        file: { data: buffer, mimetype: 'image/jpeg', name: filename, size: buffer.byteLength },
        overrideAccess: true,
      })

      await payload.update({
        collection: 'blog-posts',
        id: post.id,
        data: { heroImage: media.id as number },
      })

      const reval = await revalidate(`journal:${postSlug}`)
      slugsDone.push(postSlug)

      const verifyRes = await payload.find({
        collection: 'blog-posts',
        where: { slug: { equals: postSlug } },
        limit: 1,
        depth: 1,
      })
      const v = verifyRes.docs[0] as { heroImage?: { url?: string } | null }
      const finalUrl = v.heroImage && typeof v.heroImage === 'object' ? (v.heroImage.url ?? '') : ''
      const ok = finalUrl.includes('r2.dev') || finalUrl.includes('media.uniquestaysusa.com')

      console.log(`${ok ? '✓' : '✗'} ${postSlug} ← ${staySlug} (media ${media.id}, reval ${reval}) ${ok ? '' : 'BAD_URL:' + finalUrl}`)
      results.push({ post: postSlug, status: ok ? 'OK' : 'BAD_URL', detail: `${staySlug} media=${media.id} ${finalUrl}` })
    } catch (e) {
      console.log(`✗ ${postSlug} ERROR: ${(e as Error).message.slice(0, 120)}`)
      results.push({ post: postSlug, status: 'ERROR', detail: (e as Error).message.slice(0, 120) })
    }
  }

  // Revalidate journal index once (card images)
  if (!DRY && slugsDone.length) {
    const r = await revalidate('journal')
    console.log(`\njournal index revalidate: ${r}`)
  }

  // Summary
  const tally = results.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {})
  console.log(`\n=== SUMMARY ===`)
  console.log(JSON.stringify(tally))
  if (DRY) console.log('(dry run — no writes performed)')

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
