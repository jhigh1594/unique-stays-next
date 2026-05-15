import type { AuditSummary } from './types'

export async function sendAuditNotification(
  summary: AuditSummary,
  adminUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not set' }
  }

  const recipient = process.env.NOTIFICATION_EMAIL
  if (!recipient) {
    return { success: false, error: 'NOTIFICATION_EMAIL not set' }
  }

  if (summary.issues === 0) {
    return { success: true }
  }

  const criticalFindings = summary.reports
    .filter((r) => r.severity === 'critical')
    .slice(0, 5)
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;vertical-align:top;">
          <strong>${r.stayTitle}</strong><br/>
          <span style="color:#dc2626;">Critical</span> &middot; ${r.platform}
        </td>
        <td style="padding:8px;vertical-align:top;">
          ${r.findings.map((f) => `${f.field}: ${f.actual}`).join('<br/>')}
        </td>
      </tr>`,
    )
    .join('')

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">Data Quality Audit — ${new Date().toLocaleDateString()}</h2>
      <p style="color:#555;">
        Checked <strong>${summary.checked}</strong> stays.
        Found <strong>${summary.issues}</strong> issues:
        <span style="color:#dc2626;">${summary.critical} critical</span> &middot;
        <span style="color:#f59e0b;">${summary.warnings} warnings</span> &middot;
        ${summary.info} info.
      </p>
      ${
        criticalFindings
          ? `<h3 style="color:#dc2626;">Critical Findings</h3>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          ${criticalFindings}
        </table>`
          : ''
      }
      <a href="${adminUrl}?where[runId][equals]=${summary.runId}" style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px;margin-top:8px;">
        View in Admin
      </a>
    </div>
  `

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from: 'UniqueStaysUSA <notifications@uniquestaysusa.com>',
      to: [recipient],
      subject: `Data Quality Audit: ${summary.issues} issues (${summary.critical} critical)`,
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
