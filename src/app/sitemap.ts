import type { MetadataRoute } from 'next'
import { getAllJournalSlugs, getAllStaySlugs } from '@/lib/payload-queries'
import { SPOKE_SLUGS } from '@/lib/spokes-config'
import { STATE_SLUGS } from '@/lib/states'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [journalSlugs, staySlugs] = await Promise.all([
    getAllJournalSlugs(),
    getAllStaySlugs(),
  ])
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com').replace(/\/$/, '')
  const lastModified = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/collection`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  const spokeEntries: MetadataRoute.Sitemap = SPOKE_SLUGS.map((spoke) => ({
    url: `${baseUrl}/${spoke}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  const programmaticEntries: MetadataRoute.Sitemap = SPOKE_SLUGS.flatMap((spoke) => (
    STATE_SLUGS.map((state) => ({
      url: `${baseUrl}/${spoke}/${state}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))
  ))

  const stayEntries: MetadataRoute.Sitemap = staySlugs.map((slug) => ({
    url: `${baseUrl}/stays/${slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const journalEntries: MetadataRoute.Sitemap = journalSlugs.map((slug) => ({
    url: `${baseUrl}/journal/${slug}`,
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
