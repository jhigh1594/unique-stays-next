'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BroadsheetMasthead from './BroadsheetMasthead'
import CategoryIndex from './CategoryIndex'
import FilterSidebar from './FilterSidebar'
import StayCard from './StayCard'
import {
  type FilterState,
  type SpokeFilterState,
  type SortOption,
  createEmptyFilterState,
  applyFilters,
  serializeFilters,
  deserializeFilters,
  getLocationFacets,
} from '@/lib/filter-utils'
import { isNaturalLanguage } from '@/lib/search-utils'
import type { NormalizedStay } from '@/lib/types'

const PAGE_SIZE = 18

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

interface FilterEngineProps {
  allStays: NormalizedStay[]
  spokeSlug?: string
}

export default function FilterEngine({ allStays, spokeSlug }: FilterEngineProps) {
  const [filters, setFilters] = useState<FilterState>(createEmptyFilterState)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [aiIds, setAiIds] = useState<number[] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Location facets (precomputed once)
  const locationFacets = useMemo(() => getLocationFacets(allStays), [allStays])

  // Init from URL params on mount
  useEffect(() => {
    const params = window.location.search
    if (!params) return
    const state = deserializeFilters(params)
    setFilters(state)
  }, [])

  // Sync filters to URL
  useEffect(() => {
    const params = serializeFilters(filters)
    const qs = params.toString()
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [filters])

  // Debounced AI search
  useEffect(() => {
    if (!isNaturalLanguage(filters.search)) {
      setAiIds(null)
      setAiLoading(false)
      return
    }

    setAiLoading(true)
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(filters.search)}`, {
          signal: controller.signal,
        })
        const data = (await res.json()) as { ids: number[] | null }
        setAiIds(data.ids)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setAiIds(null)
      } finally {
        setAiLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [filters.search])

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, aiIds])

  // Filter + sort pipeline
  const filtered = useMemo(
    () => applyFilters(allStays, filters, aiIds),
    [allStays, filters, aiIds],
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginatedResults = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // ── Handlers ──
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
  }, [])

  const handleCategoryChange = useCallback((category: string | null) => {
    setFilters((prev) => ({ ...prev, category }))
  }, [])

  const handleSortChange = useCallback((value: SortOption) => {
    setFilters((prev) => ({ ...prev, sortBy: value }))
  }, [])

  const handleLocationChange = useCallback((location: string | null) => {
    setFilters((prev) => ({ ...prev, location }))
  }, [])

  const handlePlatformToggle = useCallback((platform: string) => {
    setFilters((prev) => {
      const next = new Set(prev.platform)
      if (next.has(platform)) next.delete(platform)
      else next.add(platform)
      return { ...prev, platform: next }
    })
  }, [])

  const handlePriceMinChange = useCallback((value: number | null) => {
    setFilters((prev) => ({ ...prev, priceMin: value }))
  }, [])

  const handlePriceMaxChange = useCallback((value: number | null) => {
    setFilters((prev) => ({ ...prev, priceMax: value }))
  }, [])

  const handleEditorsPickToggle = useCallback(() => {
    setFilters((prev) => ({ ...prev, editorsPick: !prev.editorsPick }))
  }, [])

  const handleSpokeFilterChange = useCallback((update: Partial<SpokeFilterState>) => {
    setFilters((prev) => ({ ...prev, spoke: { ...prev.spoke, ...update } }))
  }, [])

  const handleReset = useCallback(() => {
    setFilters(createEmptyFilterState())
    setAiIds(null)
    setIsSidebarOpen(false)
  }, [])

  const closeMobile = useCallback(() => {
    if (window.innerWidth <= 700) setIsSidebarOpen(false)
  }, [])

  return (
    <div style={{ background: 'oklch(0.975 0.012 85)', minHeight: '100vh' }}>
      {/* Tier 1: Broadsheet Masthead */}
      <section
        className="sticky top-16 md:top-20 z-30 py-4 border-b"
        style={{ borderColor: 'oklch(0.88 0.025 75)', background: 'oklch(0.975 0.012 85 / 0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <BroadsheetMasthead
            resultCount={filtered.length}
            searchQuery={filters.search}
            onSearchChange={handleSearchChange}
            sortBy={filters.sortBy}
            onSortChange={handleSortChange}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
            aiLoading={aiLoading}
          />
          <CategoryIndex
            activeCategory={filters.category}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </section>

      {/* Tier 2 + Grid */}
      <section className="py-8">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="filter-layout">
            {/* Sidebar */}
            {isSidebarOpen && (
              <FilterSidebar
                state={filters}
                locationFacets={locationFacets}
                resultCount={filtered.length}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onCategoryChange={handleCategoryChange}
                onLocationChange={handleLocationChange}
                onPlatformToggle={handlePlatformToggle}
                onPriceMinChange={handlePriceMinChange}
                onPriceMaxChange={handlePriceMaxChange}
                onEditorsPickToggle={handleEditorsPickToggle}
                onSpokeFilterChange={handleSpokeFilterChange}
                onReset={handleReset}
                spokeSlug={spokeSlug}
              />
            )}

            {/* Grid */}
            <div className="filter-layout__grid">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                  <img
                    src="/logo-v2.png"
                    alt="Searching..."
                    className="h-20 w-auto animate-pulse"
                    style={{ opacity: 0.7 }}
                  />
                  <p style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Searching the collection…
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-24">
                  <h3
                    className="text-5xl md:text-6xl font-bold mb-3"
                    style={{ fontFamily: 'var(--font-display)', color: 'oklch(0.22 0.01 60)' }}
                  >
                    Nothing here.
                  </h3>
                  <p style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
                    Try different filters or broaden your search.
                  </p>
                  <button
                    className="mt-6 px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
                    style={{
                      borderRadius: '2px',
                      border: '2px solid oklch(0.55 0.14 38)',
                      color: 'oklch(0.55 0.14 38)',
                      background: 'transparent',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                    }}
                    onClick={handleReset}
                  >
                    Start Over
                  </button>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                      layout
                    >
                      {paginatedResults.map((stay, i) => (
                        <motion.div
                          key={stay.id}
                          layout
                          layoutId={`stay-${stay.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: i * 0.04 }}
                          className="h-full"
                        >
                          <StayCard stay={stay} index={i} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-14">
                      <button
                        onClick={() => { setCurrentPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-30"
                        style={{
                          border: '1.5px solid oklch(0.88 0.025 75)',
                          borderRadius: '2px',
                          background: 'oklch(0.99 0.005 85)',
                          color: 'oklch(0.40 0.03 60)',
                          fontFamily: 'var(--font-body)',
                          letterSpacing: '0.1em',
                          cursor: 'pointer',
                        }}
                      >
                        ← Prev
                      </button>

                      {getPageNumbers(currentPage, totalPages).map((page, i) =>
                        page === '…' ? (
                          <span key={`ellipsis-${i}`} style={{ color: 'oklch(0.60 0.03 60)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
                            …
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                            className="w-9 h-9 text-xs font-bold"
                            style={{
                              border: `1.5px solid ${currentPage === page ? 'oklch(0.55 0.14 38)' : 'oklch(0.88 0.025 75)'}`,
                              borderRadius: '2px',
                              background: currentPage === page ? 'oklch(0.55 0.14 38)' : 'oklch(0.99 0.005 85)',
                              color: currentPage === page ? 'oklch(0.99 0.005 85)' : 'oklch(0.40 0.03 60)',
                              fontFamily: 'var(--font-body)',
                              cursor: 'pointer',
                            }}
                          >
                            {page}
                          </button>
                        ),
                      )}

                      <button
                        onClick={() => { setCurrentPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-30"
                        style={{
                          border: '1.5px solid oklch(0.88 0.025 75)',
                          borderRadius: '2px',
                          background: 'oklch(0.99 0.005 85)',
                          color: 'oklch(0.40 0.03 60)',
                          fontFamily: 'var(--font-body)',
                          letterSpacing: '0.1em',
                          cursor: 'pointer',
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
