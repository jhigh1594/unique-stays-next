import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = body.email

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID

  if (!apiKey || !publicationId) {
    console.error('Missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
        }),
      },
    )

    const data = await res.json()

    if (!res.ok) {
      console.error('Beehiiv error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to subscribe' },
        { status: res.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Beehiiv request failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
