import { describe, expect, it, vi } from 'vitest'

// buildSitemapEntries is pure, but the module imports @/lib/payload-queries →
// @payload-config, which throws on missing PAYLOAD_SECRET at import time. Stub
// the queries so the config never loads.
vi.mock('@/lib/payload-queries', () => ({
  getAllJournalSitemapEntries: vi.fn(),
  getAllStaySitemapEntries: vi.fn(),
  getPseoSitemapInventory: vi.fn(),
}))

import { buildSitemapEntries, normalizeBaseUrl } from './sitemap'
import type { SitemapEntry } from './sitemap'

function entry(slug: string, updatedAt: string): SitemapEntry {
  return { slug, updatedAt }
}

describe('sitemap entries', () => {
  it('normalizes a trailing slash and canonicalizes apex to www', () => {
    expect(normalizeBaseUrl('https://uniquestaysusa.com/')).toBe('https://www.uniquestaysusa.com')
    expect(normalizeBaseUrl('https://uniquestaysusa.com')).toBe('https://www.uniquestaysusa.com')
    expect(normalizeBaseUrl('https://www.uniquestaysusa.com/')).toBe('https://www.uniquestaysusa.com')
    expect(normalizeBaseUrl('https://www.uniquestaysusa.com')).toBe('https://www.uniquestaysusa.com')
    expect(normalizeBaseUrl('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('emits www self-canonical URLs for static, spoke, stay, journal, and eligible pSEO routes', () => {
    const entries = buildSitemapEntries({
      baseUrl: 'https://uniquestaysusa.com/',
      journalEntries: [entry('best-unique-stays-in-vermont', '2026-05-10T12:00:00.000Z')],
      stayEntries: [entry('california-dog-cabin', '2026-06-01T09:00:00.000Z')],
      pseoPaths: ['/pet-friendly/california'],
    })
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://www.uniquestaysusa.com')
    expect(urls).toContain('https://www.uniquestaysusa.com/pet-friendly')
    expect(urls).toContain('https://www.uniquestaysusa.com/pet-friendly/california')
    expect(urls).toContain('https://www.uniquestaysusa.com/stays/california-dog-cabin')
    expect(urls).toContain('https://www.uniquestaysusa.com/journal/best-unique-stays-in-vermont')
    expect(urls.every((url) => !url.includes('com//'))).toBe(true)
    expect(urls.every((url) => url.startsWith('https://www.uniquestaysusa.com'))).toBe(true)
  })

  it('omits thin pSEO URLs when no eligible pSEO paths are supplied', () => {
    const entries = buildSitemapEntries({
      baseUrl: 'https://uniquestaysusa.com',
      journalEntries: [],
      stayEntries: [],
      pseoPaths: [],
    })
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://www.uniquestaysusa.com/pet-friendly')
    expect(urls).not.toContain('https://www.uniquestaysusa.com/pet-friendly/california')
  })

  it('never emits deprecated <priority> or <changefreq> tags', () => {
    const entries = buildSitemapEntries({
      baseUrl: 'https://uniquestaysusa.com',
      journalEntries: [entry('a-post', '2026-05-10T12:00:00.000Z')],
      stayEntries: [entry('a-stay', '2026-06-01T09:00:00.000Z')],
      pseoPaths: ['/pet-friendly/california'],
    })

    expect(entries.every((e) => !('priority' in e))).toBe(true)
    expect(entries.every((e) => !('changeFrequency' in e))).toBe(true)
  })

  it('derives per-URL lastmod from real updatedAt, not build time', () => {
    const entries = buildSitemapEntries({
      baseUrl: 'https://uniquestaysusa.com',
      journalEntries: [
        entry('post-one', '2026-05-10T12:00:00.000Z'),
        entry('post-two', '2026-06-12T08:30:00.000Z'),
      ],
      stayEntries: [
        entry('stay-one', '2026-06-01T09:00:00.000Z'),
        entry('stay-two', '2026-06-15T18:00:00.000Z'),
      ],
      pseoPaths: [],
    })

    const byUrl = new Map(entries.map((e) => [e.url, e]))
    expect(byUrl.get('https://www.uniquestaysusa.com/stays/stay-one')?.lastModified).toEqual(
      new Date('2026-06-01T09:00:00.000Z'),
    )
    expect(byUrl.get('https://www.uniquestaysusa.com/stays/stay-two')?.lastModified).toEqual(
      new Date('2026-06-15T18:00:00.000Z'),
    )
    expect(byUrl.get('https://www.uniquestaysusa.com/journal/post-two')?.lastModified).toEqual(
      new Date('2026-06-12T08:30:00.000Z'),
    )

    // Index backed by the full stay set takes the freshest stay updatedAt;
    // the journal index takes the freshest post updatedAt.
    expect(byUrl.get('https://www.uniquestaysusa.com/collection')?.lastModified).toEqual(
      new Date('2026-06-15T18:00:00.000Z'),
    )
    expect(byUrl.get('https://www.uniquestaysusa.com/journal')?.lastModified).toEqual(
      new Date('2026-06-12T08:30:00.000Z'),
    )

    // Pages with no backing doc carry no lastmod (never synthesized).
    expect(byUrl.get('https://www.uniquestaysusa.com')?.lastModified).toBeUndefined()
    expect(byUrl.get('https://www.uniquestaysusa.com/tools')?.lastModified).toBeUndefined()
    expect(byUrl.get('https://www.uniquestaysusa.com/collections')?.lastModified).toBeUndefined()
  })

  it('declares only /collection in the sitemap; /collections excluded but not de-indexed', () => {
    const entries = buildSitemapEntries({
      baseUrl: 'https://uniquestaysusa.com',
      journalEntries: [],
      stayEntries: [],
      pseoPaths: [],
    })
    const urls = entries.map((e) => e.url)

    // Singular/plural collision: only the internally-canonical directory hub
    // /collection is declared. /collections stays live + internally linked
    // (so still indexable) — the sitemap is the non-destructive dedupe lever,
    // not a 301 or noindex. The permanent 301 waits on a backlink check.
    expect(urls).toContain('https://www.uniquestaysusa.com/collection')
    expect(urls).not.toContain('https://www.uniquestaysusa.com/collections')
  })
})
