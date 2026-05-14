'use client'

import { Search, X, SlidersHorizontal } from 'lucide-react'
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
  activeFilterCount: number
  onClearFilters: () => void
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
  activeFilterCount,
  onClearFilters,
}: BroadsheetMastheadProps) {
  return (
    <div className="broadsheet-masthead">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <span className="broadsheet-count">
          {aiLoading ? '—' : resultCount} stays
        </span>

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
      </div>

      {/* Search Bar with integrated Filter Stamp */}
      <div className="field-search">
        <div className="field-search__compass">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M14 3 L16.5 13 L11.5 13 Z" fill="oklch(0.55 0.14 38)" />
            <path d="M14 25 L16.5 15 L11.5 15 Z" fill="oklch(0.55 0.14 38)" opacity="0.3" />
            <circle cx="14" cy="14" r="2.2" fill="oklch(0.22 0.01 60)" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search the collection..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="field-search__clear"
            aria-label="Clear search"
          >
            <X width={14} height={14} />
          </button>
        )}
        {aiLoading && (
          <span className="field-search__ai-hint">searching...</span>
        )}
        <button
          className={`filter-stamp${isSidebarOpen ? ' filter-stamp--active' : ''}`}
          onClick={onToggleSidebar}
          aria-expanded={isSidebarOpen}
          aria-controls="filter-sidebar"
          aria-label={`${isSidebarOpen ? 'Close' : 'Open'} filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <span className="filter-stamp__icon">
            <SlidersHorizontal width={13} height={13} />
          </span>
          <span className="filter-stamp__label">Filter</span>
          {activeFilterCount > 0 && (
            <span className="filter-stamp__count">{activeFilterCount}</span>
          )}
          {isSidebarOpen && activeFilterCount > 0 && (
            <span
              className="filter-stamp__clear"
              onClick={(e) => { e.stopPropagation(); onClearFilters() }}
              aria-label="Clear all filters"
            >
              ✕
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
