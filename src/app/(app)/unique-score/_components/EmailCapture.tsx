'use client'

import { useState } from 'react'

interface EmailCaptureProps {
  scoreId: number
  onSubmitted: () => void
}

export default function EmailCapture({ scoreId, onSubmitted }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    } catch {
      // never block on email failure
    }

    onSubmitted()
  }

  return (
    <div className="p-5 bg-white border border-[var(--color-border)] rounded-xl">
      <p className="text-sm text-[var(--color-text-secondary)] mb-3">
        Want your scores saved? Drop your email — we&apos;ll only contact you about your listing.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com (optional)"
          className="flex-1 px-4 py-2.5 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-accent)] focus:outline-none transition-colors"
        />
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
    </div>
  )
}
