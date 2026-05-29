import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// In-memory IP rate limit: 5 requests per IP per hour
const ipCounts = new Map<string, { count: number; resetAt: number }>()
const IP_LIMIT = 5
const IP_WINDOW_MS = 60 * 60 * 1000

/** Normalize email: lowercase, trim, strip Gmail-style + aliases for dedup. */
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().replace(/\+[^@]*@/, '@')
}

function isIpRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (!entry || now >= entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > IP_LIMIT
}

// Periodic cleanup of expired entries (every 10 minutes)
let lastCleanup = Date.now()
function cleanupIpMap() {
  const now = Date.now()
  if (now - lastCleanup < 10 * 60 * 1000) return
  lastCleanup = now
  for (const [ip, entry] of ipCounts) {
    if (now >= entry.resetAt) ipCounts.delete(ip)
  }
}

export async function POST(req: NextRequest) {
  try {
    // IP-based rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    cleanupIpMap()
    if (isIpRateLimited(ip)) {
      return NextResponse.json({ error: 'rate limited' }, { status: 429 })
    }

    const body = await req.json()
    const { email: rawEmail, zipCode, occasion, vibe, distance, budget, mustHave, resultSlug, matchCount } = body

    if (!rawEmail || !zipCode) {
      return NextResponse.json({ error: 'email and zipCode required' }, { status: 400 })
    }

    // Basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(rawEmail) || rawEmail.length > 254) {
      return NextResponse.json({ error: 'invalid email' }, { status: 400 })
    }

    // Zip code format validation (5-digit US)
    if (!/^\d{5}$/.test(zipCode)) {
      return NextResponse.json({ error: 'invalid zip code' }, { status: 400 })
    }

    // Normalize email: lowercase + strip + aliases for dedup
    const email = normalizeEmail(rawEmail)

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

    // Save lead + subscribe to Beehiiv in parallel
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    await Promise.all([
      payload.create({
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
      }),
      // Subscribe to Beehiiv newsletter (fire-and-forget — don't block on failure)
      fetch(`${baseUrl}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch((err) => {
        console.error('Beehiiv subscription failed:', err)
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Quiz lead save failed:', e)
    return NextResponse.json({ error: 'lead save failed' }, { status: 500 })
  }
}
