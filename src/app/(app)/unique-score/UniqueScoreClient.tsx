'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import ScoreHero from './_components/ScoreHero'
import ScoreResults from './_components/ScoreResults'
import type { DimensionScore } from '@/lib/unique-score/types'

interface AnalysisResponse {
  scoreId: number
  overallScore: number
  dimensions: DimensionScore[]
  summary: string
  platform: string
  listingTitle: string | null
  cached: boolean
}

type Phase = 'idle' | 'loading' | 'results' | 'error'

export default function UniqueScoreClient() {
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('idle')
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your listing...')

  // Load shared result on mount
  useEffect(() => {
    const sharedId = searchParams.get('r')
    if (sharedId) {
      setPhase('loading')
      setLoadingMessage('Loading shared results...')
      fetch(`/api/unique-score/analyze?id=${sharedId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
            setPhase('error')
          } else {
            setResult(data)
            setPhase('results')
          }
        })
        .catch(() => {
          setError('Failed to load shared results.')
          setPhase('error')
        })
    }
  }, [searchParams])

  const handleSubmit = useCallback(async (submitUrl: string, email?: string) => {
    setUrl(submitUrl)
    setPhase('loading')
    setError(null)
    setLoadingMessage('Scraping your listing...')

    try {
      const res = await fetch('/api/unique-score/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submitUrl, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Analysis failed.')
        setPhase('error')
        return
      }

      setResult(data)
      setPhase('results')

      // Update URL with share param
      window.history.replaceState(null, '', `/unique-score?r=${data.scoreId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setPhase('error')
    }
  }, [])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setResult(null)
    setError(null)
    setUrl('')
    window.history.replaceState(null, '', '/unique-score')
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {phase === 'idle' && <ScoreHero onSubmit={handleSubmit} />}

      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-lg text-[var(--color-text-secondary)] font-medium">{loadingMessage}</p>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
            This takes about 30 seconds — we&apos;re analyzing every photo and every word.
          </p>
        </div>
      )}

      {phase === 'results' && result && (
        <ScoreResults
          result={result}
          url={url}
          onReset={handleReset}
        />
      )}

      {phase === 'error' && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Analysis Failed</h2>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">{error}</p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
