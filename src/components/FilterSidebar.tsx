'use client'

import { useEffect, useRef } from 'react'
import LocationCombobox from './LocationCombobox'
import type { LocationFacets, FilterState, SpokeFilterState } from '@/lib/filter-utils'

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
  onSpokeFilterChange: (update: Partial<SpokeFilterState>) => void
  onReset: () => void
  spokeSlug?: string
}

const PLATFORMS = [
  { value: 'Airbnb', rot: '-1deg' },
  { value: 'VRBO', rot: '1.2deg' },
  { value: 'Wander', rot: '0.8deg' },
  { value: 'Direct', rot: '-0.6deg' },
]

const WIFI_OPTIONS = [
  { label: '100+ Mbps', value: 100 },
  { label: '250+ Mbps', value: 250 },
  { label: '500+ Mbps', value: 500 },
  { label: 'Gigabit+', value: 1000 },
]

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      className="flex items-center gap-2 w-full text-left py-1.5 group"
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
    >
      <div
        className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
        style={{
          border: '1.5px solid oklch(0.75 0.02 75)',
          borderRadius: '2px',
          background: checked ? 'oklch(0.55 0.14 38)' : 'oklch(0.99 0.005 85)',
          transition: 'background 0.15s',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="oklch(0.99 0.005 85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          color: checked ? 'oklch(0.22 0.01 60)' : 'oklch(0.50 0.03 60)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </button>
  )
}

function SpokeSpecificFilters({
  spokeSlug,
  spoke,
  onChange,
}: {
  spokeSlug: string
  spoke: SpokeFilterState
  onChange: (update: Partial<SpokeFilterState>) => void
}) {
  if (spokeSlug === 'work-friendly') {
    return (
      <div className="filter-sidebar__section">
        <span className="filter-sidebar__label">WiFi &amp; Workspace</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'oklch(0.55 0.03 60)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Min WiFi Speed
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {WIFI_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="platform-stamp"
                style={{
                  '--rot': '0deg',
                  background: spoke.wifiMinMbps === opt.value ? 'oklch(0.55 0.14 38)' : 'oklch(0.99 0.005 85)',
                  color: spoke.wifiMinMbps === opt.value ? 'oklch(0.99 0.005 85)' : 'oklch(0.40 0.03 60)',
                  borderColor: spoke.wifiMinMbps === opt.value ? 'oklch(0.55 0.14 38)' : 'oklch(0.88 0.025 75)',
                  fontSize: '0.65rem',
                  padding: '0.25rem 0.5rem',
                } as React.CSSProperties}
                onClick={() => onChange({ wifiMinMbps: spoke.wifiMinMbps === opt.value ? null : opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <ToggleRow label="Dedicated desk" checked={spoke.hasDesk} onChange={() => onChange({ hasDesk: !spoke.hasDesk })} />
        </div>
      </div>
    )
  }

  if (spokeSlug === 'pet-friendly') {
    return (
      <div className="filter-sidebar__section">
        <span className="filter-sidebar__label">Pet Policy</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
          <ToggleRow label="Dogs welcome" checked={spoke.petFriendly} onChange={() => onChange({ petFriendly: !spoke.petFriendly })} />
          <ToggleRow label="Fenced yard" checked={spoke.fencedYard} onChange={() => onChange({ fencedYard: !spoke.fencedYard })} />
          <ToggleRow label="Cat friendly" checked={spoke.catFriendly} onChange={() => onChange({ catFriendly: !spoke.catFriendly })} />
          <ToggleRow label="No size limit" checked={spoke.noSizeLimit} onChange={() => onChange({ noSizeLimit: !spoke.noSizeLimit })} />
        </div>
      </div>
    )
  }

  if (spokeSlug === 'rv-ready') {
    return (
      <div className="filter-sidebar__section">
        <span className="filter-sidebar__label">RV Details</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
          <ToggleRow label="RV hookup" checked={spoke.rvHookup} onChange={() => onChange({ rvHookup: !spoke.rvHookup })} />
          <ToggleRow label="Full hookup" checked={spoke.rvFullHookup} onChange={() => onChange({ rvFullHookup: !spoke.rvFullHookup })} />
          <ToggleRow label="50-Amp" checked={spoke.rv50Amp} onChange={() => onChange({ rv50Amp: !spoke.rv50Amp })} />
          <ToggleRow label="Pull-through" checked={spoke.rvPullThrough} onChange={() => onChange({ rvPullThrough: !spoke.rvPullThrough })} />
        </div>
      </div>
    )
  }

  if (spokeSlug === 'ev-ready') {
    return (
      <div className="filter-sidebar__section">
        <span className="filter-sidebar__label">Charger Type</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
          <ToggleRow label="EV charger" checked={spoke.evCharger} onChange={() => onChange({ evCharger: !spoke.evCharger })} />
          <ToggleRow label="Tesla charger" checked={spoke.evTesla} onChange={() => onChange({ evTesla: !spoke.evTesla })} />
          <ToggleRow label="Level 2" checked={spoke.evLevel2} onChange={() => onChange({ evLevel2: !spoke.evLevel2 })} />
          <ToggleRow label="J1772" checked={spoke.evJ1772} onChange={() => onChange({ evJ1772: !spoke.evJ1772 })} />
        </div>
      </div>
    )
  }

  return null
}

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
  onSpokeFilterChange,
  onReset,
  spokeSlug,
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

          {/* Spoke-specific filters (after Editor's Pick) */}
          {spokeSlug && (
            <SpokeSpecificFilters
              spokeSlug={spokeSlug}
              spoke={state.spoke}
              onChange={onSpokeFilterChange}
            />
          )}

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
