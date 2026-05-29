import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, zipCode, occasion, vibe, distance, budget, mustHave, resultSlug, matchCount } = body

    if (!email || !zipCode) {
      return NextResponse.json({ error: 'email and zipCode required' }, { status: 400 })
    }

    // Basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'invalid email' }, { status: 400 })
    }

    // Rate limit: check if this email was already saved today
    const payload = await getPayload({ config })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const existing = await payload.find({
      collection: 'quiz-leads',
      where: {
        and: [
          { email: { equals: email } },
          { createdAt: { greater_than_equal: today.toISOString() } },
        ],
      },
      depth: 0,
      limit: 1,
    })
    if (existing.totalDocs > 0) {
      return NextResponse.json({ ok: true, message: 'already recorded' })
    }

    await payload.create({
      collection: 'quiz-leads',
      data: {
        email,
        zipCode,
        occasion,
        vibe,
        distance,
        budget,
        mustHave,
        resultSlug,
        matchCount: matchCount ?? null,
      },
      overrideAccess: true,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Quiz lead save failed:', e)
    return NextResponse.json({ error: 'lead save failed' }, { status: 500 })
  }
}
