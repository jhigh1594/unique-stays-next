'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CIRCUMFERENCE = 2 * Math.PI * 52
const INNER_CIRCUMFERENCE = 2 * Math.PI * 44

export default function LoadingSplash() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const pageReady = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') return resolve()
      window.addEventListener('load', () => resolve(), { once: true })
    })
    pageReady.then(() => setVisible(false))
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'oklch(0.975 0.012 85)' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="oklch(0.55 0.14 38)"
                  strokeWidth="1.5"
                  strokeDasharray={CIRCUMFERENCE}
                  initial={{ strokeDashoffset: CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="oklch(0.55 0.14 38)"
                  strokeWidth="0.5"
                  strokeDasharray={INNER_CIRCUMFERENCE}
                  initial={{ strokeDashoffset: INNER_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: 'easeInOut' }}
                  opacity={0.4}
                />
              </svg>

              <motion.div
                initial={{ rotate: -360, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{
                  rotate: { duration: 0.75, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] },
                  opacity: { duration: 0.3, delay: 0.2 },
                }}
                className="flex flex-col items-center"
              >
                <svg width="20" height="36" viewBox="0 0 20 36" fill="none">
                  <path d="M10 0 L13 16 L7 16 Z" fill="oklch(0.55 0.14 38)" />
                  <path d="M10 36 L13 20 L7 20 Z" fill="oklch(0.72 0.04 75)" />
                  <circle cx="10" cy="18" r="2.5" fill="oklch(0.22 0.01 60)" />
                </svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute inset-0"
              >
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <defs>
                    <path id="textCircle" d="M60,60 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                  </defs>
                  <text
                    fontSize="6.5"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                    letterSpacing="4"
                    fill="oklch(0.55 0.14 38)"
                    textAnchor="middle"
                  >
                    <textPath href="#textCircle" startOffset="50%">
                      UNIQUE STAYS USA ✦ EST. 2024 ✦
                    </textPath>
                  </text>
                </svg>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
              className="text-center"
            >
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'oklch(0.55 0.14 38)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}
              >
                Unique Stays
              </div>
              <div
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'oklch(0.38 0.09 155)',
                  marginTop: '4px',
                }}
              >
                USA
              </div>
            </motion.div>

            <motion.div
              className="rounded-full overflow-hidden"
              style={{ width: 120, height: 2, background: 'oklch(0.88 0.025 75)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'oklch(0.55 0.14 38)' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
