'use client'

import { useState, useCallback } from 'react'
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
  const [pendingAnswers, setPendingAnswers] = useState<QuizAnswers | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSubmitWithQuiz = useCallback(async (quizAnswers: QuizAnswers, userEmail: string) => {
    setLoading(true)
    setError(null)
    setAnswers(quizAnswers)

    try {
      // Fire quiz scoring and lead save in parallel
      const [quizRes] = await Promise.all([
        fetch('/api/vacation-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizAnswers),
        }),
        fetch('/api/vacation-quiz/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            zipCode: quizAnswers.zipCode,
            occasion: quizAnswers.occasion,
            vibe: quizAnswers.vibe,
            distance: quizAnswers.distance,
            budget: quizAnswers.budget,
            mustHave: quizAnswers.mustHave,
          }),
        }).catch(() => null), // lead failure must not block results
      ])

      if (!quizRes.ok) {
        throw new Error('Failed to get matches')
      }

      const data = await quizRes.json()
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

  const handleComplete = useCallback((quizAnswers: QuizAnswers) => {
    setPendingAnswers(quizAnswers)
  }, [])

  const handleEmailSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingAnswers) return
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError(null)
    handleSubmitWithQuiz(pendingAnswers, email.trim())
  }, [pendingAnswers, email, handleSubmitWithQuiz])

  const handleRetake = useCallback(() => {
    setResults(null)
    setAnswers(null)
    setResultSlug('')
    setError(null)
    setStarted(false)
    setPendingAnswers(null)
    setEmail('')
    setEmailError(null)
    window.history.replaceState({}, '', '/vacation-quiz')
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terracotta/10 mb-6">
            <svg
              className="animate-spin h-8 w-8 text-terracotta"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="font-display text-2xl font-semibold text-foreground mb-2">
            Finding your perfect stay...
          </p>
          <p className="font-body text-muted-foreground">
            Scanning 350+ curated unique stays across America
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
          <p className="font-display text-2xl text-foreground mb-2">Something went wrong</p>
          <p className="font-body text-muted-foreground mb-6">{error}</p>
          <button
            onClick={handleRetake}
            className="px-6 py-3 rounded-lg bg-terracotta text-warm-white font-body font-bold hover:bg-terracotta-light transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Email gate — required before seeing results
  if (pendingAnswers && !results) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <p className="font-body text-sm font-bold tracking-widest uppercase text-terracotta mb-3">
            Almost there!
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-3">
            See your curated matches
          </h2>
          <p className="font-body text-muted-foreground mb-8">
            Enter your email to unlock your personalized stay recommendations.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
            />
            {emailError && (
              <p className="font-body text-sm text-red-500">{emailError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg bg-terracotta text-warm-white font-body font-bold text-lg shadow-lg hover:bg-terracotta-light hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding your matches...' : 'Show My Matches →'}
            </button>
          </form>
          <p className="font-body text-xs text-muted-foreground mt-4">
            We&apos;ll also send you curated picks. Unsubscribe anytime.
          </p>
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

  // Landing / quiz flow
  if (!started) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-body text-sm font-bold tracking-widest uppercase text-terracotta mb-4">
            60 seconds. 5 questions.
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold text-foreground leading-[1.05] mb-4">
            Where should your next vacation be?
          </h1>
          <p className="font-body text-lg text-muted-foreground max-w-lg mx-auto mb-8">
            We will match you to curated unique stays — treehouses, domes, houseboats, caves — across America. 
            No scrolling. Just vibes.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-4 rounded-lg bg-terracotta text-warm-white font-body font-bold text-lg shadow-lg hover:bg-terracotta-light hover:shadow-xl transition-all"
          >
            Start the Quiz →
          </button>
          <p className="font-body text-xs text-muted-foreground mt-4">
            350+ stays · Free · Takes 60 seconds
          </p>
        </div>
      </div>
    )
  }

  return <VacationQuiz onComplete={handleComplete} onBack={handleRetake} />
}
