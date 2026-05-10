import type { MetadataRoute } from 'next'
import { getAllJournalSlugs, getAllStaySlugs, getPseoSitemapInventory } from '@/lib/payload-queries'
import { SPOKE_SLUGS } from '@/lib/spokes-config'
import { getPseoInventoryCounts, getPseoSitemapPaths } from '@/lib/pseo'

export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '')
}

export function buildSitemapEntries({
  baseUrl,
  journalSlugs,
  staySlugs,
  pseoPaths,
  lastModified,
}: {
  baseUrl: string
  journalSlugs: string[]
  staySlugs: string[]
  pseoPaths: string[]
  lastModified: Date
}): MetadataRoute.Sitemap {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: normalizedBaseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${normalizedBaseUrl}/collection`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${normalizedBaseUrl}/journal`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  const spokeEntries: MetadataRoute.Sitemap = SPOKE_SLUGS.map((spoke) => ({
    url: `${normalizedBaseUrl}/${spoke}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  const programmaticEntries: MetadataRoute.Sitemap = pseoPaths.map((path) => ({
    url: `${normalizedBaseUrl}${path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.75,
  }))

  const stayEntries: MetadataRoute.Sitemap = staySlugs.map((slug) => ({
    url: `${normalizedBaseUrl}/stays/${slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const journalEntries: MetadataRoute.Sitemap = journalSlugs.map((slug) => ({
    url: `${normalizedBaseUrl}/journal/${slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    ...staticEntries,
    ...spokeEntries,
    ...programmaticEntries,
    ...stayEntries,
    ...journalEntries,
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [journalSlugs, staySlugs, pseoInventory] = await Promise.all([
    getAllJournalSlugs(),
    getAllStaySlugs(),
    getPseoSitemapInventory(),
  ])

  return buildSitemapEntries({
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com',
    journalSlugs,
    staySlugs,
    pseoPaths: getPseoSitemapPaths(getPseoInventoryCounts(pseoInventory)),
    lastModified: new Date(),
  })
}
