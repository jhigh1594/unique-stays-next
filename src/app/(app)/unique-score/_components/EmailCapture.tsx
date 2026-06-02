'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

interface EmailCaptureProps {
  scoreId: number
  onSubmitted: () => void
}

export default function EmailCapture({ scoreId, onSubmitted }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      onSubmitted()
      return
    }

    setLoading(true)

    try {
      await fetch('/api/unique-score/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), scoreId }),
      })
      onSubmitted()
    } catch {
      setError('We could not save the email. The report is still visible below.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-[3px] border border-forest/25 bg-forest/5 p-5" aria-labelledby="email-capture-title">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[2px] bg-forest text-warm-white">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </div>
          <h3 id="email-capture-title" className="font-display text-2xl font-semibold text-charcoal">
            Keep the field report.
          </h3>
          <p className="mt-2 font-body text-sm leading-6 text-muted-foreground">
            Send yourself the share link and future listing notes. No booking spam.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]" noValidate>
          <div>
            <label htmlFor="score-email" className="sr-only">
              Email address
            </label>
            <input
              id="score-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder="you@example.com"
              aria-describedby={error ? 'score-email-error' : undefined}
              className="min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal transition-colors placeholder:text-muted-foreground focus-visible:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            />
            {error && (
              <p id="score-email-error" className="mt-2 font-body text-xs font-semibold text-terracotta" role="alert">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-11 rounded-[3px] bg-forest px-5 py-3 font-body text-xs font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-forest-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? 'Saving' : 'Send Report'}
          </button>
          <button
            type="button"
            onClick={onSubmitted}
            className="min-h-11 rounded-[3px] px-3 py-3 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            Not now
          </button>
        </form>
      </div>
    </section>
  )
}
