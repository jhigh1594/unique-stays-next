'use client'

import { useState, useCallback, useEffect } from 'react'
import VacationQuiz from '@/components/VacationQuiz'
import QuizResults from '@/components/QuizResults'
import type { QuizAnswers, StayMatch } from '@/lib/matching-engine'

export default function VacationQuizClient() {
  const [results, setResults] = useState<StayMatch[] | null>(null)
  const [resultSlug, setResultSlug] = useState('')
  const [answers, setAnswers] = useState<QuizAnswers | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [developing, setDeveloping] = useState(false)

  const handleComplete = useCallback(async (quizAnswers: QuizAnswers) => {
    setLoading(true)
    setDeveloping(true)
    setError(null)
    setAnswers(quizAnswers)

    try {
      const res = await fetch('/api/vacation-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizAnswers),
      })

      if (!res.ok) {
        throw new Error('Failed to get matches')
      }

      const data = await res.json()
      setResults(data.results)
      setResultSlug(data.resultSlug)

      // Update URL for sharing (no reload)
      const params = new URLSearchParams({
        o: quizAnswers.occasion,
        v: quizAnswers.vibe,
        d: quizAnswers.distance,
        b: quizAnswers.budget,
        m: quizAnswers.mustHave,
        z: quizAnswers.zipCode,
      })
      window.history.replaceState({}, '', `/vacation-quiz?${params.toString()}`)
    } catch (e) {
      console.error('Quiz submission failed:', e)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRetake = useCallback(() => {
    setResults(null)
    setAnswers(null)
    setResultSlug('')
    setError(null)
    setStarted(false)
    setDeveloping(false)
    window.history.replaceState({}, '', '/vacation-quiz')
  }, [])

  // Loading state with polaroid developing animation
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 grain-overlay">
        <div className="text-center">
          {/* Polaroid frames developing */}
          <div className="flex items-end justify-center gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-warm-white rounded-sm overflow-hidden"
                style={{
                  padding: '8px',
                  paddingBottom: '28px',
                  boxShadow: '2px 3px 10px rgba(44, 30, 20, 0.12)',
                  transform: `rotate(${(i - 1) * 3}deg)`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 bg-sand/40 rounded-[1px] ${developing ? 'polaroid-develop' : ''}`}
                  style={{
                    filter: developing ? undefined : 'sepia(0.9) brightness(1.35) blur(6px) saturate(0.3)',
                    transition: `filter 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * 0.4}s`,
                  }}
                  ref={(el) => {
                    if (el && developing) {
                      setTimeout(() => {
                        el.style.filter = 'sepia(0) brightness(1) blur(0px) saturate(1)'
                      }, 100)
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <p className="font-display text-2xl font-semibold text-foreground mb-2">
            Developing your matches...
          </p>
          <p className="font-caveat text-lg text-muted-foreground">
            Scanning hand-picked stays across America
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block relative mb-4">
            <div
              className="bg-warm-white p-6 rounded-sm"
              style={{
                transform: 'rotate(-1deg)',
                boxShadow: '3px 5px 14px rgba(44, 30, 20, 0.16)',
              }}
            >
              <div className="absolute inset-[5px] border border-dashed border-terracotta/15 rounded-[1px] pointer-events-none" />
              <p className="font-display text-xl font-semibold text-foreground mb-1 relative z-10">
                Something went wrong
              </p>
              <p className="font-caveat text-muted-foreground relative z-10">
                {error}
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={handleRetake}
              className="px-6 py-3 rounded-sm border-2 border-terracotta bg-terracotta text-warm-white font-display font-semibold italic hover:bg-terracotta-light transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Results
  if (results && answers) {
    return (
      <QuizResults
        results={results}
        resultSlug={resultSlug}
        answers={answers}
        onRetake={handleRetake}
      />
    )
  }

  // Landing page
  if (!started) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 grain-overlay relative overflow-hidden">
        {/* Faded globe watermark */}
        <div
          className="absolute select-none pointer-events-none"
          style={{
            right: '-5%',
            top: '10%',
            opacity: 0.04,
            color: 'oklch(0.55 0.14 38)',
          }}
        >
          <svg width="300" height="300" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" />
            <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="1" />
            <path d="M4 24 Q13 19 22 24 Q31 29 40 24 Q49 19 58 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M4 32 Q13 27 22 32 Q31 37 40 32 Q49 27 58 32" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M4 40 Q13 35 22 40 Q31 45 40 40 Q49 35 58 40" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        {/* Ghost section number */}
        <span
          className="absolute select-none pointer-events-none font-display leading-none"
          style={{
            fontSize: 'clamp(8rem, 18vw, 15rem)',
            color: 'oklch(0.22 0.01 60)',
            opacity: 0.04,
            bottom: '10%',
            left: '-0.04em',
            fontFamily: 'Fraunces, serif',
            fontWeight: 900,
            zIndex: 0,
          }}
        >
          I
        </span>

        <div className="text-center max-w-2xl mx-auto relative z-10">
          {/* Stamp badge eyebrow */}
          <div className="inline-block mb-6">
            <span
              className="stamp-badge text-terracotta"
              style={{ transform: 'rotate(-2.5deg)', display: 'inline-block' }}
            >
              Quiz
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-semibold text-foreground leading-[1.05] mb-4">
            Where should you wake up next?
          </h1>

          <p className="font-body text-lg text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
            Answer five questions. We'll find the stay that fits the trip you're actually planning
            (or the one you haven't admitted you want yet).
          </p>

          <button
            onClick={() => setStarted(true)}
            className="px-8 py-4 rounded-sm border-2 border-terracotta bg-terracotta text-warm-white font-display font-semibold text-lg italic shadow-lg hover:bg-terracotta-light hover:shadow-xl transition-all"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            Let's Go
          </button>

          <p className="font-caveat text-sm text-muted-foreground mt-5">
            350+ hand-picked stays across America
          </p>
        </div>
      </div>
    )
  }

  return <VacationQuiz onComplete={handleComplete} onBack={handleRetake} />
}
