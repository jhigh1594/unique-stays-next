'use client'

import { useEffect, useRef } from 'react'
import LocationCombobox from './LocationCombobox'
import type { LocationFacets, FilterState } from '@/lib/filter-utils'

interface FilterSidebarProps {
  state: FilterState
  locationFacets: LocationFacets
  resultCount: number
  isOpen: boolean
  onClose: () => void
  onCategoryChange: (category: string | null) => void
  onLocationChange: (location: string | null) => void
  onPlatformToggle: (platform: string) => void
  onPriceMinChange: (value: number | null) => void
  onPriceMaxChange: (value: number | null) => void
  onEditorsPickToggle: () => void
  onReset: () => void
}

const PLATFORMS = [
  { value: 'Airbnb', rot: '-1deg' },
  { value: 'VRBO', rot: '1.2deg' },
  { value: 'Wander', rot: '0.8deg' },
  { value: 'Direct', rot: '-0.6deg' },
]

export default function FilterSidebar({
  state,
  locationFacets,
  resultCount,
  isOpen,
  onClose,
  onLocationChange,
  onPlatformToggle,
  onPriceMinChange,
  onPriceMaxChange,
  onEditorsPickToggle,
  onReset,
}: FilterSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null)

  // Focus trap + Escape to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Focus trap
      if (e.key === 'Tab' && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const allFacets = [...locationFacets.states, ...locationFacets.cities]

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay${isOpen ? ' mobile-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile filter button */}
      <button className="mobile-filter-btn" onClick={() => { if (!isOpen) onClose() }}>
        Filter ✎
        <span className="mobile-filter-btn__badge">{resultCount}</span>
      </button>

      <aside
        ref={sidebarRef}
        id="filter-sidebar"
        className={`filter-sidebar${isOpen ? ' filter-sidebar--open' : ''}`}
        role="dialog"
        aria-label="Filters"
        aria-hidden={!isOpen}
      >
        <div className="filter-sidebar__inner">
          {/* Stamp Header */}
          <div className="filter-sidebar__section">
            <div className="stamp-header">
              <div className="stamp-box">THE FILTER</div>
            </div>
            <div className="wax-seal">
              <div className="wax-seal__circle">
                <span className="wax-seal__count">{resultCount}</span>
                <span className="wax-seal__label">stays</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="filter-sidebar__section">
            <span className="filter-sidebar__label">Location</span>
            <LocationCombobox
              facets={allFacets}
              activeLocation={state.location}
              onLocationChange={onLocationChange}
            />
          </div>

          {/* Platform */}
          <div className="filter-sidebar__section">
            <span className="filter-sidebar__label">Platform</span>
            <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Platform filter">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  className={`platform-stamp${state.platform.has(p.value) ? ' platform-stamp--active' : ''}`}
                  style={{ '--rot': p.rot } as React.CSSProperties}
                  onClick={() => onPlatformToggle(p.value)}
                  role="checkbox"
                  aria-checked={state.platform.has(p.value)}
                >
                  {p.value}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="filter-sidebar__section">
            <span className="filter-sidebar__label">Price per night</span>
            <div className="flex items-baseline gap-3">
              <div className="flex items-baseline gap-0.5">
                <span className="price-dollar">$</span>
                <input
                  type="number"
                  className="price-input"
                  placeholder="min"
                  min={0}
                  value={state.priceMin ?? ''}
                  onChange={(e) => onPriceMinChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                  aria-label="Minimum price"
                />
              </div>
              <span className="price-sep">&mdash;</span>
              <div className="flex items-baseline gap-0.5">
                <span className="price-dollar">$</span>
                <input
                  type="number"
                  className="price-input"
                  placeholder="max"
                  min={0}
                  value={state.priceMax ?? ''}
                  onChange={(e) => onPriceMaxChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                  aria-label="Maximum price"
                />
              </div>
            </div>
          </div>

          {/* Editor's Pick */}
          <div className="filter-sidebar__section">
            <div
              className="postmark-toggle"
              onClick={onEditorsPickToggle}
              role="switch"
              aria-checked={state.editorsPick}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditorsPickToggle() } }}
            >
              <div className={`postmark-circle${state.editorsPick ? ' postmark-circle--active' : ''}`}>
                <span style={{ fontSize: '0.45rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', textAlign: 'center', lineHeight: 1.1 }}>
                  ED'S<br />PICK
                </span>
              </div>
              <span className="postmark-label">Only editor's picks</span>
            </div>
          </div>

          {/* Reset */}
          <div className="filter-sidebar__section" style={{ borderBottom: 'none' }}>
            <button className="reset-link" onClick={onReset}>
              [ CLEAR ALL FILTERS ]
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
