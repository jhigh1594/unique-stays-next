import type { GenerationResult } from './types'

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

async function hashUrl(url: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    // Invalid URL — hash the raw string as fallback
    parsed = new URL('https://invalid.local')
  }
  // Normalize: strip query params + hash, lowercase origin+pathname only
  const normalized = `${parsed.origin}${parsed.pathname}`.toLowerCase()
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

interface CacheEntry {
  data: GenerationResult
  storedAt: number
}

export interface CacheLookup {
  hit: boolean
  data?: GenerationResult
}

export class ListingGeneratorCache {
  private store = new Map<string, CacheEntry>()
  private ttlMs: number

  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs
  }

  async get(url: string): Promise<CacheLookup> {
    const key = await hashUrl(url)
    const entry = this.store.get(key)
    if (!entry) return { hit: false }

    const age = Date.now() - entry.storedAt
    if (age >= this.ttlMs) {
      this.store.delete(key)
      return { hit: false }
    }

    return { hit: true, data: entry.data }
  }

  async set(url: string, data: GenerationResult): Promise<void> {
    const key = await hashUrl(url)
    this.store.set(key, { data, storedAt: Date.now() })
  }
}

// Singleton for API route usage
export const generatorCache = new ListingGeneratorCache()
