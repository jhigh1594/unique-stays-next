import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export const maxDuration = 60

// @ts-expect-error — scripts/ excluded from tsconfig but resolved at runtime
import { discoverAll } from '../../../scripts/lib/discoverer'
// @ts-expect-error — scripts/ excluded from tsconfig but resolved at runtime
import { scoreBatch } from '../../../scripts/lib/scorer'
// @ts-expect-error — scripts/ excluded from tsconfig but resolved at runtime
import { sendDiscoveryNotification } from '../../../scripts/lib/notify'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const limit = 20
    const minScore = 5

    // Phase 1: Crawl
    const rawListings: Array<{
      title: string
      location: string
      state: string
      description: string
      imageUrl: string
      price: number | null
      rating: number | null
      reviewCount: number | null
      sourceUrl: string
      platform: string
      amenities: string[]
    }> = await discoverAll()

    if (rawListings.length === 0) {
      return NextResponse.json({ ok: true, discovered: 0, written: 0 })
    }

    // Phase 2: Dedup
    const [existingStays, existingCandidates] = await Promise.all([
      payload.find({ collection: 'stays', limit: 500, depth: 0 }),
      payload.find({ collection: 'candidate-stays', limit: 500, depth: 0 }),
    ])

    const existingUrls = new Set(existingStays.docs.map((s) => s.affiliateUrl as string))
    const candidateUrls = new Set(existingCandidates.docs.map((c) => c.sourceUrl as string))

    const newListings = rawListings.filter((l) => !existingUrls.has(l.sourceUrl) && !candidateUrls.has(l.sourceUrl))

    if (newListings.length === 0) {
      return NextResponse.json({ ok: true, discovered: rawListings.length, written: 0 })
    }

    // Phase 3: Score
    const scored = await scoreBatch(newListings)

    // Merge scored results with original listing data
    const scoredWithSource = scored.map((s, i) => ({
      ...s,
      sourceUrl: newListings[i].sourceUrl,
      platform: newListings[i].platform,
      rating: newListings[i].rating,
      reviewCount: newListings[i].reviewCount,
    }))

    const passing = scoredWithSource
      .filter((s: { novelty: { score: number } }) => s.novelty.score >= minScore)
      .sort((a: { novelty: { score: number } }, b: { novelty: { score: number } }) => b.novelty.score - a.novelty.score)
      .slice(0, limit)

    if (passing.length === 0) {
      return NextResponse.json({
        ok: true,
        discovered: rawListings.length,
        deduped: newListings.length,
        scored: scored.length,
        written: 0,
      })
    }

    // Phase 4: Write candidates
    let written = 0
    const candidates: Array<{
      title: string
      location: string
      imageUrl?: string
      noveltyScore: number
      sourceUrl: string
      platform: string
    }> = []

    for (const item of passing) {
      try {
        await payload.create({
          collection: 'candidate-stays',
          data: {
            sourceUrl: item.sourceUrl,
            platform: item.platform,
            title: item.title,
            location: item.location,
            state: '',
            price: item.price,
            rating: item.rating,
            reviewCount: item.reviewCount,
            imageUrl: item.imageUrl ?? '',
            scrapedDescription: item.description,
            scrapedAmenities: item.amenities?.map((a: string) => ({ amenity: a })) ?? [],
            noveltyScore: item.novelty.score,
            noveltyReason: item.novelty.reason,
            status: 'pending',
            discoveredAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })

        candidates.push({
          title: item.title,
          location: item.location,
          imageUrl: item.imageUrl,
          noveltyScore: item.novelty.score,
          sourceUrl: item.sourceUrl,
          platform: item.platform,
        })

        written++
      } catch {
        // Skip individual write failures
      }
    }

    // Phase 5: Notify
    if (written > 0) {
      const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/candidate-stays`
      await sendDiscoveryNotification(written, candidates, adminUrl)
    }

    return NextResponse.json({
      ok: true,
      discovered: rawListings.length,
      deduped: newListings.length,
      scored: scored.length,
      written,
    })
  } catch (e) {
    console.error('Discovery cron failed:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
