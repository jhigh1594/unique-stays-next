import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export const maxDuration = 30

export async function POST(req: Request) {
  // Guard: if secret is not configured, refuse all requests
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Revalidation not configured' }, { status: 500 })
  }

  // Validate secret
  const providedSecret = req.headers.get('x-revalidate-secret')
  if (providedSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('tag' in body) || typeof (body as Record<string, unknown>).tag !== 'string') {
    return NextResponse.json({ error: 'Missing required field: tag (string)' }, { status: 400 })
  }

  const { tag } = body as { tag: string }
  revalidateTag(tag, { expire: 0 })

  return NextResponse.json({ revalidated: true, tag })
}
