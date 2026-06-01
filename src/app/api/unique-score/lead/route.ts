// POST /api/unique-score/lead — save host email (fire-and-forget from client)

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { email, scoreId } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: true }) // silently ignore
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ ok: true })
    }

    const payload = await getPayload({ config })

    // Check for duplicate
    const existing = await payload.find({
      collection: 'host-leads',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ ok: true })
    }

    await payload.create({
      collection: 'host-leads',
      data: {
        email: normalizedEmail,
        listingUrl: '',
        scoreId: scoreId || null,
        source: 'free',
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // never fail on email capture
  }
}
