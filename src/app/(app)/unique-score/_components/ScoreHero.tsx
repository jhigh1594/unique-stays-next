'use client'

import { useState } from 'react'
import { Camera, ClipboardCheck, Compass, FileText, ShieldCheck } from 'lucide-react'
import { validateListingUrl } from '@/lib/unique-score/types'

interface ScoreHeroProps {
  onSubmit: (url: string) => void
}

const PLATFORMS = [
  { name: 'Airbnb', domain: 'airbnb.com' },
  { name: 'VRBO', domain: 'vrbo.com' },
  { name: 'Wander', domain: 'wander.com' },
]

const INSPECTION_POINTS = [
  {
    icon: Camera,
    label: 'Visual Story',
    detail: 'Photo order, first impression, and desire.',
  },
  {
    icon: FileText,
    label: 'Written Story',
    detail: 'Opening copy, specificity, and sense of place.',
  },
  {
    icon: ShieldCheck,
    label: 'Guest Confidence',
    detail: 'Review signals, amenities, and missing answers.',
  },
]

export default function ScoreHero({ onSubmit }: ScoreHeroProps) {
  const [url, setUrl] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) {
      setLocalError('Please enter a listing URL.')
      return
    }

    // Add https:// if missing
    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const validation = validateListingUrl(fullUrl)

    if (!validation.valid) {
      setLocalError(validation.error || 'Invalid URL')
      return
    }

    setLocalError(null)
    onSubmit(fullUrl)
  }

  return (
    <section className="grain-overlay relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-[2px] border border-terracotta/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Host Field Report
          </div>

          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] text-charcoal sm:text-6xl lg:text-7xl">
            See your listing like a guest with taste.
          </h1>

          <p className="mt-6 max-w-2xl font-body text-base leading-7 text-muted-foreground sm:text-lg">
            Paste a public Airbnb, VRBO, or Wander URL. Unique Score reads the listing as an editorial inspection: first impression, story, trust, and the reason someone would remember the stay.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 max-w-2xl"
            noValidate
            aria-describedby="unique-score-help unique-score-platforms"
          >
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
                onChange={(e) => {
                  setUrl(e.target.value)
                  setLocalError(null)
                }}
                placeholder="https://www.airbnb.com/rooms/..."
                aria-invalid={Boolean(localError)}
                aria-describedby={localError ? 'listing-url-error unique-score-help' : 'unique-score-help'}
                className="min-h-12 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-base text-charcoal shadow-[0_1px_0_oklch(0.22_0.01_60_/_0.04)] transition-colors placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                autoFocus
              />
              <button
                type="submit"
                className="min-h-12 rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
              >
                Inspect Listing
              </button>
            </div>

            <p id="unique-score-help" className="mt-3 font-body text-sm leading-6 text-muted-foreground">
              No login required. The free report shows the first two dimensions and a shareable link.
            </p>

            {localError && (
              <p id="listing-url-error" className="mt-3 font-body text-sm font-semibold text-terracotta" role="alert">
                {localError}
              </p>
            )}
          </form>

          <div id="unique-score-platforms" className="mt-7 flex flex-wrap items-center gap-3 font-body text-sm text-muted-foreground">
            <span className="font-bold text-charcoal">Supported sources</span>
            {PLATFORMS.map((p) => (
              <span key={p.name} className="rounded-[2px] border border-sand bg-warm-white px-3 py-1.5 font-semibold text-charcoal">
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <aside
          className="relative rounded-[3px] border border-sand bg-warm-white p-6 shadow-[10px_18px_50px_oklch(0.22_0.01_60_/_0.10)] lg:rotate-[-1deg]"
          aria-label="What the field report inspects"
        >
          <div className="absolute -right-4 -top-4 hidden h-20 w-20 rotate-6 rounded-full border border-terracotta/45 bg-cream text-center font-body text-[0.62rem] font-black uppercase leading-tight tracking-[0.16em] text-terracotta sm:flex sm:items-center sm:justify-center">
            Taste
            <br />
            Check
          </div>

          <div className="mb-6 border-b border-sand pb-5">
            <p className="font-body text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-terracotta">
              Inspection Docket
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-charcoal">
              Five signals, one clear read.
            </h2>
          </div>

          <div className="space-y-5">
            {INSPECTION_POINTS.map((item, index) => {
              const Icon = item.icon

              return (
                <div key={item.label} className="grid grid-cols-[2.25rem_1fr] gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-cream-dark text-terracotta">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="border-b border-sand/80 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-body text-sm font-extrabold uppercase tracking-[0.08em] text-charcoal">
                        {item.label}
                      </h3>
                      <span className="font-display text-xl text-terracotta">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="mt-1 font-body text-sm leading-6 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-[2px] bg-forest px-4 py-3 font-body text-sm font-semibold leading-6 text-warm-white">
            Built for owners who want better bookings, not generic listing advice.
          </div>
        </aside>
      </div>
    </section>
  )
}
