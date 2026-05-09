import type { MetadataRoute } from 'next'
import { getAllJournalSlugs } from '@/lib/payload-queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const journalSlugs = await getAllJournalSlugs()
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com'

  const journalEntries: MetadataRoute.Sitemap = journalSlugs.map((slug) => ({
    url: `${baseUrl}/journal/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...journalEntries,
  ]
}
