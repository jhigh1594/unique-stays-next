'use client'

import { Search, X } from 'lucide-react'
import type { SortOption } from '@/lib/filter-utils'

interface BroadsheetMastheadProps {
  resultCount: number
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  aiLoading: boolean
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export default function BroadsheetMasthead({
  resultCount,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  isSidebarOpen,
  onToggleSidebar,
  aiLoading,
}: BroadsheetMastheadProps) {
  return (
    <div className="broadsheet-masthead">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="broadsheet-title">The Directory</span>
          <span className="broadsheet-count">
            {aiLoading ? '—' : resultCount} stays
          </span>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="broadsheet-sort"
            aria-label="Sort stays"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            className="filter-toggle-btn"
            onClick={onToggleSidebar}
            aria-expanded={isSidebarOpen}
            aria-controls="filter-sidebar"
            aria-label="Toggle filters"
          >
            <span className="filter-toggle-btn__text">FIL<br />TER</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="broadsheet-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'oklch(0.55 0.14 38)', flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
        <input
          type="text"
          placeholder="Search stays..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X width={16} height={16} style={{ color: 'oklch(0.55 0.03 60)' }} />
          </button>
        )}
        {aiLoading && (
          <span style={{ fontSize: '0.7rem', color: 'oklch(0.55 0.14 38)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>
            searching...
          </span>
        )}
      </div>
    </div>
  )
}
