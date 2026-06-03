'use client'

import { useState, useCallback } from 'react'
import GeneratorHero from './_components/GeneratorHero'
import LoadingState from './_components/LoadingState'
import ResultsPreview from './_components/ResultsPreview'
import FullResults from './_components/FullResults'
import type { GenerationResponse } from '@/lib/listing-generator/types'

type Phase = 'idle' | 'loading' | 'preview' | 'results' | 'error'

export default function ListingGeneratorClient() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<GenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('')

  const handleUrlSubmit = useCallback(async (url: string) => {
    setPhase('loading')
    setError(null)
    setLoadingMessage('Reading your listing...')

    try {
      const res = await fetch('/api/listing-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data: GenerationResponse & { error?: string } = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'We could not read that listing. Try the manual form instead.')
        setPhase('error')
        return
      }

      setResult(data)
      setPhase('preview')
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
      setPhase('error')
    }
  }, [])

  const handleManualSubmit = useCallback(async (formData: Record<string, unknown>) => {
    setPhase('loading')
    setError(null)
    setLoadingMessage('Your editor is crafting the perfect listing...')

    try {
      const res = await fetch('/api/listing-generator/generate-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data: GenerationResponse & { error?: string } = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Generation failed. Please try again.')
        setPhase('error')
        return
      }

      setResult(data)
      setPhase('preview')
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
      setPhase('error')
    }
  }, [])

  const handleEmailComplete = useCallback(() => {
    setPhase('results')
  }, [])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setResult(null)
    setError(null)
  }, [])

  return (
    <main className="bg-cream text-charcoal">
      {phase === 'idle' && (
        <GeneratorHero onUrlSubmit={handleUrlSubmit} onManualSubmit={handleManualSubmit} />
      )}
      {phase === 'loading' && <LoadingState message={loadingMessage} />}
      {phase === 'preview' && result && (
        <ResultsPreview result={result} onEmailComplete={handleEmailComplete} />
      )}
      {phase === 'results' && result && (
        <FullResults result={result} onReset={handleReset} />
      )}
      {phase === 'error' && <ErrorState error={error} onReset={handleReset} />}
    </main>
  )
}

function ErrorState({ error, onReset }: { error: string | null; onReset: () => void }) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10">
          <svg className="h-6 w-6 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-charcoal">
          Something went wrong
        </h2>
        <p className="mt-3 font-body text-base text-muted-foreground">
          {error || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={onReset}
          className="mt-6 min-h-11 rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light"
        >
          Try Again
        </button>
      </div>
    </section>
  )
}
