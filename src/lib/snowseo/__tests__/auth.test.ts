import { describe, expect, it, beforeEach } from 'vitest'
import { validateSnowseoAuth, maskWebhookHeaders } from '../auth'

describe('validateSnowseoAuth', () => {
  beforeEach(() => {
    process.env.SNOWSEO_WEBHOOK_SECRET = 'secret-token'
  })

  it('rejects when secret is not configured', () => {
    delete process.env.SNOWSEO_WEBHOOK_SECRET
    const result = validateSnowseoAuth('Bearer secret-token')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(500)
  })

  it('rejects missing authorization header', () => {
    const result = validateSnowseoAuth(null)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(401)
  })

  it('accepts matching bearer token', () => {
    const result = validateSnowseoAuth('Bearer secret-token')
    expect(result).toEqual({ ok: true })
  })
})

describe('maskWebhookHeaders', () => {
  it('redacts authorization and keeps content-type', () => {
    const headers = new Headers({
      authorization: 'Bearer secret',
      'content-type': 'application/json',
      'x-custom': 'ignored',
    })

    expect(maskWebhookHeaders(headers)).toEqual({
      authorization: 'REDACTED',
      'content-type': 'application/json',
    })
  })
})
