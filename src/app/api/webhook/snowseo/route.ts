import { NextResponse } from 'next/server'
import { maskWebhookHeaders, validateSnowseoAuth } from '@/lib/snowseo/auth'
import { snowseoConfig } from '@/lib/snowseo/config'
import { resolveArticleSlug } from '@/lib/snowseo/slug'
import type { SnowSEOWebhookPayload, SnowSEOWebhookResult } from '@/lib/snowseo/types'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const auth = validateSnowseoAuth(request.headers.get('authorization'))
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    let payload: SnowSEOWebhookPayload
    try {
      payload = JSON.parse(rawBody) as SnowSEOWebhookPayload
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
    }

    if (!payload.event) {
      return NextResponse.json({ success: false, error: 'Missing event type' }, { status: 400 })
    }

    if (snowseoConfig.debug) {
      console.log('[SnowSEO Webhook] Payload:', JSON.stringify(payload, null, 2))
    }

    console.log(`[SnowSEO Webhook] Received: ${payload.event} at ${payload.timestamp ?? 'unknown'}`)

    const slugCandidate = payload.article
      ? resolveArticleSlug({ slug: payload.article.slug, title: payload.article.title })
      : null

    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const { persistWebhookLog, updateWebhookLogStatus } = await import('@/lib/snowseo/log')
    const { journalUrl } = await import('@/lib/snowseo/config')
    const { upsertSnowseoArticle } = await import('@/lib/snowseo/upsert-article')
    const { unpublishSnowseoArticle } = await import('@/lib/snowseo/unpublish-article')

    const cms = await getPayload({ config })
    const logId = await persistWebhookLog(cms, {
      event: payload.event,
      slug: slugCandidate,
      rawBody,
      payload,
      headers: maskWebhookHeaders(request.headers),
    })

    const result = await handleEvent(cms, payload, {
      upsertSnowseoArticle,
      unpublishSnowseoArticle,
      journalUrl,
    })

    await updateWebhookLogStatus(
      cms,
      logId,
      result.success ? 'processed' : 'failed',
      result.message ?? (result.success ? 'Processed' : 'Failed'),
    )

    return NextResponse.json({
      event: payload.event,
      timestamp: payload.timestamp,
      ...result,
    })
  } catch (error) {
    console.error('[SnowSEO Webhook] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'snowseo-webhook-receiver',
    unpublishAction: snowseoConfig.unpublishAction,
    timestamp: new Date().toISOString(),
  })
}

async function handleEvent(
  cms: Awaited<ReturnType<(typeof import('payload'))['getPayload']>>,
  payload: SnowSEOWebhookPayload,
  deps: {
    upsertSnowseoArticle: typeof import('@/lib/snowseo/upsert-article').upsertSnowseoArticle
    unpublishSnowseoArticle: typeof import('@/lib/snowseo/unpublish-article').unpublishSnowseoArticle
    journalUrl: typeof import('@/lib/snowseo/config').journalUrl
  },
): Promise<SnowSEOWebhookResult> {
  switch (payload.event) {
    case 'article.published':
    case 'article.drafted': {
      const article = payload.article
      if (!article?.html || !article.title) {
        return { success: false, message: 'Missing article title or html in payload' }
      }

      const published = payload.event === 'article.published'
      const saved = await deps.upsertSnowseoArticle(cms, cms.config, {
        article,
        published,
      })

      return {
        success: true,
        slug: saved.slug,
        action: published ? 'published' : 'drafted',
        message: `Post "${article.title}" saved successfully`,
        cmsArticleId: saved.id,
        cmsUrl: published ? deps.journalUrl(saved.slug) : undefined,
      }
    }

    case 'article.unpublished': {
      const article = payload.article
      if (!article?.title) {
        return { success: false, message: 'No article in payload' }
      }

      const unpublish = await deps.unpublishSnowseoArticle(cms, article)

      return {
        success: true,
        action: unpublish.action,
        slug: unpublish.slug,
        message: unpublish.message,
      }
    }

    case 'webhook.connected':
      console.log('[SnowSEO Webhook] Connection ping:', payload.message)
      return {
        success: true,
        action: 'connected',
        message: payload.message || 'Webhook connection confirmed',
      }

    case 'webhook.disconnected':
      console.log('[SnowSEO Webhook] Integration disconnected:', payload.message)
      return {
        success: true,
        action: 'disconnected',
        message: payload.message || 'Webhook integration removed',
      }

    default:
      return {
        success: true,
        action: 'unknown',
        message: `Unhandled event type: ${payload.event}`,
      }
  }
}
