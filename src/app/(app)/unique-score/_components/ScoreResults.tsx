'use client'

import { useState } from 'react'
import type { DimensionScore } from '@/lib/unique-score/types'
import { FREE_DIMENSIONS } from '@/lib/unique-score/types'
import DimensionCard from './DimensionCard'
import LockedDimensionCard from './LockedDimensionCard'
import EmailCapture from './EmailCapture'
import ShareButton from './ShareButton'

interface AnalysisResponse {
  scoreId: number
  overallScore: number
  dimensions: DimensionScore[]
  summary: string
  platform: string
  listingTitle: string | null
  cached: boolean
}

interface ScoreResultsProps {
  result: AnalysisResponse
  url: string
  onReset: () => void
}

export default function ScoreResults({ result, url, onReset }: ScoreResultsProps) {
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  const freeDimensions = result.dimensions.filter((d) =>
    FREE_DIMENSIONS.includes(d.key as typeof FREE_DIMENSIONS[number]),
  )
  const lockedDimensions = result.dimensions.filter(
    (d) => !FREE_DIMENSIONS.includes(d.key as typeof FREE_DIMENSIONS[number]),
  )

  const platformLabel =
    result.platform === 'airbnb' ? 'Airbnb'
    : result.platform === 'vrbo' ? 'VRBO'
    : 'Wander'

  const scoreColor =
    result.overallScore >= 75 ? 'text-green-500'
    : result.overallScore >= 50 ? 'text-amber-500'
    : 'text-red-500'

  return (
    <div className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <button
          onClick={onReset}
          className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] mb-6 inline-block transition-colors"
        >
          ← Analyze another listing
        </button>

        <h2
          className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Your Unique Score
        </h2>

        {result.listingTitle && (
          <p className="text-lg text-[var(--color-text-secondary)] mb-1">
            {result.listingTitle}
          </p>
        )}

        <p className="text-sm text-[var(--color-text-tertiary)]">
          {platformLabel} listing {result.cached ? '(cached)' : ''}
        </p>

        {/* Blurred overall score */}
        <div className="mt-6 inline-flex flex-col items-center">
          <div className="relative">
            <div className="text-7xl font-bold blur-lg select-none opacity-60" style={{ fontFamily: 'var(--font-display)' }}>
              {result.overallScore}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                🔒 Unlock full report
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">Overall Score (out of 100)</p>
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="mb-8 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {result.summary}
          </p>
        </div>
      )}

      {/* Free dimension cards */}
      <div className="space-y-4 mb-6">
        {freeDimensions.map((dim) => (
          <DimensionCard key={dim.key} dimension={dim} />
        ))}
      </div>

      {/* Email capture */}
      {!emailSubmitted && (
        <EmailCapture
          scoreId={result.scoreId}
          onSubmitted={() => setEmailSubmitted(true)}
        />
      )}

      {/* Locked dimension cards */}
      <div className="space-y-4 mt-6 mb-8">
        {lockedDimensions.map((dim) => (
          <LockedDimensionCard key={dim.key} dimension={dim} />
        ))}
      </div>

      {/* Share */}
      <ShareButton scoreId={result.scoreId} />

      {/* Powered by */}
      <div className="text-center mt-12 text-xs text-[var(--color-text-tertiary)]">
        Powered by Unique Stays USA — the directory of extraordinary places to stay
      </div>
    </div>
  )
}
