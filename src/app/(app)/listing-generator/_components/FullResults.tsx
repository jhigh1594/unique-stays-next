'use client'

import { useState } from 'react'
import { ArrowLeft, Check, ClipboardList, Copy } from 'lucide-react'
import EditorialNote from './EditorialNote'
import UniqueScoreCTA from './UniqueScoreCTA'
import type { GenerationResponse } from '@/lib/listing-generator/types'

interface FullResultsProps {
  result: GenerationResponse
  onReset: () => void
}

export default function FullResults({ result, onReset }: FullResultsProps) {
  const [copied, setCopied] = useState<'title' | 'description' | 'all' | null>(null)

  const copyToClipboard = async (text: string, type: 'title' | 'description' | 'all') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const allText = `${result.result.title}\n\n${result.result.description}`

  return (
    <section className="grain-overlay px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={onReset}
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-[3px] px-2 py-2 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Generate another
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-[2px] border border-terracotta/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Your Generated Listing
        </div>

        <div className="rounded-[3px] border border-sand bg-warm-white p-6 shadow-[0_1px_0_oklch(0.22_0.01_60_/_0.04)]">
          <p className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Title</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
            {result.result.title}
          </h2>
          <button
            onClick={() => copyToClipboard(result.result.title, 'title')}
            className="mt-3 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-terracotta transition-colors hover:text-terracotta-light"
            aria-label="Copy title"
          >
            {copied === 'title' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === 'title' ? 'Copied' : 'Copy title'}
          </button>
        </div>

        <div className="mt-5 rounded-[3px] border border-sand bg-warm-white p-6">
          <p className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Description</p>
          <div className="mt-3 font-body text-base leading-7 text-charcoal whitespace-pre-wrap">
            {result.result.description}
          </div>
          <button
            onClick={() => copyToClipboard(result.result.description, 'description')}
            className="mt-4 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-terracotta transition-colors hover:text-terracotta-light"
            aria-label="Copy description"
          >
            {copied === 'description' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === 'description' ? 'Copied' : 'Copy description'}
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => copyToClipboard(allText, 'all')}
            className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-terracotta bg-warm-white px-5 py-3 font-body text-xs font-extrabold uppercase tracking-[0.08em] text-terracotta transition-colors hover:bg-terracotta hover:text-warm-white"
          >
            {copied === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === 'all' ? 'All Copied' : 'Copy All'}
          </button>
        </div>

        <div className="mt-10">
          <p className="font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
            Editor&apos;s notes
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-charcoal">
            Why this description works
          </h3>
          <div className="mt-5 space-y-4">
            {result.result.editorialNotes.map((note, i) => (
              <EditorialNote key={i} note={note} />
            ))}
          </div>
        </div>

        {result.result.stayTypeAffinity && (
          <div className="mt-8 rounded-[2px] border border-forest/25 bg-forest/5 p-4">
            <p className="font-body text-sm text-charcoal">
              <span className="font-extrabold text-forest">Stay insight: </span>
              {result.result.stayTypeAffinity}
            </p>
          </div>
        )}

        <UniqueScoreCTA />
      </div>
    </section>
  )
}
