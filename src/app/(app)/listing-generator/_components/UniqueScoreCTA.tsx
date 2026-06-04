'use client'

import { ArrowRight, BarChart3 } from 'lucide-react'

export default function UniqueScoreCTA() {
  return (
    <div className="mt-10 rounded-[3px] border border-forest/25 bg-forest/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[2px] bg-forest text-warm-white">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-charcoal">
            Grade your listing
          </h3>
          <p className="mt-1 font-body text-sm leading-6 text-muted-foreground">
            Now that you have a great description, see how your full listing scores across visual story, written story, and guest confidence.
          </p>
          <a
            href="/unique-score"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[3px] bg-forest px-5 py-3 font-body text-xs font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-forest-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            Get Your Unique Score
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}
