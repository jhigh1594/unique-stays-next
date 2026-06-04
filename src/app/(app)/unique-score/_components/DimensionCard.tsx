'use client'

import { CheckCircle2, MoveRight } from 'lucide-react'
import type { DimensionScore } from '@/lib/unique-score/types'

interface DimensionCardProps {
  dimension: DimensionScore
}

export default function DimensionCard({ dimension }: DimensionCardProps) {
  const scoreTone =
    dimension.score >= 75 ? 'text-forest'
    : dimension.score >= 55 ? 'text-terracotta'
    : 'text-[oklch(0.42_0.11_32)]'

  const meterTone =
    dimension.score >= 75 ? 'bg-forest'
    : dimension.score >= 55 ? 'bg-terracotta'
    : 'bg-[oklch(0.42_0.11_32)]'

  const scoreLabel =
    dimension.score >= 90 ? 'Rare air'
    : dimension.score >= 75 ? 'Booking strength'
    : dimension.score >= 60 ? 'Worth sharpening'
    : dimension.score >= 40 ? 'Story gap'
    : dimension.score >= 20 ? 'Needs a rewrite'
    : 'Start over'

  return (
    <article className="rounded-[3px] border border-sand bg-warm-white p-5 shadow-[0_1px_0_oklch(0.22_0.01_60_/_0.04)]">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <span className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
            {Math.round(dimension.weight * 100)} percent of score
          </span>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight text-charcoal">
            {dimension.name}
          </h3>
        </div>

        <div className="flex items-baseline gap-3 sm:justify-end">
          <span className="font-body text-sm font-semibold text-muted-foreground">{scoreLabel}</span>
          <span className={`font-display text-4xl font-semibold tabular-nums ${scoreTone}`}>
            {dimension.score}
          </span>
        </div>
      </div>

      <div
        className="mt-5 h-2 w-full overflow-hidden rounded-full bg-cream-dark"
        role="meter"
        aria-label={`${dimension.name} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={dimension.score}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${meterTone}`}
          style={{ width: `${dimension.score}%` }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {dimension.observations.map((obs, i) => (
          <div key={i} className="grid grid-cols-[1.25rem_1fr] gap-3 font-body text-sm leading-6 text-charcoal">
            <CheckCircle2 className="mt-1 h-4 w-4 text-forest" aria-hidden="true" />
            <span>{obs}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 rounded-[2px] border border-terracotta/25 bg-terracotta/5 p-4 sm:grid-cols-[1.25rem_1fr]">
        <MoveRight className="mt-1 h-4 w-4 text-terracotta" aria-hidden="true" />
        <p className="font-body text-sm leading-6 text-charcoal">
          <span className="font-extrabold text-terracotta">Editorial recommendation:</span>{' '}
          {dimension.suggestion}
        </p>
      </div>
    </article>
  )
}
