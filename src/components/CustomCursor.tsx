'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

type CursorState = 'default' | 'hover' | 'view' | 'drag'

export default function CustomCursor() {
  const mouseX = useMotionValue(-200)
  const mouseY = useMotionValue(-200)
  const [state, setState] = useState<CursorState>('default')
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  const dotX = useSpring(mouseX, { damping: 55, stiffness: 700, mass: 0.15 })
  const dotY = useSpring(mouseY, { damping: 55, stiffness: 700, mass: 0.15 })
  const ringX = useSpring(mouseX, { damping: 26, stiffness: 280, mass: 0.6 })
  const ringY = useSpring(mouseY, { damping: 26, stiffness: 280, mass: 0.6 })

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setMounted(true)
    document.documentElement.classList.add('has-custom-cursor')

    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const cursorAttr = t.closest('[data-cursor]') as HTMLElement | null
      if (cursorAttr?.dataset.cursor === 'view') {
        setState('view')
      } else if (cursorAttr?.dataset.cursor === 'drag') {
        setState('drag')
      } else if (t.closest('a[href], button, input, select, textarea, [role="button"], label')) {
        setState('hover')
      } else {
        setState('default')
      }
      setIsDark(!!t.closest('[data-dark-section]'))
    }

    const click = (e: MouseEvent) => {
      const stamp = document.createElement('div')
      stamp.className = 'cursor-stamp'
      stamp.style.left = `${e.clientX}px`
      stamp.style.top = `${e.clientY}px`
      document.body.appendChild(stamp)
      setTimeout(() => stamp.remove(), 700)
    }

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    window.addEventListener('click', click, { passive: true })

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      window.removeEventListener('click', click)
    }
  }, [mouseX, mouseY])

  if (!mounted) return null

  const dot = isDark ? 'oklch(0.88 0.025 75)' : 'oklch(0.55 0.14 38)'
  const ring = isDark ? 'oklch(0.88 0.025 75)' : 'oklch(0.55 0.14 38)'
  const ringFill = state === 'view'
    ? (isDark ? 'oklch(0.88 0.025 75)' : 'oklch(0.55 0.14 38)')
    : 'oklch(0.55 0.14 38 / 0)'
  const ringSize = state === 'view' ? 68 : state === 'hover' ? 50 : 42
  const dotSize = state === 'hover' || state === 'view' ? 0 : 10

  return (
    <>
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9998]"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
      >
        <motion.div
          animate={{ width: dotSize, height: dotSize, background: dot }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ borderRadius: '50%' }}
        />
      </motion.div>

      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9997] flex items-center justify-center"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
      >
        <motion.div
          className="flex items-center justify-center"
          animate={{
            width: ringSize,
            height: ringSize,
            backgroundColor: ringFill,
            borderColor: ring,
            opacity: state === 'drag' ? 0.4 : 1,
            borderWidth: state === 'drag' ? '1px' : '1.5px',
          }}
          style={{
            backgroundColor: 'oklch(0.55 0.14 38 / 0)',
            borderRadius: '50%',
            borderStyle: 'solid',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        >
          {state === 'view' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '0.52rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isDark ? 'oklch(0.22 0.01 60)' : 'oklch(0.99 0.005 85)',
              }}
            >
              View
            </motion.span>
          )}
          {state === 'drag' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '0.52rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: ring,
              }}
            >
              ⟷
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    </>
  )
}
