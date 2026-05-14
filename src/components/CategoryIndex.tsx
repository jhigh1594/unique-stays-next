'use client'

import { CATEGORIES_CONFIG } from '@/lib/categories-config'

interface CategoryIndexProps {
  activeCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export default function CategoryIndex({ activeCategory, onCategoryChange }: CategoryIndexProps) {
  return (
    <div className="category-index" role="tablist" aria-label="Category filter">
      <button
        className={`category-index__item${!activeCategory ? ' category-index__item--active' : ''}`}
        onClick={() => onCategoryChange(null)}
        role="tab"
        aria-selected={!activeCategory}
      >
        All
      </button>
      {CATEGORIES_CONFIG.map((cat, i) => (
        <span key={cat.id} style={{ display: 'contents' }}>
          <span className="category-index__sep" aria-hidden="true">·</span>
          <button
            className={`category-index__item${activeCategory === cat.id ? ' category-index__item--active' : ''}`}
            onClick={() => onCategoryChange(activeCategory === cat.id ? null : cat.id)}
            role="tab"
            aria-selected={activeCategory === cat.id}
          >
            {cat.label}
          </button>
        </span>
      ))}
    </div>
  )
}
