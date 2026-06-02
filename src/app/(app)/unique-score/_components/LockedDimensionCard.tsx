'use client'

import { LockKeyhole } from 'lucide-react'
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
    <article className="rounded-[3px] border border-sand bg-cream p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <span className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
            {Math.round(dimension.weight * 100)} percent of score
          </span>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight text-charcoal">
            {dimension.name}
          </h3>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-[2px] border border-sand bg-warm-white px-3 py-1.5 font-body text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          Full brief
        </span>
      </div>

      <p className="mt-3 font-body text-sm leading-6 text-muted-foreground">
        {DIMENSION_DESCRIPTIONS[dimension.key] || 'Unlock to see your score and recommendations.'}
      </p>

      <div className="mt-5 h-2 rounded-full bg-sand" aria-hidden="true" />
    </article>
  )
}
