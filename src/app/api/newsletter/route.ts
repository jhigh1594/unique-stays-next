import { NextRequest, NextResponse } from 'next/server'
import { logs, SeverityNumber } from '@opentelemetry/api-logs'
import { recordSpanError, withSpan } from '@superlog/otel-helpers'
import { getPostHogClient } from '@/lib/posthog-server'
import { newsletterSubscribed, tracer } from '@/lib/telemetry'

const newsletterLogger = logs.getLogger('uniquestaysusa.newsletter')

export async function POST(req: NextRequest) {
  return withSpan('newsletter.subscribe', async (span) => {
    const body = await req.json()
    const email = body.email
    const distinctId = req.headers.get('x-posthog-distinct-id') || email

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      newsletterSubscribed.add(1, { outcome: 'invalid_request' })
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const apiKey = process.env.BEEHIIV_API_KEY
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID

    if (!apiKey || !publicationId) {
      recordSpanError(span, new Error('Missing Beehiiv configuration'))
      newsletterLogger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: 'ERROR',
        body: 'newsletter subscribe misconfigured',
        attributes: { outcome: 'misconfigured' },
      })
      newsletterSubscribed.add(1, { outcome: 'misconfigured' })
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
        span.setAttribute('beehiiv.status_code', res.status)
        newsletterLogger.emit({
          severityNumber: SeverityNumber.ERROR,
          severityText: 'ERROR',
          body: 'beehiiv subscription failed',
          attributes: { outcome: 'provider_error', 'http.status_code': res.status },
        })
        newsletterSubscribed.add(1, { outcome: 'provider_error' })
        return NextResponse.json(
          { error: data.message || 'Failed to subscribe' },
          { status: res.status },
        )
      }

      const posthog = getPostHogClient()
      posthog.identify({ distinctId, properties: { email } })
      posthog.capture({ distinctId, event: 'newsletter_subscribed', properties: { email, source: 'server' } })

      newsletterLogger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: 'newsletter subscription completed',
        attributes: { outcome: 'success' },
      })
      newsletterSubscribed.add(1, { outcome: 'success' })
      span.setAttribute('outcome', 'success')

      return NextResponse.json({ success: true })
    } catch (err) {
      recordSpanError(span, err)
      newsletterLogger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: 'ERROR',
        body: 'newsletter subscription request failed',
        attributes: { outcome: 'error' },
      })
      newsletterSubscribed.add(1, { outcome: 'error' })
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { tracer })
}
