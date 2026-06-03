'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

interface EmailGateProps {
  onComplete: () => void
}

export default function EmailGate({ onComplete }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      onComplete()
      return
    }

    setLoading(true)

    try {
      await fetch('/api/listing-generator/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      onComplete()
    } catch {
      setError('Could not save email. The description is still yours.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-[3px] border border-forest/25 bg-forest/5 p-5" aria-labelledby="email-gate-title">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[2px] bg-forest text-warm-white">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </div>
          <h3 id="email-gate-title" className="font-display text-2xl font-semibold text-charcoal">
            Unlock your description.
          </h3>
          <p className="mt-2 font-body text-sm leading-6 text-muted-foreground">
            Send yourself the full description and editorial notes. No booking spam.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]" noValidate>
          <div>
            <label htmlFor="gate-email" className="sr-only">Email address</label>
            <input
              id="gate-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="you@example.com"
              aria-describedby={error ? 'gate-email-error' : undefined}
              className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal transition-colors placeholder:text-muted-foreground focus-visible:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            />
            {error && (
              <p id="gate-email-error" className="mt-2 font-body text-xs font-semibold text-terracotta" role="alert">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-11 rounded-[3px] bg-forest px-5 py-3 font-body text-xs font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-forest-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? 'Saving' : 'Unlock'}
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-11 rounded-[3px] px-3 py-3 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            Not now
          </button>
        </form>
      </div>
    </section>
  )
}
