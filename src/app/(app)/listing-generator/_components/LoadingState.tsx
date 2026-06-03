'use client'

import { useState, useEffect } from 'react'

interface LoadingStateProps {
  message: string
}

const STAGES = [
  'Reading your listing...',
  'Analyzing stay type...',
  'Crafting the hook...',
  'Writing the description...',
  'Polishing editorial notes...',
]

export default function LoadingState({ message: _message }: LoadingStateProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-sand border-t-terracotta" />
        <p className="font-display text-2xl font-semibold text-charcoal">
          {STAGES[stage]}
        </p>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          This takes about 15 seconds.
        </p>
      </div>
    </section>
  )
}
