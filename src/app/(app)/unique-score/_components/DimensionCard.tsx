'use client'

import type { DimensionScore } from '@/lib/unique-score/types'

interface DimensionCardProps {
  dimension: DimensionScore
}

export default function DimensionCard({ dimension }: DimensionCardProps) {
  const scoreColor =
    dimension.score >= 75 ? 'bg-green-500'
    : dimension.score >= 50 ? 'bg-amber-500'
    : 'bg-red-500'

  const scoreLabel =
    dimension.score >= 90 ? 'Extraordinary'
    : dimension.score >= 75 ? 'Strong'
    : dimension.score >= 60 ? 'Adequate'
    : dimension.score >= 40 ? 'Below Average'
    : dimension.score >= 20 ? 'Weak'
    : 'Needs Work'

  return (
    <div className="p-5 bg-white border border-[var(--color-border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--color-text)] text-lg">
            {dimension.name}
          </h3>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {Math.round(dimension.weight * 100)}% weight
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-tertiary)]">{scoreLabel}</span>
          <span className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
            {dimension.score}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 bg-[var(--color-bg-secondary)] rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreColor}`}
          style={{ width: `${dimension.score}%` }}
        />
      </div>

      {/* Observations */}
      <div className="space-y-2 mb-4">
        {dimension.observations.map((obs, i) => (
          <div key={i} className="flex gap-2 text-sm">
            <span className="text-[var(--color-text-tertiary)] mt-0.5 shrink-0">
              {dimension.score >= 60 ? '✓' : '→'}
            </span>
            <span className="text-[var(--color-text-secondary)]">{obs}</span>
          </div>
        ))}
      </div>

      {/* Suggestion */}
      <div className="p-3 bg-[var(--color-accent-subtle, #fef3c7)] rounded-lg border border-[var(--color-accent-light, #fde68a)]">
        <p className="text-sm text-[var(--color-text)]">
          <span className="font-medium">💡 Suggestion:</span> {dimension.suggestion}
        </p>
      </div>
    </div>
  )
}
