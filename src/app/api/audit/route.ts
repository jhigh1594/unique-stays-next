import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export const maxDuration = 60

import { runAudit } from '@/lib/audit/run-audit'
import { sendAuditNotification } from '@/lib/audit/notify'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') ?? '10', 10)

    const summary = await runAudit(payload, { limit })

    // Send email digest if issues found
    if (summary.issues > 0) {
      const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/admin/collections/audit-reports`
      await sendAuditNotification(summary, adminUrl)
    }

    return NextResponse.json({
      ok: true,
      runId: summary.runId,
      checked: summary.checked,
      issues: summary.issues,
      critical: summary.critical,
      warnings: summary.warnings,
      info: summary.info,
      errors: summary.errors,
    })
  } catch (e) {
    console.error('Audit cron failed:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
