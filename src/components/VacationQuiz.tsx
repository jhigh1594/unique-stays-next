'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { QuizAnswers } from '@/lib/matching-engine'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

// ── Question definitions ──
const QUESTIONS = [
  {
    id: 'occasion' as const,
    title: 'What brings you here?',
    subtitle: 'No wrong answers.',
    options: [
      { value: 'romantic', label: 'Romantic getaway', emoji: '💑', description: 'Two people, zero distractions' },
      { value: 'solo', label: 'Solo reset', emoji: '🧘', description: 'Just you and the silence' },
      { value: 'friends', label: 'Friends weekend', emoji: '🍻', description: 'The group chat made it real' },
      { value: 'family', label: 'Family adventure', emoji: '👨‍👩‍👧‍👦', description: 'Making memories (or chaos)' },
    ],
  },
  {
    id: 'vibe' as const,
    title: 'What kind of silence?',
    subtitle: 'Pick the landscape that calls to you.',
    options: [
      { value: 'woods', label: 'Deep woods', emoji: '🌲', description: 'Trees for days' },
      { value: 'waterfront', label: 'Waterfront', emoji: '🌊', description: 'Something with a shoreline' },
      { value: 'desert', label: 'Desert silence', emoji: '🏜️', description: 'Wide open and starlit' },
      { value: 'mountains', label: 'Mountain views', emoji: '🏔️', description: 'Elevation required' },
      { value: 'offgrid', label: 'Off-grid', emoji: '📡', description: 'No signal, no problem' },
    ],
  },
  {
    id: 'distance' as const,
    title: 'How far are you willing to go?',
    subtitle: 'Be honest.',
    options: [
      { value: 'nearby', label: 'Close by', emoji: '🚗', description: 'Within 2 hours' },
      { value: 'halfday', label: 'A half-day drive', emoji: '🛣️', description: 'Worth the playlist' },
      { value: 'anywhere', label: 'Fly me anywhere', emoji: '✈️', description: 'The world is small' },
    ],
  },
  {
    id: 'budget' as const,
    title: "What's the budget?",
    subtitle: 'Per night. No judgment.',
    options: [
      { value: 'under150', label: 'Under $150', emoji: '💵', description: 'Smart and affordable' },
      { value: '150to300', label: '$150 – $300', emoji: '💰', description: 'The sweet spot' },
      { value: '300to500', label: '$300 – $500', emoji: '✨', description: 'Going all out' },
      { value: '500plus', label: '$500+', emoji: '👑', description: 'Spare no expense' },
    ],
  },
  {
    id: 'mustHave' as const,
    title: 'What is non-negotiable?',
    subtitle: 'The one thing you need.',
    options: [
      { value: 'views', label: 'Sweeping views', emoji: '🌅' },
      { value: 'privacy', label: 'Total privacy', emoji: '🤫' },
      { value: 'hottub', label: 'Hot tub', emoji: '♨️' },
      { value: 'hiking', label: 'Near hiking', emoji: '🥾' },
      { value: 'pets', label: 'Pet-friendly', emoji: '🐕' },
      { value: 'offgrid-wifi-free', label: 'Off-grid / WiFi-free', emoji: '📵' },
    ],
  },
] as const

const ZIP_STEP = {
  id: 'zipCode' as const,
  title: 'Last thing — where are you starting from?',
  subtitle: 'We will find stays within your travel radius.',
  placeholder: 'ZIP code',
}

export interface VacationQuizProps {
  onComplete: (answers: QuizAnswers) => void
  onBack?: () => void
}

export default function VacationQuiz({ onComplete, onBack }: VacationQuizProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({})
  const [zipInput, setZipInput] = useState('')
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back

  const totalSteps = QUESTIONS.length + 1 // +1 for zip code
  const progress = ((step + 1) / totalSteps) * 100
  const isZipStep = step === QUESTIONS.length

  const handleSelect = useCallback(
    (questionId: keyof QuizAnswers, value: string) => {
      const updated = { ...answers, [questionId]: value }
      setAnswers(updated)

      // Auto-advance after a brief delay
      setTimeout(() => {
        if (step < QUESTIONS.length) {
          setDirection(1)
          setStep(step + 1)
        }
      }, 300)
    },
    [answers, step]
  )

  const handleZipSubmit = useCallback(() => {
    if (!/^\d{5}$/.test(zipInput)) return
    const finalAnswers = { ...answers, zipCode: zipInput } as QuizAnswers
    setAnswers(finalAnswers)
    onComplete(finalAnswers)
  }, [answers, zipInput, onComplete])

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1)
      setStep(step - 1)
    } else if (onBack) {
      onBack()
    }
  }, [step, onBack])

  const currentQuestion = isZipStep ? null : QUESTIONS[step]

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Progress bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goBack}
            className="text-sm font-body font-semibold text-terracotta hover:text-terracotta-light transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {step === 0 ? 'Back' : 'Back'}
          </button>
          <span className="text-sm font-body text-muted-foreground">
            {step + 1} of {totalSteps}
          </span>
        </div>
        <div className="w-full h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-terracotta rounded-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="w-full max-w-2xl relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {!isZipStep && currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-2">
                  {currentQuestion.title}
                </h2>
                <p className="font-body text-muted-foreground text-base">
                  {currentQuestion.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(currentQuestion.id, option.value)}
                      className={cn(
                        'group relative flex items-start gap-4 p-4 sm:p-5 rounded-lg border-2 text-left transition-all duration-200',
                        isSelected
                          ? 'border-terracotta bg-terracotta/5 shadow-md'
                          : 'border-border bg-card hover:border-terracotta/40 hover:shadow-sm'
                      )}
                    >
                      <span className="text-2xl sm:text-3xl flex-shrink-0 mt-0.5">
                        {option.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            'block font-display text-lg font-semibold leading-snug',
                            isSelected ? 'text-terracotta' : 'text-foreground'
                          )}
                        >
                          {option.label}
                        </span>
                        {'description' in option && option.description && (
                          <span className="block text-sm text-muted-foreground mt-0.5">
                            {option.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-terracotta flex items-center justify-center"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="zipcode"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-2">
                  {ZIP_STEP.title}
                </h2>
                <p className="font-body text-muted-foreground text-base">
                  {ZIP_STEP.subtitle}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative w-full max-w-xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleZipSubmit()}
                    placeholder={ZIP_STEP.placeholder}
                    className="w-full text-center font-display text-3xl font-semibold py-4 px-6 border-2 border-border rounded-lg bg-card focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-all placeholder:text-border"
                    autoFocus
                  />
                </div>

                <motion.button
                  onClick={handleZipSubmit}
                  disabled={!/^\d{5}$/.test(zipInput)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'px-8 py-3.5 rounded-lg font-body font-bold text-base tracking-wide transition-all',
                    /^\d{5}$/.test(zipInput)
                      ? 'bg-terracotta text-warm-white shadow-lg hover:bg-terracotta-light hover:shadow-xl'
                      : 'bg-border text-muted-foreground cursor-not-allowed'
                  )}
                >
                  Find My Vacation →
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
