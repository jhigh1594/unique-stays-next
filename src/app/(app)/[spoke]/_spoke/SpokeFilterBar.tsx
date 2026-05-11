'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import StayCard from '@/components/StayCard'
import type { SpokeSlug } from '@/lib/spokes-config'
import type { NormalizedStay, SpokeConfig } from '@/lib/types'

const REGIONS = ['All', 'West', 'Southwest', 'South', 'Midwest', 'Northeast', 'Southeast'] as const
type Region = typeof REGIONS[number]

const SPOKE_FILTERS: Record<SpokeSlug, string[]> = {
  'unique': ['All', 'Treehouses', 'Geodesic Domes', 'Houseboats', 'Lighthouses', 'Cave Dwellings', 'A-Frame Cabins', 'Glamping'],
  'work-friendly': ['All', '100+ Mbps', '500+ Mbps', 'Gigabit', 'Starlink', 'Has Desk'],
  'pet-friendly': ['All', 'Dogs Welcome', 'No Size Limit', 'Fenced Yard', 'Cat Friendly'],
  'rv-ready': ['All', '30-Amp', '50-Amp', 'Full Hookup', 'Pull-Through', 'Pet Friendly'],
  'ev-ready': ['All', 'Tesla Charger', 'Level 2', 'J1772', 'Solar Powered'],
}

interface SpokeFilterBarProps {
  stays: NormalizedStay[]
  config: SpokeConfig
  spokeSlug: SpokeSlug
}

export default function SpokeFilterBar({ stays, config, spokeSlug }: SpokeFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeRegion, setActiveRegion] = useState<Region>('All')

  const filters = SPOKE_FILTERS[spokeSlug]

  const filtered = useMemo(() => {
    let results = [...stays]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.description.toLowerCase().includes(q)
      )
    }

    if (activeRegion !== 'All') {
      results = results.filter((s) => s.region === activeRegion)
    }

    if (activeFilter !== 'All') {
      results = results.filter((s) => {
        switch (spokeSlug) {
          case 'unique':
            return s.category === activeFilter
          case 'work-friendly':
            if (activeFilter === 'Has Desk') return s.hasDesk
            if (activeFilter === 'Gigabit') return s.wifiSpeed?.includes('Gbps') || s.wifiSpeed?.includes('940')
            if (activeFilter === 'Starlink') return s.wifiSpeed?.toLowerCase().includes('starlink')
            if (activeFilter === '500+ Mbps') return parseInt(s.wifiSpeed || '0') >= 500 || s.wifiSpeed?.includes('Gbps')
            if (activeFilter === '100+ Mbps') return parseInt(s.wifiSpeed || '0') >= 100
            return true
          case 'pet-friendly':
            if (activeFilter === 'No Size Limit') return s.petPolicy?.toLowerCase().includes('no size') || s.petPolicy?.toLowerCase().includes('any size')
            if (activeFilter === 'Fenced Yard') return s.tags.some(t => t.toLowerCase().includes('fenced'))
            if (activeFilter === 'Cat Friendly') return s.petPolicy?.toLowerCase().includes('cat')
            if (activeFilter === 'Dogs Welcome') return s.petFriendly
            return true
          case 'rv-ready':
            if (activeFilter === '50-Amp') return s.rvDetails?.includes('50-amp') || s.rvDetails?.includes('50 amp')
            if (activeFilter === '30-Amp') return s.rvDetails?.includes('30-amp') || s.rvDetails?.includes('30 amp')
            if (activeFilter === 'Full Hookup') return s.rvDetails?.toLowerCase().includes('full')
            if (activeFilter === 'Pull-Through') return s.rvDetails?.toLowerCase().includes('pull')
            if (activeFilter === 'Pet Friendly') return s.petFriendly
            return true
          case 'ev-ready':
            if (activeFilter === 'Tesla Charger') return s.evDetails?.toLowerCase().includes('tesla')
            if (activeFilter === 'Level 2') return s.evDetails?.toLowerCase().includes('level 2')
            if (activeFilter === 'J1772') return s.evDetails?.toLowerCase().includes('j1772')
            if (activeFilter === 'Solar Powered') return s.tags.some(t => t.toLowerCase().includes('solar'))
            return true
          default:
            return true
        }
      })
    }

    results.sort((a, b) => {
      if (a.editorsPick && !b.editorsPick) return -1
      if (!a.editorsPick && b.editorsPick) return 1
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return (b.rating ?? 0) - (a.rating ?? 0)
    })

    return results
  }, [stays, searchQuery, activeFilter, activeRegion, spokeSlug])

  return (
    <>
      {/* SEARCH + FILTERS */}
      <section
        className="sticky top-16 md:top-20 z-30 py-3 border-b border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.975 0.012 85 / 0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-xl"
              style={{ background: 'oklch(0.99 0.005 85)', border: '1.5px solid oklch(0.88 0.025 75)' }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: config.accentColor }} />
              <input
                type="text"
                placeholder={`Search ${config.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'oklch(0.22 0.01 60)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4" style={{ color: 'oklch(0.55 0.03 60)' }} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeFilter === f ? config.accentColor : 'oklch(0.99 0.005 85)',
                    color: activeFilter === f ? 'oklch(0.99 0.005 85)' : 'oklch(0.40 0.03 60)',
                    border: `1.5px solid ${activeFilter === f ? config.accentColor : 'oklch(0.88 0.025 75)'}`,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {f}
                </button>
              ))}

              <select
                value={activeRegion}
                onChange={(e) => setActiveRegion(e.target.value as Region)}
                className="appearance-none px-3 py-1.5 rounded-full text-xs font-semibold outline-none"
                style={{
                  background: activeRegion !== 'All' ? config.accentColor : 'oklch(0.99 0.005 85)',
                  color: activeRegion !== 'All' ? 'oklch(0.99 0.005 85)' : 'oklch(0.40 0.03 60)',
                  border: `1.5px solid ${activeRegion !== 'All' ? config.accentColor : 'oklch(0.88 0.025 75)'}`,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>
                ))}
              </select>
            </div>

            <div
              className="ml-auto text-sm font-medium self-center whitespace-nowrap"
              style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {filtered.length} stays
            </div>
          </div>
        </div>
      </section>

      {/* LISTINGS GRID */}
      <section className="py-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">{config.heroEmoji}</div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                No stays found
              </h3>
              <p
                className="text-sm mb-6"
                style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Try adjusting your filters or search terms
              </p>
              <button
                className="px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{
                  background: config.accentColor,
                  color: 'oklch(0.99 0.005 85)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
                onClick={() => { setSearchQuery(''); setActiveFilter('All'); setActiveRegion('All') }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((stay, i) => (
                <StayCard key={stay.id} stay={stay} accentColor={config.accentColor} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
