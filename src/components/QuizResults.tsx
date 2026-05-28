'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { StayMatch } from '@/lib/matching-engine'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

export interface QuizResultsProps {
  results: StayMatch[]
  resultSlug: string
  answers: Record<string, string>
  onRetake: () => void
}

export default function QuizResults({ results, resultSlug, answers, onRetake }: QuizResultsProps) {
  const topMatch = results[0]

  const occasionLabels: Record<string, string> = {
    romantic: 'Romantic',
    solo: 'Solo',
    friends: 'Group',
    family: 'Family',
  }
  const vibeLabels: Record<string, string> = {
    woods: 'deep woods',
    waterfront: 'waterfront',
    desert: 'desert',
    mountains: 'mountain',
    offgrid: 'off-grid',
  }

  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="font-body text-sm font-bold tracking-widest uppercase text-terracotta mb-3">
            Your matches
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold text-foreground leading-tight mb-3">
            {topMatch
              ? `Your next vacation: a ${topMatch.categoryName?.replace('&', '&') || 'unique stay'}`
              : 'Your next vacation awaits'}
          </h1>
          {topMatch && (
            <p className="font-body text-muted-foreground text-lg">
              A {occasionLabels[answers.occasion] || ''} {vibeLabels[answers.vibe] || ''} escape — curated for you
            </p>
          )}
        </motion.div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-2xl text-foreground mb-2">
              No exact matches found
            </p>
            <p className="font-body text-muted-foreground mb-6">
              Try expanding your distance or adjusting your budget.
            </p>
            <button
              onClick={onRetake}
              className="px-6 py-3 rounded-lg bg-terracotta text-warm-white font-body font-bold hover:bg-terracotta-light transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {results.map((stay, index) => (
              <motion.div
                key={stay.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <a
                  href={stay.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div
                    className={cn(
                      'relative flex flex-col sm:flex-row gap-0 sm:gap-5 p-0 sm:p-4 rounded-xl border-2 bg-card overflow-hidden transition-all duration-300',
                      index === 0
                        ? 'border-terracotta shadow-lg hover:shadow-xl'
                        : 'border-border hover:border-terracotta/30 hover:shadow-md'
                    )}
                  >
                    {/* Image */}
                    <div className="relative w-full sm:w-48 h-48 sm:h-36 flex-shrink-0 overflow-hidden bg-muted">
                      {stay.imageUrl ? (
                        <img
                          src={stay.imageUrl}
                          alt={stay.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {stay.categoryEmoji || '🏠'}
                        </div>
                      )}
                      {index === 0 && (
                        <div className="absolute top-3 left-3 bg-terracotta text-warm-white px-3 py-1 rounded-md font-body text-xs font-bold tracking-wide uppercase">
                          Top Match
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-4 sm:p-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xs font-bold tracking-wider uppercase text-terracotta mb-1">
                            {stay.categoryName}
                          </p>
                          <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground leading-snug group-hover:text-terracotta transition-colors">
                            {stay.title}
                          </h3>
                          <p className="font-body text-sm text-muted-foreground mt-0.5">
                            {stay.city ? `${stay.city}, ` : ''}{stay.state}
                          </p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="font-display text-xl font-bold text-foreground">
                            ${stay.price}
                          </span>
                          <span className="font-body text-xs text-muted-foreground">/night</span>
                          {stay.rating && (
                            <span className="font-body text-xs text-muted-foreground mt-1">
                              ⭐ {stay.rating}
                              {stay.reviewCount ? ` (${stay.reviewCount})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {stay.editorNote && (
                        <p className="font-display text-sm italic text-foreground/70 mt-2 line-clamp-2">
                          &ldquo;{stay.editorNote}&rdquo;
                        </p>
                      )}

                      {/* Match reasons */}
                      {stay.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {stay.matchReasons.slice(0, 3).map((reason, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2.5 py-1 rounded-full bg-terracotta/8 text-terracotta font-body text-xs font-semibold"
                            >
                              {reason}
                            </span>
                          ))}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-forest/8 text-forest font-body text-xs font-bold">
                            {stay.matchScore}% match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-8 border-t border-border"
          >
            <button
              onClick={onRetake}
              className="px-6 py-3 rounded-lg border-2 border-border font-body font-bold text-foreground hover:border-terracotta hover:text-terracotta transition-all"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Where Should My Next Vacation Be?',
                    text: `I got matched to ${topMatch?.title || 'unique stays'}!`,
                    url: window.location.href,
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                }
              }}
              className="px-6 py-3 rounded-lg bg-forest text-warm-white font-body font-bold hover:bg-forest-light transition-colors"
            >
              Share Results
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
