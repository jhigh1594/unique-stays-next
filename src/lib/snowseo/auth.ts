import { snowseoConfig } from './config'

export function getSnowseoWebhookSecret(): string | null {
  return snowseoConfig.secret
}

export function validateSnowseoAuth(authHeader: string | null): { ok: true } | { ok: false; status: number; error: string } {
  const secret = getSnowseoWebhookSecret()
  if (!secret) {
    return {
      ok: false,
      status: 500,
      error: 'Missing SNOWSEO_WEBHOOK_SECRET configuration',
    }
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Missing or invalid authorization header',
    }
  }

  const token = authHeader.slice('Bearer '.length)
  if (token !== secret) {
    return {
      ok: false,
      status: 401,
      error: 'Invalid secret',
    }
  }

  return { ok: true }
}

export function maskWebhookHeaders(headers: Headers): Record<string, string> {
  const allowed = new Set(['authorization', 'content-type', 'user-agent'])
  const result: Record<string, string> = {}

  for (const [key, value] of headers.entries()) {
    if (!allowed.has(key.toLowerCase())) continue
    result[key] = key.toLowerCase() === 'authorization' ? 'REDACTED' : value
  }

  return result
}
