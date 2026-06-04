'use client'

import { Lock } from 'lucide-react'
import EmailGate from './EmailGate'
import type { GenerationResponse } from '@/lib/listing-generator/types'

interface ResultsPreviewProps {
  result: GenerationResponse
  onEmailComplete: () => void
}

export default function ResultsPreview({ result, onEmailComplete }: ResultsPreviewProps) {
  return (
    <section className="grain-overlay px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-[2px] border border-forest/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-forest">
          Generated Description
        </div>

        <h2 className="font-display text-4xl font-semibold text-charcoal sm:text-5xl">
          {result.result.title}
        </h2>

        <div className="relative mt-8">
          <div className="rounded-[3px] border border-sand bg-warm-white p-6">
            <div className="relative">
              <div
                className="font-body text-base leading-7 text-charcoal blur-md select-none"
                aria-hidden="true"
              >
                {result.result.description}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-warm-white/40 backdrop-blur-[2px]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10">
                  <Lock className="h-5 w-5 text-terracotta" aria-hidden="true" />
                </div>
                <p className="font-display text-lg font-semibold text-charcoal">
                  Enter your email to unlock
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">
                  See the full description + editorial notes
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {result.result.editorialNotes.map((note, i) => (
            <div key={i} className="rounded-[3px] border border-sand/50 bg-warm-white/60 p-4">
              <span className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
                {note.category === 'hook' ? 'Hook' : note.category === 'story' ? 'Story' : 'Conversion'}
              </span>
              <div className="mt-2 h-3 w-3/4 rounded bg-sand/60" />
            </div>
          ))}
        </div>

        <div className="mt-8">
          <EmailGate onComplete={onEmailComplete} />
        </div>
      </div>
    </section>
  )
}
