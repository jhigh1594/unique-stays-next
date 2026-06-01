'use client'

import { useState } from 'react'

interface ShareButtonProps {
  scoreId: number
}

export default function ShareButton({ scoreId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/unique-score?r=${scoreId}`
    : ''

  const handleShare = async () => {
    const url = `${window.location.origin}/unique-score?r=${scoreId}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Unique Score',
          text: 'Check out how my unique stay listing scored!',
          url,
        })
        return
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="text-center mt-6">
      <button
        onClick={handleShare}
        className="px-6 py-3 border-2 border-[var(--color-accent)] text-[var(--color-accent)] rounded-lg font-medium hover:bg-[var(--color-accent)] hover:text-white transition-colors"
      >
        {copied ? '✅ Link copied!' : '🔗 Share My Score'}
      </button>
    </div>
  )
}
