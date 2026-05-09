'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import StayCard from '@/components/StayCard'
import { CATEGORIES_CONFIG } from '@/lib/categories-config'
import { REGIONS, type Region, isNaturalLanguage } from '@/lib/search-utils'
import type { NormalizedStay } from '@/lib/types'

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

export default function DirectoryContent({ allStays }: { allStays: NormalizedStay[] }) {
  useScrollReveal()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeRegion, setActiveRegion] = useState<Region>('All')
  const [activePlatform, setActivePlatform] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured')
  const [showFilters, setShowFilters] = useState(false)
  const [aiIds, setAiIds] = useState<number[] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Init from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category')
    const q = params.get('q')
    if (cat) setActiveCategory(cat)
    if (q) setSearchQuery(q)
  }, [])

  // Debounced NL search — fires 400ms after user stops typing
  useEffect(() => {
    if (!isNaturalLanguage(searchQuery)) {
      setAiIds(null)
      setAiLoading(false)
      return
    }

    setAiLoading(true)
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
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
  }, [searchQuery])

  const filtered = useMemo(() => {
    // AI search path — re-sort by relevance, compose with dropdown filters
    if (aiIds !== null) {
      let results = aiIds
        .map((id) => allStays.find((s) => s.id === id))
        .filter(Boolean) as NormalizedStay[]
      if (activeCategory !== 'All') results = results.filter((s) => s.category === activeCategory)
      if (activeRegion !== 'All') results = results.filter((s) => s.region === activeRegion)
      if (activePlatform !== 'All') results = results.filter((s) => s.platform === activePlatform)
      return results
    }

    let results = [...allStays]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.description.toLowerCase().includes(q)
      )
    }

    if (activeCategory !== 'All') {
      results = results.filter((s) => s.category === activeCategory)
    }

    if (activeRegion !== 'All') {
      results = results.filter((s) => s.region === activeRegion)
    }

    if (activePlatform !== 'All') {
      results = results.filter((s) => s.platform === activePlatform)
    }

    switch (sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        results.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        break
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
  }, [allStays, searchQuery, aiIds, activeCategory, activeRegion, activePlatform, sortBy])

  const clearFilters = () => {
    setSearchQuery('')
    setActiveCategory('All')
    setActiveRegion('All')
    setActivePlatform('All')
    setSortBy('featured')
  }

  const hasActiveFilters =
    searchQuery || activeCategory !== 'All' || activeRegion !== 'All' || activePlatform !== 'All'

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>

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

      {/* ── SEARCH + FILTERS ────────────────────────────── */}
      <section
        className="sticky top-16 md:top-20 z-30 py-4 border-b border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.975 0.012 85 / 0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2"
              style={{
                background: 'oklch(0.99 0.005 85)',
                border: '1.5px solid oklch(0.88 0.025 75)',
                borderRadius: '3px',
              }}
            >
              <Search className={`w-4 h-4 flex-shrink-0${aiLoading ? ' animate-pulse' : ''}`} style={{ color: 'oklch(0.55 0.14 38)' }} />
              <input
                type="text"
                placeholder="Search stays..."
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

            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all"
              style={{
                background: showFilters ? 'oklch(0.55 0.14 38)' : 'oklch(0.99 0.005 85)',
                color: showFilters ? 'oklch(0.99 0.005 85)' : 'oklch(0.40 0.03 60)',
                border: `2px solid ${showFilters ? 'oklch(0.72 0.10 40)' : 'oklch(0.88 0.025 75)'}`,
                borderRadius: '2px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                letterSpacing: '0.1em',
                fontSize: '0.65rem',
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: showFilters ? 'oklch(0.85 0.10 45)' : 'oklch(0.55 0.14 38)' }}
                />
              )}
            </button>

            <div className="relative hidden sm:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium outline-none"
                style={{
                  background: 'oklch(0.99 0.005 85)',
                  color: 'oklch(0.40 0.03 60)',
                  border: '1.5px solid oklch(0.88 0.025 75)',
                  borderRadius: '3px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                <option value="featured">Featured First</option>
                <option value="rating">Highest Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'oklch(0.55 0.03 60)' }}
              />
            </div>

            {hasActiveFilters && (
              <button
                className="stamp-badge transition-colors hover:bg-[oklch(0.55_0.14_38)] hover:text-[oklch(0.99_0.005_85)] hover:border-[oklch(0.55_0.14_38)]"
                style={{
                  color: 'oklch(0.55 0.14 38)',
                  borderColor: 'oklch(0.55 0.14 38)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'transparent',
                }}
                onClick={clearFilters}
              >
                Reset
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[oklch(0.88_0.025_75)] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2">
                  <span
                    className="stamp-badge"
                    style={{ color: 'oklch(0.50 0.03 60)', borderColor: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Category
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`category-pill stamp ${activeCategory === 'All' ? 'active' : 'inactive'}`}
                    onClick={() => setActiveCategory('All')}
                  >
                    All
                  </button>
                  {CATEGORIES_CONFIG.slice(0, 5).map((cat) => (
                    <button
                      key={cat.id}
                      className={`category-pill stamp ${activeCategory === cat.id ? 'active' : 'inactive'}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span
                    className="stamp-badge"
                    style={{ color: 'oklch(0.50 0.03 60)', borderColor: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Region
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      className={`category-pill stamp ${activeRegion === region ? 'active' : 'inactive'}`}
                      onClick={() => setActiveRegion(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2">
                  <span
                    className="stamp-badge"
                    style={{ color: 'oklch(0.50 0.03 60)', borderColor: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Platform
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Airbnb', 'VRBO', 'Wander', 'Direct'].map((p) => (
                    <button
                      key={p}
                      className={`category-pill stamp ${activePlatform === p ? 'active' : 'inactive'}`}
                      onClick={() => setActivePlatform(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── RESULTS GRID ────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <h3
                className="text-5xl md:text-6xl font-bold mb-3"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Nothing here.
              </h3>
              <p
                className="text-sm mb-8"
                style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Try different filters or broaden your search.
              </p>
              <button
                className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all hover:bg-[oklch(0.55_0.14_38)] hover:text-[oklch(0.99_0.005_85)] hover:border-[oklch(0.55_0.14_38)]"
                style={{
                  borderRadius: '2px',
                  border: '2px solid oklch(0.55 0.14 38)',
                  color: 'oklch(0.55 0.14 38)',
                  background: 'transparent',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                }}
                onClick={clearFilters}
              >
                Start Over
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {filtered.map((stay, i) => (
                <div
                  key={stay.id}
                  className="fade-up"
                  style={{ transitionDelay: `${Math.min(i * 50, 400)}ms` }}
                >
                  <StayCard stay={stay} index={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
