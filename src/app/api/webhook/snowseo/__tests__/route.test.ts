import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('@payload-config', () => ({
  default: {},
}))

const mocks = vi.hoisted(() => ({
  create: vi.fn().mockResolvedValue({ id: 'log-1' }),
  update: vi.fn(),
  find: vi.fn().mockResolvedValue({ docs: [] }),
  findByID: vi.fn(),
  delete: vi.fn(),
  upsertSnowseoArticle: vi.fn().mockResolvedValue({ id: '42', slug: 'test-post' }),
  unpublishSnowseoArticle: vi.fn().mockResolvedValue({
    action: 'draft',
    found: true,
    slug: 'test-post',
    message: 'Post marked as draft',
  }),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    config: {},
    create: mocks.create,
    update: mocks.update,
    find: mocks.find,
    findByID: mocks.findByID,
    delete: mocks.delete,
  }),
}))

vi.mock('@/lib/snowseo/upsert-article', () => ({
  upsertSnowseoArticle: mocks.upsertSnowseoArticle,
}))

vi.mock('@/lib/snowseo/unpublish-article', () => ({
  unpublishSnowseoArticle: mocks.unpublishSnowseoArticle,
}))

import { POST, GET } from '../route'

const SECRET = 'test-webhook-secret'

function webhookRequest(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token !== undefined) {
    headers.Authorization = `Bearer ${token}`
  }

  return new Request('http://localhost:3000/api/webhook/snowseo', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhook/snowseo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SNOWSEO_WEBHOOK_SECRET = SECRET
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.uniquestaysusa.com'
  })

  it('returns 500 when SNOWSEO_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.SNOWSEO_WEBHOOK_SECRET
    const res = await POST(webhookRequest({ event: 'webhook.connected' }, SECRET))
    expect(res.status).toBe(500)
  })

  it('returns 401 when authorization header is missing', async () => {
    const res = await POST(webhookRequest({ event: 'webhook.connected' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when bearer token is invalid', async () => {
    const res = await POST(webhookRequest({ event: 'webhook.connected' }, 'wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/webhook/snowseo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SECRET}`,
        },
        body: '{not-json',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('acknowledges webhook.connected', async () => {
    const res = await POST(
      webhookRequest({ event: 'webhook.connected', message: 'Connected' }, SECRET),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.action).toBe('connected')
  })

  it('returns cmsArticleId and cmsUrl for article.published', async () => {
    const res = await POST(
      webhookRequest(
        {
          event: 'article.published',
          timestamp: '2026-06-01T00:00:00Z',
          article: {
            slug: 'test-post',
            title: 'Test Post',
            html: '<p>Hello</p>',
            status: 'publish',
          },
        },
        SECRET,
      ),
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.cmsArticleId).toBe('42')
    expect(data.cmsUrl).toBe('https://www.uniquestaysusa.com/journal/test-post')
    expect(mocks.upsertSnowseoArticle).toHaveBeenCalled()
  })

  it('persists webhook log on receipt', async () => {
    await POST(webhookRequest({ event: 'webhook.disconnected' }, SECRET))
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'snow-webhook-logs',
        overrideAccess: true,
      }),
    )
  })
})

describe('GET /api/webhook/snowseo', () => {
  it('returns health check payload', async () => {
    process.env.SNOWSEO_UNPUBLISH_ACTION = 'draft'
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.service).toBe('snowseo-webhook-receiver')
  })
})
