import type { NormalizedStay } from './types'

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating'

/** Parse wifi speed string like "500 Mbps" or "1 Gbps" into a numeric Mbps value */
export function parseWifiMbps(wifiSpeed: string): number {
  if (!wifiSpeed) return 0
  const lower = wifiSpeed.toLowerCase().trim()
  if (lower.includes('gbps')) {
    const match = lower.match(/(\d+)/)
    return match ? parseInt(match[1], 10) * 1000 : 0
  }
  const match = lower.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

export interface SpokeFilterState {
  // work-friendly
  wifiMinMbps: number | null
  hasDesk: boolean
  // pet-friendly
  petFriendly: boolean
  fencedYard: boolean
  catFriendly: boolean
  noSizeLimit: boolean
  // rv-ready
  rvHookup: boolean
  rvFullHookup: boolean
  rv50Amp: boolean
  rvPullThrough: boolean
  // ev-ready
  evCharger: boolean
  evTesla: boolean
  evLevel2: boolean
  evJ1772: boolean
}

export interface FilterState {
  search: string
  category: string | null
  location: string | null
  platform: Set<string>
  priceMin: number | null
  priceMax: number | null
  editorsPick: boolean
  sortBy: SortOption
  spoke: SpokeFilterState
}

export function createEmptySpokeFilterState(): SpokeFilterState {
  return {
    wifiMinMbps: null,
    hasDesk: false,
    petFriendly: false,
    fencedYard: false,
    catFriendly: false,
    noSizeLimit: false,
    rvHookup: false,
    rvFullHookup: false,
    rv50Amp: false,
    rvPullThrough: false,
    evCharger: false,
    evTesla: false,
    evLevel2: false,
    evJ1772: false,
  }
}

export function createEmptyFilterState(): FilterState {
  return {
    search: '',
    category: null,
    location: null,
    platform: new Set(),
    priceMin: null,
    priceMax: null,
    editorsPick: false,
    sortBy: 'featured',
    spoke: createEmptySpokeFilterState(),
  }
}

export function applyFilters(
  stays: NormalizedStay[],
  state: FilterState,
  aiIds?: number[] | null,
): NormalizedStay[] {
  let results: NormalizedStay[]

  // AI search path — re-sort by relevance, compose with other filters
  if (aiIds != null) {
    results = aiIds
      .map((id) => stays.find((s) => s.id === id))
      .filter((s): s is NormalizedStay => s != null)
  } else {
    results = [...stays]
  }

  // Text search (only in non-AI path)
  if (aiIds == null && state.search.trim()) {
    const q = state.search.toLowerCase()
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.description.toLowerCase().includes(q),
    )
  }

  // Category
  if (state.category) {
    results = results.filter((s) => s.category === state.category)
  }

  // Location
  if (state.location) {
    results = results.filter((s) => filterByLocation(s, state.location!))
  }

  // Platform
  if (state.platform.size > 0) {
    results = results.filter((s) => state.platform.has(s.platform))
  }

  // Price
  if (state.priceMin != null) {
    results = results.filter((s) => s.price >= state.priceMin!)
  }
  if (state.priceMax != null) {
    results = results.filter((s) => s.price <= state.priceMax!)
  }

  // Editor's Pick
  if (state.editorsPick) {
    results = results.filter((s) => s.editorsPick)
  }

  // Spoke-specific filters
  const sf = state.spoke

  // work-friendly
  if (sf.wifiMinMbps != null) {
    results = results.filter((s) => {
      const mbps = parseWifiMbps(s.wifiSpeed)
      return mbps >= sf.wifiMinMbps!
    })
  }
  if (sf.hasDesk) {
    results = results.filter((s) => s.hasDesk)
  }

  // pet-friendly
  if (sf.petFriendly) {
    results = results.filter((s) => s.petFriendly)
  }
  if (sf.fencedYard) {
    results = results.filter((s) => s.tags.some((t) => t.toLowerCase().includes('fenced')))
  }
  if (sf.catFriendly) {
    results = results.filter((s) => s.petPolicy?.toLowerCase().includes('cat'))
  }
  if (sf.noSizeLimit) {
    results = results.filter(
      (s) =>
        s.petPolicy?.toLowerCase().includes('no size') ||
        s.petPolicy?.toLowerCase().includes('any size'),
    )
  }

  // rv-ready
  if (sf.rvHookup) {
    results = results.filter((s) => s.rvHookup)
  }
  if (sf.rvFullHookup) {
    results = results.filter((s) => s.rvDetails?.toLowerCase().includes('full'))
  }
  if (sf.rv50Amp) {
    results = results.filter(
      (s) => s.rvDetails?.includes('50-amp') || s.rvDetails?.includes('50 amp'),
    )
  }
  if (sf.rvPullThrough) {
    results = results.filter((s) => s.rvDetails?.toLowerCase().includes('pull'))
  }

  // ev-ready
  if (sf.evCharger) {
    results = results.filter((s) => s.evCharger)
  }
  if (sf.evTesla) {
    results = results.filter((s) => s.evDetails?.toLowerCase().includes('tesla'))
  }
  if (sf.evLevel2) {
    results = results.filter((s) => s.evDetails?.toLowerCase().includes('level 2'))
  }
  if (sf.evJ1772) {
    results = results.filter((s) => s.evDetails?.toLowerCase().includes('j1772'))
  }

  // Sort
  switch (state.sortBy) {
    case 'price-asc':
      results.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      results.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      break
    case 'featured':
    default:
      results.sort((a, b) => {
        if (a.editorsPick && !b.editorsPick) return -1
        if (!a.editorsPick && b.editorsPick) return 1
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return (b.rating ?? 0) - (a.rating ?? 0)
      })
  }

  return results
}

