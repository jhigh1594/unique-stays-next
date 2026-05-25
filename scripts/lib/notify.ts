// Email notification for discovery pipeline via Resend
// Sends summary email after each discovery run

interface CandidateSummary {
  title: string
  location: string
  imageUrl?: string
  noveltyScore: number
  sourceUrl: string
  platform: string
}

export async function sendDiscoveryNotification(
  candidateCount: number,
  topCandidates: CandidateSummary[],
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

  if (candidateCount === 0) {
    return { success: true }
  }

  const topListHtml = topCandidates
    .slice(0, 3)
    .map(
      (c) => `
      <tr>
        <td style="padding:8px;vertical-align:top;">
          ${c.imageUrl ? `<img src="${c.imageUrl}" width="120" height="80" style="border-radius:8px;object-fit:cover;" />` : ''}
        </td>
        <td style="padding:8px;vertical-align:top;">
          <strong>${c.title}</strong><br/>
          <span style="color:#666;">${c.location}</span><br/>
          <span style="color:#888;">${c.platform} &middot; Novelty: ${c.noveltyScore}/10</span>
        </td>
      </tr>`,
    )
    .join('')

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">${candidateCount} New Stay Candidate${candidateCount !== 1 ? 's' : ''}</h2>
      <p style="color:#555;">The discovery pipeline found ${candidateCount} new candidate${candidateCount !== 1 ? 's' : ''} for your review.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${topListHtml}
      </table>
      <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px;margin-top:8px;">
        Review in Admin
      </a>
    </div>
  `

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from: 'UniqueStaysUSA <notifications@uniquestaysusa.com>',
      to: [recipient],
      subject: `${candidateCount} New Stay Candidate${candidateCount !== 1 ? 's' : ''} Ready for Review`,
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
