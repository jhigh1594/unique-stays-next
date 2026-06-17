import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import type { SnowSEOWebhookPayload } from './types'

interface PersistWebhookLogInput {
  event: string
  slug?: string | null
  rawBody: string
  payload: SnowSEOWebhookPayload
  headers: Record<string, string>
}

export function webhookIdempotencyKey(rawBody: string): string {
  return createHash('sha256').update(rawBody).digest('hex')
}

export async function persistWebhookLog(
  payload: Payload,
  input: PersistWebhookLogInput,
): Promise<string | null> {
  const idempotencyKey = webhookIdempotencyKey(input.rawBody)

  try {
    const doc = await payload.create({
      collection: 'snow-webhook-logs',
      data: {
        event: input.event,
        slug: input.slug ?? undefined,
        idempotencyKey,
        status: 'received',
        message: `Received ${input.event} event`,
        rawBody: input.rawBody,
        payload: input.payload as Record<string, unknown>,
        headers: input.headers,
        receivedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    return String(doc.id)
  } catch (error) {
    console.warn('[SnowSEO Webhook] Failed to persist log:', error)
    return null
  }
}

export async function updateWebhookLogStatus(
  payload: Payload,
  logId: string | null,
  status: 'processed' | 'failed',
  message: string,
): Promise<void> {
  if (!logId) return

  try {
    await payload.update({
      collection: 'snow-webhook-logs',
      id: logId,
      data: { status, message },
      overrideAccess: true,
    })
  } catch (error) {
    console.warn('[SnowSEO Webhook] Failed to update log status:', error)
  }
}
