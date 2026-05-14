'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { LocationFacet } from '@/lib/filter-utils'

interface LocationComboboxProps {
  facets: LocationFacet[]
  activeLocation: string | null
  onLocationChange: (location: string | null) => void
}

export default function LocationCombobox({
  facets,
  activeLocation,
  onLocationChange,
}: LocationComboboxProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  const filtered = query.trim()
    ? facets.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : facets

  useEffect(() => {
    setHighlightIndex(-1)
  }, [query])

  const handleSelect = useCallback(
    (facet: LocationFacet) => {
      onLocationChange(facet.slug)
      setQuery(facet.name)
      setIsOpen(false)
      inputRef.current?.blur()
    },
    [onLocationChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true)
      return
    }
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          handleSelect(filtered[highlightIndex]!)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightIndex >= 0 && optionRefs.current[highlightIndex]) {
      optionRefs.current[highlightIndex]!.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear query when location is cleared externally
  useEffect(() => {
    if (!activeLocation) setQuery('')
  }, [activeLocation])

  return (
    <div className="location-combobox" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <input
        ref={inputRef}
        type="text"
        className="location-combobox__input"
        placeholder="Search states & cities..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-activedescendant={highlightIndex >= 0 ? `loc-option-${highlightIndex}` : undefined}
      />

      {activeLocation && (
        <button
          onClick={() => {
            onLocationChange(null)
            setQuery('')
            inputRef.current?.focus()
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.7rem',
            color: 'oklch(0.55 0.14 38)',
            padding: '0.2rem',
          }}
          aria-label="Clear location"
        >
          ✕
        </button>
      )}

      {isOpen && filtered.length > 0 && (
        <div className="location-combobox__dropdown" ref={dropdownRef} role="listbox">
          {filtered.map((facet, i) => (
            <div
              key={`${facet.slug}-${facet.state ?? ''}`}
              id={`loc-option-${i}`}
              ref={(el) => { optionRefs.current[i] = el }}
              role="option"
              aria-selected={activeLocation === facet.slug}
              className={[
                'location-combobox__option',
                i === highlightIndex ? ' location-combobox__option--highlighted' : '',
                activeLocation === facet.slug ? ' location-combobox__option--active' : '',
              ].join('')}
              onClick={() => handleSelect(facet)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span>
                {facet.name}
                {facet.state ? (
                  <span style={{ color: 'oklch(0.55 0.03 60)', fontSize: '0.7rem', marginLeft: '0.3rem' }}>
                    {facet.state}
                  </span>
                ) : null}
              </span>
              <span className="location-combobox__count">{facet.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
