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
  getActiveFilterCount,
} from '@/lib/filter-utils'
import { useStaySearch } from '@/lib/use-stay-search'
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
  const [navHidden, setNavHidden] = useState(false)
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

  // Track nav hide/show to adjust sticky top
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y > 200 && y > lastY) setNavHidden(true)
      else if (y < lastY) setNavHidden(false)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Client-side fuzzy search via Fuse.js
  const searchResults = useStaySearch(allStays, filters.search)

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchResults])

  // Filter + sort pipeline
  const filtered = useMemo(
    () => applyFilters(allStays, filters, searchResults),
    [allStays, filters, searchResults],
  )

  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters])

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
    setIsSidebarOpen(false)
  }, [])

  const closeMobile = useCallback(() => {
    if (window.innerWidth <= 700) setIsSidebarOpen(false)
  }, [])

  return (
    <div style={{ background: 'oklch(0.975 0.012 85)', minHeight: '100vh' }}>
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <section
        className="pt-28 pb-12 relative overflow-hidden grain-overlay"
        style={{ background: 'oklch(0.20 0.06 155)' }}
      >
        <div className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1
              className="font-bold leading-none"
              style={{
                fontFamily: 'Fraunces, serif',
                color: 'oklch(0.99 0.005 85)',
                fontSize: 'clamp(3.5rem, 9vw, 7rem)',
                lineHeight: 0.95,
              }}
            >
              The<br />
              <span style={{ fontStyle: 'italic', color: 'oklch(0.85 0.10 45)' }}>Collection.</span>
            </h1>
            <div className="flex flex-col items-start md:items-end gap-3 pb-1">
              <span
                className="stamp-badge"
                style={{
                  color: 'oklch(0.72 0.10 40)',
                  borderColor: 'oklch(0.72 0.10 40)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.75rem',
                  padding: '5px 12px',
                }}
              >
                {filtered.length} stays
              </span>
              <p
                className="text-sm"
                style={{ color: 'oklch(0.72 0.04 155)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Updated weekly. Every one hand-reviewed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIDEBAR + CONTENT LAYOUT ─────────────────── */}
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

        {/* Main content area — search bar + grid */}
        <div className="filter-layout__main">
          {/* ── SEARCH + FILTERS ────────────────────────────── */}
          <section
            className={`sticky z-30 py-4 border-b transition-[top] duration-500 ${
              navHidden ? 'top-0' : 'top-16 md:top-20'
            }`}
            style={{
              borderColor: 'oklch(0.88 0.025 75)',
              background: 'oklch(0.975 0.012 85 / 0.97)',
              backdropFilter: 'blur(12px)',
            }}
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
                activeFilterCount={activeFilterCount}
                onClearFilters={handleReset}
              />
              <CategoryIndex
                activeCategory={filters.category}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          </section>

          {/* Grid */}
          <section className="py-8">
            <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
              {filtered.length === 0 ? (
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
          </section>
        </div>
      </div>
    </div>
  )
}
