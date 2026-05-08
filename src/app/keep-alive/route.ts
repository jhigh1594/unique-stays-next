import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export const maxDuration = 10

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  try {
    const payload = await getPayload({ config })
    await payload.db.pool.query('SELECT 1')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 503 })
  }
}
