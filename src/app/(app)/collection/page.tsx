import { getAllStays } from '@/lib/payload-queries'
import DirectoryContent from './_directory/DirectoryContent'
import type { Metadata } from 'next'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const allStays = await getAllStays()
  return {
    title: 'The Collection — All Curated Stays',
    description: `Browse all ${allStays.length}+ curated unique vacation rentals across America. Filter by category, region, and platform.`,
    alternates: { canonical: '/collection' },
  }
}

export default async function DirectoryPage() {
  const allStays = await getAllStays()
  return <DirectoryContent allStays={allStays} />
}
