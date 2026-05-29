import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { scoreStay, geocodeZipCode, type QuizAnswers } from '@/lib/matching-engine'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const answers: QuizAnswers = await req.json()

    // Validate required fields
    const required: (keyof QuizAnswers)[] = ['occasion', 'vibe', 'distance', 'budget', 'mustHave', 'zipCode']
    for (const field of required) {
      if (!answers[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
      }
    }

    // Geocode user's zip code
    const userCoords = await geocodeZipCode(answers.zipCode)

    // Fetch all stays with coordinates and category data
    const payload = await getPayload({ config })
    const allStays = await payload.find({
      collection: 'stays',
      limit: 500,
      depth: 1, // populate category relationship
    })

    // Score each stay
    const scored = allStays.docs
      .map((stay) => {
        const category = stay.category as any
        const categorySlug = category?.slug || ''
        const categoryName = category?.name || ''
        const categoryEmoji = category?.emoji || ''

        // Extract tags as flat string array
        const tags = Array.isArray(stay.tags)
          ? stay.tags.map((t: any) => (typeof t === 'string' ? t : t?.tag || ''))
          : []

        const { score, reasons } = scoreStay(
          {
            categorySlug,
            price: stay.price,
            coordinates: stay.coordinates as any,
            tags,
            rating: stay.rating ?? undefined,
            reviewCount: stay.reviewCount ?? undefined,
          },
          answers,
          userCoords || undefined
        )

        return {
          id: stay.id,
          slug: stay.slug,
          title: stay.title,
          subtitle: stay.subtitle,
          location: stay.location,
          city: stay.city,
          state: stay.state,
          stateCode: stay.stateCode,
          price: stay.price,
          rating: stay.rating,
          reviewCount: stay.reviewCount,
          imageUrl: stay.imageUrl || (stay.image && typeof stay.image === 'object' ? (stay.image as any).url : undefined),
          affiliateUrl: stay.affiliateUrl,
          categorySlug,
          categoryName,
          categoryEmoji,
          description: stay.description,
          editorNote: stay.editorNote,
          tags,
          matchScore: score,
          matchReasons: reasons,
        }
      })
      .filter((s) => s.matchScore >= 20) // Minimum threshold
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8) // Top 8 results

    // Generate a result slug from answers for sharing/SEO
    const resultSlug = generateResultSlug(answers)

    return NextResponse.json({
      results: scored,
      resultSlug,
      userCoords: userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : null,
      totalMatched: scored.length,
    })
  } catch (e) {
    console.error('Vacation quiz matching failed:', e)
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 })
  }
}

function generateResultSlug(answers: QuizAnswers): string {
  const vibeLabels: Record<string, string> = {
    woods: 'deep-woods',
    waterfront: 'waterfront',
    desert: 'desert',
    mountains: 'mountain',
    offgrid: 'off-grid',
  }
  const occasionLabels: Record<string, string> = {
    romantic: 'romantic',
    solo: 'solo',
    friends: 'group',
    family: 'family',
  }
  return `${occasionLabels[answers.occasion]}-${vibeLabels[answers.vibe]}-getaways`
}
