'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2 } from 'lucide-react'

interface NewsletterModalProps {
  open: boolean
  onClose: () => void
}

export default function NewsletterModal({ open, onClose }: NewsletterModalProps) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (open) setDone(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'oklch(0.22 0.01 60 / 0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden grain-overlay"
            style={{
              background: 'oklch(0.33 0.10 38)',
            }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full transition-colors hover:bg-white/10"
              style={{ color: 'oklch(0.78 0.06 42)' }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-8 py-10">
              <h2
                className="font-bold mb-3"
                style={{
                  fontFamily: 'Fraunces, serif',
                  color: 'oklch(0.99 0.005 85)',
                  lineHeight: 1.1,
                  fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                }}
              >
                The Weekly
                <br />
                <span style={{ fontStyle: 'italic', color: 'oklch(0.85 0.10 45)' }}>
                  Wanderer.
                </span>
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: 'oklch(0.78 0.06 42)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                New extraordinary stays in your inbox every Tuesday.
              </p>

              {done ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="flex items-center gap-3 py-3"
                >
                  <CheckCircle2
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: 'oklch(0.72 0.10 40)' }}
                  />
                  <div>
                    <p
                      className="font-bold text-sm"
                      style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}
                    >
                      You&apos;re on the list.
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'oklch(0.75 0.05 40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      First issue arrives next Tuesday.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setDone(true)
                  }}
                >
                  <input
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 text-sm outline-none focus:ring-2"
                    style={{
                      background: 'oklch(0.26 0.07 38)',
                      color: 'oklch(0.93 0.025 75)',
                      border: '1.5px solid oklch(0.45 0.10 38)',
                      borderRadius: '3px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  />
                  <motion.button
                    type="submit"
                    className="w-full px-6 py-3 text-sm font-bold uppercase tracking-wider"
                    style={{
                      background: 'oklch(0.85 0.10 45)',
                      color: 'oklch(0.22 0.01 60)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      borderRadius: '3px',
                      letterSpacing: '0.1em',
                      fontSize: '0.7rem',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Send Me Picks
                  </motion.button>
                </form>
              )}

              <p
                className="text-xs mt-4"
                style={{ color: 'oklch(0.65 0.05 40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                12,000+ subscribers. New picks every Tuesday. Bail anytime.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
