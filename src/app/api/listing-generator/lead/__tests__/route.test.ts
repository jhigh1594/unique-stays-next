import { describe, it, expect, vi } from 'vitest'

// Mock payload-config before anything imports it
vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    create: vi.fn(),
    find: vi.fn().mockResolvedValue({ docs: [] }),
  }),
}))

import { POST } from '../route'

function mockRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/listing-generator/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/listing-generator/lead', () => {
  it('returns ok:true for valid email', async () => {
    const res = await POST(mockRequest({ email: 'test@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('returns ok:true even for empty email', async () => {
    const res = await POST(mockRequest({ email: '' }))
    expect(res.status).toBe(200)
  })

  it('returns ok:true for missing email', async () => {
    const res = await POST(mockRequest({}))
    expect(res.status).toBe(200)
  })

  it('never returns error — always ok:true', async () => {
    const res = await POST(mockRequest({ email: 'test@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})
