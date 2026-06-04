'use client'

import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { validateListingUrl } from '@/lib/listing-generator/types'
import ManualForm from './ManualForm'

interface GeneratorHeroProps {
  onUrlSubmit: (url: string) => void
  onManualSubmit: (formData: Record<string, unknown>) => void
}

const PLATFORMS = [
  { name: 'Airbnb', domain: 'airbnb.com' },
  { name: 'VRBO', domain: 'vrbo.com' },
  { name: 'Wander', domain: 'wander.com' },
]

export default function GeneratorHero({ onUrlSubmit, onManualSubmit }: GeneratorHeroProps) {
  const [url, setUrl] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      setLocalError('Please enter a listing URL.')
      return
    }

    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const validation = validateListingUrl(fullUrl)

    if (!validation.valid) {
      setLocalError(validation.error || 'Invalid URL')
      return
    }

    setLocalError(null)
    onUrlSubmit(fullUrl)
  }

  if (showManual) {
    return <ManualForm onSubmit={onManualSubmit} onBack={() => setShowManual(false)} />
  }

  return (
    <section className="grain-overlay relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-[2px] border border-terracotta/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Listing Description Generator
          </div>

          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] text-charcoal sm:text-6xl lg:text-7xl">
            A description that does your stay justice.
          </h1>

          <p className="mt-6 max-w-2xl font-body text-base leading-7 text-muted-foreground sm:text-lg">
            Paste your Airbnb, VRBO, or Wander URL. Our AI reads your listing like a travel editor and rewrites it for maximum bookings — with notes explaining why each change works.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl" noValidate>
            <label htmlFor="listing-url" className="mb-2 block font-body text-sm font-bold text-charcoal">
              Listing URL
            </label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="listing-url"
                name="listing-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setLocalError(null) }}
                placeholder="https://www.airbnb.com/rooms/..."
                aria-invalid={Boolean(localError)}
                aria-describedby={localError ? 'url-error' : undefined}
                className="min-h-12 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-base text-charcoal shadow-[0_1px_0_oklch(0.22_0.01_60_/_0.04)] transition-colors placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                autoFocus
              />
              <button
                type="submit"
                className="min-h-12 rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
              >
                Generate
              </button>
            </div>

            {localError && (
              <p id="url-error" className="mt-3 font-body text-sm font-semibold text-terracotta" role="alert">
                {localError}
              </p>
            )}
          </form>

          <div className="mt-7 flex flex-wrap items-center gap-3 font-body text-sm text-muted-foreground">
            <span className="font-bold text-charcoal">Supported sources</span>
            {PLATFORMS.map((p) => (
              <span key={p.name} className="rounded-[2px] border border-sand bg-warm-white px-3 py-1.5 font-semibold text-charcoal">
                {p.name}
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowManual(true)}
            className="mt-5 font-body text-sm font-semibold text-terracotta underline decoration-terracotta/40 underline-offset-4 transition-colors hover:text-terracotta-light"
          >
            Or describe your stay manually
          </button>
        </div>

        <aside
          className="relative rounded-[3px] border border-sand bg-warm-white p-6 shadow-[10px_18px_50px_oklch(0.22_0.01_60_/_0.10)] lg:rotate-[-1deg]"
          aria-label="What the generator produces"
        >
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <span className="font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
              What you get
            </span>
          </div>
          <ul className="space-y-3 font-body text-sm text-charcoal">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
              A hook-first title that stops the scroll
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
              A 150–250 word description written for your stay type
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
              3 editorial notes explaining why each change works
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-forest" />
              Free — no login, no credit card
            </li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
