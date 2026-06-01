'use client'

import { useState } from 'react'

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
    if (!email.trim()) {
      onSubmitted()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/unique-score/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: '', email: email.trim(), scoreId }),
      })

      // We don't need the result — just fire and forget the email
      onSubmitted()
    } catch {
      // Don't block on email failure
      onSubmitted()
    }
  }

  return (
    <div className="p-5 bg-white border border-[var(--color-border)] rounded-xl">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com (optional)"
            className="w-full px-4 py-2.5 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-accent)] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 text-sm font-medium bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Saving...' : 'Send me my scores'}
        </button>
        <button
          type="button"
          onClick={onSubmitted}
          className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors whitespace-nowrap self-center"
        >
          Skip
        </button>
      </form>
      <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
        We&apos;ll only email you about your listing score. No spam.
      </p>
    </div>
  )
}