export function filterByLocation(stay: NormalizedStay, locationSlug: string): boolean {
  const slug = locationSlug.toLowerCase()
  if (stay.state.toLowerCase() === slug) return true
  if (stay.location.toLowerCase().includes(slug)) return true
  return false
}

export interface LocationFacet {
  name: string
  slug: string
  count: number
  state?: string
}

export interface LocationFacets {
  states: LocationFacet[]
  cities: LocationFacet[]
}

export function getLocationFacets(stays: NormalizedStay[]): LocationFacets {
  const stateMap = new Map<string, number>()
  const cityMap = new Map<string, { count: number; state: string }>()

  for (const stay of stays) {
    // States
    const state = stay.state
    stateMap.set(state, (stateMap.get(state) ?? 0) + 1)

    // Cities (location field, e.g. "Asheville, North Carolina")
    const city = stay.location.split(',')[0]?.trim()
    if (city) {
      const key = `${city}|${state}`.toLowerCase()
      const existing = cityMap.get(key)
      if (existing) {
        existing.count++
      } else {
        cityMap.set(key, { count: 1, state })
      }
    }
  }

  const states: LocationFacet[] = Array.from(stateMap.entries())
    .map(([name, count]) => ({ name, slug: name.toLowerCase(), count }))
    .sort((a, b) => b.count - a.count)

  const cities: LocationFacet[] = Array.from(cityMap.entries())
    .map(([key, { count, state }]) => {
      const name = key.split('|')[0]!
      return { name, slug: name.toLowerCase(), count, state }
    })
    .sort((a, b) => b.count - a.count)

  return { states, cities }
}

// ── URL Serialization ──

export function serializeFilters(state: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  if (state.search) params.set('q', state.search)
  if (state.category) params.set('category', state.category)
  if (state.location) params.set('loc', state.location)
  if (state.platform.size > 0) params.set('platform', Array.from(state.platform).join(','))
  if (state.priceMin != null) params.set('priceMin', String(state.priceMin))
  if (state.priceMax != null) params.set('priceMax', String(state.priceMax))
  if (state.editorsPick) params.set('pick', '1')
  if (state.sortBy !== 'featured') params.set('sort', state.sortBy)

  // Spoke-specific
  const sf = state.spoke
  if (sf.wifiMinMbps != null) params.set('wifiMin', String(sf.wifiMinMbps))
  if (sf.hasDesk) params.set('desk', '1')
  if (sf.petFriendly) params.set('pet', '1')
  if (sf.fencedYard) params.set('fenced', '1')
  if (sf.catFriendly) params.set('cat', '1')
  if (sf.noSizeLimit) params.set('nosize', '1')
  if (sf.rvHookup) params.set('rv', '1')
  if (sf.rvFullHookup) params.set('rvfull', '1')
  if (sf.rv50Amp) params.set('rv50', '1')
  if (sf.rvPullThrough) params.set('rvpull', '1')
  if (sf.evCharger) params.set('ev', '1')
  if (sf.evTesla) params.set('evtesla', '1')
  if (sf.evLevel2) params.set('evl2', '1')
  if (sf.evJ1772) params.set('evj', '1')

  return params
}

export function deserializeFilters(search: string): FilterState {
  const params = new URLSearchParams(search)
  const state = createEmptyFilterState()

  if (params.get('q')) state.search = params.get('q')!
  if (params.get('category')) state.category = params.get('category')!
  if (params.get('loc')) state.location = params.get('loc')!
  if (params.get('platform')) {
    for (const p of params.get('platform')!.split(',')) {
      state.platform.add(p)
    }
  }
  if (params.get('priceMin')) state.priceMin = parseInt(params.get('priceMin')!, 10)
  if (params.get('priceMax')) state.priceMax = parseInt(params.get('priceMax')!, 10)
  if (params.get('pick') === '1') state.editorsPick = true
  if (params.get('sort')) {
    const sort = params.get('sort')!
    if (['featured', 'price-asc', 'price-desc', 'rating'].includes(sort)) {
      state.sortBy = sort as SortOption
    }
  }

  // Spoke-specific
  if (params.get('wifiMin')) state.spoke.wifiMinMbps = parseInt(params.get('wifiMin')!, 10)
  if (params.get('desk') === '1') state.spoke.hasDesk = true
  if (params.get('pet') === '1') state.spoke.petFriendly = true
  if (params.get('fenced') === '1') state.spoke.fencedYard = true
  if (params.get('cat') === '1') state.spoke.catFriendly = true
  if (params.get('nosize') === '1') state.spoke.noSizeLimit = true
  if (params.get('rv') === '1') state.spoke.rvHookup = true
  if (params.get('rvfull') === '1') state.spoke.rvFullHookup = true
  if (params.get('rv50') === '1') state.spoke.rv50Amp = true
  if (params.get('rvpull') === '1') state.spoke.rvPullThrough = true
  if (params.get('ev') === '1') state.spoke.evCharger = true
  if (params.get('evtesla') === '1') state.spoke.evTesla = true
  if (params.get('evl2') === '1') state.spoke.evLevel2 = true
  if (params.get('evj') === '1') state.spoke.evJ1772 = true

  return state
}
