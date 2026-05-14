'use client'

import FilterEngine from '@/components/FilterEngine'
import type { NormalizedStay } from '@/lib/types'

export default function DirectoryContent({ allStays }: { allStays: NormalizedStay[] }) {
  return <FilterEngine allStays={allStays} />
}
