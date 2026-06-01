'use client'

import type { DimensionScore } from '@/lib/unique-score/types'

interface LockedDimensionCardProps {
  dimension: DimensionScore
}

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  writtenStory: 'Does your copy create a scene or read like a spec sheet?',
  guestConfidence: 'Can guests trust what they\'re getting? Reviews, amenities, completeness.',
  experienceDepth: 'Is there a reason to travel here beyond the bed?',
}

export default function LockedDimensionCard({ dimension }: LockedDimensionCardProps) {
  return (
    <div className="p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl relative overflow-hidden">
      {/* Blurred content hint */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-[var(--color-text)] text-lg">
            {dimension.name}
          </h3>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {Math.round(dimension.weight * 100)}% weight
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔒</span>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-tertiary)] mb-3">
        {DIMENSION_DESCRIPTIONS[dimension.key] || 'Unlock to see your score and recommendations.'}
      </p>

      <div className="w-full h-2 bg-[var(--color-border)] rounded-full" />

      {/* CTA */}
      <div className="mt-4 text-center">
        <span className="text-sm font-medium text-[var(--color-accent)]">
          Coming soon — Full report unlock
        </span>
      </div>
    </div>
  )
}
