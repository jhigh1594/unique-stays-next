import type { MetadataRoute } from 'next'
import { getAllJournalSitemapEntries, getAllStaySitemapEntries, getPseoSitemapInventory } from '@/lib/payload-queries'
import { SPOKE_SLUGS } from '@/lib/spokes-config'
import { getPseoInventoryCounts, getPseoSitemapPaths } from '@/lib/pseo'

export function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/$/, '')
  // Canonicalize apex → www so sitemap URLs are www-regardless of the env value.
  return trimmed.replace(
    /^(https?:\/\/)uniquestaysusa\.com/,
    '$1www.uniquestaysusa.com'
  )
}

/**
 * <lastmod> policy: every lastmod MUST come from a real Payload `updatedAt`.
 * Never synthesize timestamps (no build-time `new Date()` for content URLs).
 * Where no real source exists, omit lastmod entirely — it is optional in the
 * sitemap spec and an absent lastmod is more honest than a fabricated one.
 */
function latestUpdatedAt(entries: Array<{ updatedAt: string }>): Date | undefined {
  const times = entries.map((e) => e.updatedAt).filter(Boolean)
  if (times.length === 0) return undefined
  // ISO-8601 strings sort chronologically; take the most recent.
  times.sort()
  return new Date(times[times.length - 1])
}

export interface SitemapEntry {
  slug: string
  updatedAt: string
}

export function buildSitemapEntries({
  baseUrl,
  journalEntries,
  stayEntries,
  pseoPaths,
}: {
  baseUrl: string
  journalEntries: SitemapEntry[]
  stayEntries: SitemapEntry[]
  pseoPaths: string[]
}): MetadataRoute.Sitemap {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  // Static hubs. lastmod only where a real content source backs the URL:
  //   - /collection ("All Stays" directory) is built from every public stay →
  //     the freshest stay updatedAt.
  //   - /journal index is built from every published post → freshest post
  //     updatedAt.
  //   - Home, /tools, /collections (5-spoke hub): no single Payload doc backs
  //     them, so no lastmod is emitted rather than fabricating one.
  const staysLastmod = latestUpdatedAt(stayEntries)
  const journalIndexLastmod = latestUpdatedAt(journalEntries)

  const staticEntries: MetadataRoute.Sitemap = [
    { url: normalizedBaseUrl },
    { url: `${normalizedBaseUrl}/collections` },
    { url: `${normalizedBaseUrl}/tools` },
    { url: `${normalizedBaseUrl}/collection`, ...(staysLastmod ? { lastModified: staysLastmod } : {}) },
    { url: `${normalizedBaseUrl}/journal`, ...(journalIndexLastmod ? { lastModified: journalIndexLastmod } : {}) },
  ]

  const spokeEntries: MetadataRoute.Sitemap = SPOKE_SLUGS.map((spoke) => ({
    url: `${normalizedBaseUrl}/${spoke}`,
  }))

  const programmaticEntries: MetadataRoute.Sitemap = pseoPaths.map((path) => ({
    url: `${normalizedBaseUrl}${path}`,
  }))

  const stayDetailEntries: MetadataRoute.Sitemap = stayEntries.map(({ slug, updatedAt }) => ({
    url: `${normalizedBaseUrl}/stays/${slug}`,
    lastModified: new Date(updatedAt),
  }))

  const journalDetailEntries: MetadataRoute.Sitemap = journalEntries.map(({ slug, updatedAt }) => ({
    url: `${normalizedBaseUrl}/journal/${slug}`,
    lastModified: new Date(updatedAt),
  }))

  return [
    ...staticEntries,
    ...spokeEntries,
    ...programmaticEntries,
    ...stayDetailEntries,
    ...journalDetailEntries,
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [journalEntries, stayEntries, pseoInventory] = await Promise.all([
    getAllJournalSitemapEntries(),
    getAllStaySitemapEntries(),
    getPseoSitemapInventory(),
  ])

  return buildSitemapEntries({
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://www.uniquestaysusa.com',
    journalEntries,
    stayEntries,
    pseoPaths: getPseoSitemapPaths(getPseoInventoryCounts(pseoInventory)),
  })
}
