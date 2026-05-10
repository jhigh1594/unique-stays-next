import { describe, expect, it, vi } from 'vitest'
import { buildSitemapEntries, normalizeBaseUrl } from './sitemap'

vi.mock('@/lib/payload-queries', () => ({
  getAllJournalSlugs: vi.fn(),
  getAllStaySlugs: vi.fn(),
  getPseoSitemapInventory: vi.fn(),
}))

const lastModified = new Date('2026-05-10T12:00:00.000Z')

describe('sitemap entries', () => {
  it('normalizes a trailing slash from the base URL', () => {
    expect(normalizeBaseUrl('https://uniquestaysusa.com/')).toBe('https://uniquestaysusa.com')
  })

  it('includes static, spoke, stay, journal, and eligible pSEO URLs', () => {
    const entries = buildSitemapEntries({
      baseUrl: 'https://uniquestaysusa.com/',
      journalSlugs: ['best-unique-stays-in-vermont'],
      staySlugs: ['california-dog-cabin'],
      pseoPaths: ['/pet-friendly/california'],
      lastModified,
    })
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain('https://uniquestaysusa.com')
    expect(urls).toContain('https://uniquestaysusa.com/pet-friendly')
    expect(urls).toContain('https://uniquestaysusa.com/pet-friendly/california')
    expect(urls).toContain('https://uniquestaysusa.com/stays/california-dog-cabin')
    expect(urls).toContain('https://uniquestaysusa.com/journal/best-unique-stays-in-vermont')
    expect(urls.every((url) => !url.includes('com//'))).toBe(true)
  })

  it('omits thin pSEO URLs when no eligible pSEO paths are supplied', () => {
    const entries = buildSitemapEntries({
      baseUrl: 'https://uniquestaysusa.com',
      journalSlugs: [],
      staySlugs: [],
      pseoPaths: [],
      lastModified,
    })
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain('https://uniquestaysusa.com/pet-friendly')
    expect(urls).not.toContain('https://uniquestaysusa.com/pet-friendly/california')
  })
})
