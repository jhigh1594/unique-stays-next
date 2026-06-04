'use client'

import { useState } from 'react'
import { ArrowLeft, BadgeCheck, ClipboardList } from 'lucide-react'
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

  const scoreTone =
    result.overallScore >= 75 ? 'text-forest'
    : result.overallScore >= 55 ? 'text-terracotta'
    : 'text-[oklch(0.42_0.11_32)]'

  const scoreLabel =
    result.overallScore >= 85 ? 'Exceptional listing signal'
    : result.overallScore >= 70 ? 'Strong listing signal'
    : result.overallScore >= 55 ? 'Promising, with clear gaps'
    : 'Needs a stronger story'

  const host = (() => {
    try {
      return url ? new URL(url).hostname.replace(/^www\./, '') : platformLabel
    } catch {
      return platformLabel
    }
  })()

  return (
    <section className="grain-overlay px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={onReset}
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-[3px] px-2 py-2 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Inspect another listing
        </button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-[2px] border border-terracotta/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Listing Field Report
            </div>

            <h1 className="font-display text-4xl font-semibold leading-tight text-charcoal sm:text-5xl">
              {result.listingTitle || 'Your Unique Score'}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 font-body text-sm text-muted-foreground">
              <span className="rounded-[2px] border border-sand bg-warm-white px-3 py-1.5 font-semibold text-charcoal">
                {platformLabel} listing
              </span>
              <span>{host}</span>
              {result.cached && <span>Opened from a saved report</span>}
            </div>
          </div>

          <aside className="rounded-[3px] border border-sand bg-warm-white p-6 shadow-[8px_16px_46px_oklch(0.22_0.01_60_/_0.10)]">
            <p className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
              Overall read
            </p>
            <div className="mt-3 flex items-end gap-3">
              <span className={`font-display text-7xl font-semibold leading-none tabular-nums ${scoreTone}`}>
                {result.overallScore}
              </span>
              <span className="pb-2 font-body text-sm font-bold text-muted-foreground">/100</span>
            </div>
            <p className="mt-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-charcoal">
              {scoreLabel}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-cream-dark" aria-hidden="true">
              <div className="h-full rounded-full bg-terracotta" style={{ width: `${result.overallScore}%` }} />
            </div>
          </aside>
        </div>

        {result.summary && (
          <div className="mt-8 rounded-[3px] border border-sand bg-warm-white p-5">
            <div className="mb-3 flex items-center gap-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Editor&apos;s summary
            </div>
            <p className="max-w-3xl font-body text-base leading-7 text-charcoal">
              {result.summary}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-5">
          {freeDimensions.map((dim) => (
            <DimensionCard key={dim.key} dimension={dim} />
          ))}
        </div>

        {!emailSubmitted && (
          <div className="mt-6">
            <EmailCapture
              scoreId={result.scoreId}
              onSubmitted={() => setEmailSubmitted(true)}
            />
          </div>
        )}

        {lockedDimensions.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
                  Full brief preview
                </p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-charcoal">
                  Three deeper reads are held back.
                </h2>
              </div>
              <p className="max-w-sm font-body text-sm leading-6 text-muted-foreground">
                The free report gives enough to act today. The remaining sections are structured for a fuller host optimization brief.
              </p>
            </div>
            <div className="grid gap-4">
              {lockedDimensions.map((dim) => (
                <LockedDimensionCard key={dim.key} dimension={dim} />
              ))}
            </div>
          </div>
        )}

        <ShareButton scoreId={result.scoreId} />

        <p className="mt-8 text-center font-body text-xs leading-5 text-muted-foreground">
          Powered by Unique Stays USA, the directory of extraordinary places to stay.
        </p>
      </div>
    </section>
  )
}
