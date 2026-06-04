'use client'

import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'

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
        // User cancelled or not supported. Fall through to clipboard.
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-8 flex justify-center">
      <button
        onClick={handleShare}
        className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-terracotta bg-warm-white px-5 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-terracotta transition-colors hover:bg-terracotta hover:text-warm-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
        aria-live="polite"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Link Copied
          </>
        ) : (
          <>
            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <Share2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            Share Report
          </>
        )}
      </button>
    </div>
  )
}
