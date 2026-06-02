'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ClipboardCheck } from 'lucide-react'
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
  const skipSharedLoadIdRef = useRef<string | null>(null)
  const loadedSharedIdRef = useRef<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your listing...')

  // Load shared result on mount
  useEffect(() => {
    const sharedId = searchParams.get('r')

    if (!sharedId) return
    if (skipSharedLoadIdRef.current === sharedId) return
    if (loadedSharedIdRef.current === sharedId) return

    loadedSharedIdRef.current = sharedId
    setPhase('loading')
    setLoadingMessage('Opening the saved field report...')

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
        setError('We could not open that saved report. Check the link and try again.')
        setPhase('error')
      })
  }, [searchParams])

  const handleSubmit = useCallback(async (submitUrl: string, email?: string) => {
    setUrl(submitUrl)
    setPhase('loading')
    setError(null)
    setLoadingMessage('Reading the listing like a guest would...')

    try {
      const res = await fetch('/api/unique-score/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submitUrl, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'We could not inspect that listing. Check the URL and try again.')
        setPhase('error')
        return
      }

      skipSharedLoadIdRef.current = String(data.scoreId)
      setResult(data)
      setPhase('results')

      window.history.replaceState(null, '', `/unique-score?r=${data.scoreId}`)
    } catch {
      setError('We could not reach the listing inspector. Check your connection and try again.')
      setPhase('error')
    }
  }, [])

  const handleReset = useCallback(() => {
    skipSharedLoadIdRef.current = null
    loadedSharedIdRef.current = null
    setPhase('idle')
    setResult(null)
    setError(null)
    setUrl('')
    window.history.replaceState(null, '', '/unique-score')
  }, [])

  return (
    <main className="bg-cream text-charcoal">
      {phase === 'idle' && <ScoreHero onSubmit={handleSubmit} />}

      {phase === 'loading' && (
        <div
          className="grain-overlay flex min-h-[76vh] flex-col items-center justify-center px-4 py-20 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="mb-7 rounded-[3px] border border-sand bg-warm-white p-5 shadow-[4px_8px_30px_oklch(0.22_0.01_60_/_0.10)]">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2px] bg-cream-dark">
              <ClipboardCheck className="h-11 w-11 animate-pulse text-terracotta" aria-hidden="true" />
            </div>
          </div>
          <p className="font-display text-2xl font-semibold text-charcoal">{loadingMessage}</p>
          <p className="mt-3 max-w-md font-body text-sm leading-6 text-muted-foreground">
            This usually takes about 30 seconds. We are checking the first impression, the photo sequence, the written story, and the trust signals.
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
        <div className="grain-overlay flex min-h-[76vh] flex-col items-center justify-center px-4 py-20 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <AlertCircle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mb-3 font-display text-3xl font-semibold text-charcoal">The inspector could not finish</h2>
          <p className="mb-7 max-w-md font-body text-sm leading-6 text-muted-foreground">{error}</p>
          <button
            onClick={handleReset}
            className="min-h-11 rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-bold text-warm-white transition-colors hover:bg-terracotta-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
          >
            Inspect another listing
          </button>
        </div>
      )}
    </main>
  )
}
