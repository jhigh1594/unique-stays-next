import { getAllStays } from '@/lib/payload-queries'
import DirectoryContent from './_directory/DirectoryContent'

export const dynamic = 'force-static'

export const metadata = {
  title: 'The Collection — All Curated Stays',
  description: 'Browse all 230+ curated unique vacation rentals across America. Filter by category, region, and platform.',
}

export default async function DirectoryPage() {
  const allStays = await getAllStays()
  return <DirectoryContent allStays={allStays} />
}
