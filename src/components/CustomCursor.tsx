'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

// Pin 1 — classic filled, slightly smaller (30×42 display, viewBox 36×50)
// Tip of pin is at y≈40px in display coords.
const PIN_OFFSET_X = 15  // half of 30px width
const PIN_OFFSET_Y = 40  // tip of teardrop at display scale

export default function CustomCursor() {
  const mouseX = useMotionValue(-200)
  const mouseY = useMotionValue(-200)
  const [isOverCard, setIsOverCard] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const x = useSpring(mouseX, { damping: 26, stiffness: 280, mass: 0.6 })
  const y = useSpring(mouseY, { damping: 26, stiffness: 280, mass: 0.6 })

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setMounted(true)

    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      setIsOverCard(t.closest('[data-cursor="view"]') !== null)
      setIsDark(!!t.closest('[data-dark-section]'))
    }

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [mouseX, mouseY])

  if (!mounted) return null

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9997]"
      style={{ x, y }}
    >
      <AnimatePresence>
        {isOverCard && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: -8, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            style={{
              position: 'absolute',
              left: `-${PIN_OFFSET_X}px`,
              top:  `-${PIN_OFFSET_Y}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <svg
              width="30"
              height="42"
              viewBox="0 0 36 50"
              fill="none"
              style={{ filter: 'drop-shadow(0 4px 10px rgba(168,70,38,0.38))' }}
            >
              <path
                d="M18 1C8.611 1 1 8.611 1 18c0 12.722 17 31 17 31S35 30.722 35 18C35 8.611 27.389 1 18 1z"
                fill="#A84626"
              />
              <circle cx="18" cy="18" r="9" fill="rgba(255,255,255,0.18)" />
              <circle cx="18" cy="18" r="4" fill="rgba(255,255,255,0.75)" />
            </svg>

            <span
              style={{
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: '12px',
                lineHeight: 1,
                color: isDark ? 'oklch(0.92 0.01 80)' : 'oklch(0.22 0.01 60)',
                textShadow: isDark
                  ? '0 1px 6px rgba(20,15,10,0.7)'
                  : '0 1px 6px rgba(246,242,236,0.95)',
                whiteSpace: 'nowrap',
              }}
            >
              visit
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
