'use client'

import { useMemo } from 'react'
import Fuse, { type IFuseOptions, type FuseOptionKey } from 'fuse.js'
import type { NormalizedStay } from './types'

const SEARCH_KEYS: FuseOptionKey<NormalizedStay>[] = [
  { name: 'title', weight: 0.35 },
  { name: 'location', weight: 0.15 },
  { name: 'state', weight: 0.10 },
  { name: 'category', weight: 0.10 },
  { name: 'tags', weight: 0.10 },
  { name: 'description', weight: 0.05 },
  { name: 'subtitle', weight: 0.05 },
  { name: 'bestFor', weight: 0.03 },
  { name: 'vibe', weight: 0.03 },
  { name: 'bestSeason', weight: 0.02 },
  { name: 'region', weight: 0.02 },
]

const FUSE_OPTIONS: IFuseOptions<NormalizedStay> = {
  keys: SEARCH_KEYS,
  threshold: 0.4,
  distance: 200,
  minMatchCharLength: 2,
  ignoreLocation: true,
  includeScore: true,
}

export function useStaySearch(stays: NormalizedStay[], query: string): NormalizedStay[] | null {
  const fuse = useMemo(() => new Fuse(stays, FUSE_OPTIONS), [stays])

  return useMemo(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return null
    return fuse.search(trimmed).map((r) => r.item)
  }, [fuse, query])
}
