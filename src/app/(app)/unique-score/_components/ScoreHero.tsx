'use client'

import { useState } from 'react'
import { validateListingUrl } from '@/lib/unique-score/types'

interface ScoreHeroProps {
  onSubmit: (url: string) => void
}

const PLATFORMS = [
  { name: 'Airbnb', domain: 'airbnb.com' },
  { name: 'VRBO', domain: 'vrbo.com' },
  { name: 'Wander', domain: 'wander.com' },
]

export default function ScoreHero({ onSubmit }: ScoreHeroProps) {
  const [url, setUrl] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) {
      setLocalError('Please enter a listing URL.')
      return
    }

    // Add https:// if missing
    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const validation = validateListingUrl(fullUrl)

    if (!validation.valid) {
      setLocalError(validation.error || 'Invalid URL')
      return
    }

    setLocalError(null)
    onSubmit(fullUrl)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Branding */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-accent-subtle)] rounded-full text-sm font-medium text-[var(--color-accent)] mb-6">
          ✨ Free AI-Powered Analysis
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-[var(--color-text)] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          What&apos;s Your<br />
          <span className="text-[var(--color-accent)]">Unique Score</span>?
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">
          Paste your listing URL and get an instant quality score. We analyze your photos, copy, and guest experience — the way a discerning traveler actually sees it.
        </p>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setLocalError(null)
            }}
            placeholder="Paste your Airbnb, VRBO, or Wander listing URL..."
            className="w-full px-6 py-4 text-lg bg-white border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-accent)] focus:outline-none transition-colors text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)]"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Score It
          </button>
        </div>

        {localError && (
          <p className="mt-3 text-sm text-red-500">{localError}</p>
        )}
      </form>

      {/* Platform badges */}
      <div className="flex items-center gap-4 mt-6 text-sm text-[var(--color-text-tertiary)]">
        <span>Supports:</span>
        {PLATFORMS.map((p) => (
          <span key={p.name} className="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-md font-medium">
            {p.name}
          </span>
        ))}
      </div>

      {/* What you get */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-3xl">
        {[
          { emoji: '📸', title: 'Visual Story', desc: 'Do your photos create desire or indifference?' },
          { emoji: '🌟', title: 'Standout Factor', desc: 'Does your listing look different from the rest?' },
          { emoji: '🔒', title: '+ 3 More Dimensions', desc: 'Unlock the full report for all 5 scores' },
        ].map((item) => (
          <div key={item.title} className="p-5 bg-white border border-[var(--color-border)] rounded-xl text-center">
            <div className="text-3xl mb-2">{item.emoji}</div>
            <h3 className="font-semibold text-[var(--color-text)] mb-1">{item.title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
