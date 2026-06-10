'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { INITIAL_SLIDES, SLIDE_MS } from './hero-slides'

export default function HeroClient() {
  const [slides] = useState(INITIAL_SLIDES)
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS)
  }

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleThumbClick = (i: number) => {
    setActive(i)
    resetTimer()
  }

  const current = slides[active]
  const showCarouselLayer = active > 0

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden={!showCarouselLayer}>
      <div className="absolute inset-0">
        {showCarouselLayer && (
          <AnimatePresence mode="sync">
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1.08 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.4, ease: [0.4, 0, 0.2, 1] },
                scale: { duration: SLIDE_MS / 1000 + 1.4, ease: 'linear' },
              }}
            >
              <Image
                src={current.url}
                alt=""
                fill
                sizes="100vw"
                quality={80}
                className="object-cover will-change-transform"
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, oklch(0.13 0.02 40) 0%, oklch(0.15 0.02 40 / 0.85) 25%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, oklch(0.13 0.02 40 / 0.7) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-[60vh] w-[60vh] rounded-full blur-2xl animate-light-leak"
          style={{
            background: 'radial-gradient(circle, oklch(0.86 0.12 60 / 0.45), transparent 60%)',
          }}
        />
      </div>

      <div
        className="absolute top-24 right-6 z-10 hidden md:flex flex-col items-end gap-1 text-[10px] uppercase tracking-[0.25em]"
        style={{ color: 'oklch(0.96 0.02 75 / 0.7)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-end gap-1"
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-terracotta animate-pulse" />
              <span>Reel &numero; {String(active + 1).padStart(3, '0')}</span>
            </div>
            <div
              className="font-display text-base italic normal-case tracking-normal"
              style={{ color: 'oklch(0.86 0.08 55)' }}
            >
              {current.categoryLabel}
            </div>
            <div>{current.location}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-20 right-4 z-20 hidden md:block pointer-events-auto">
        <div
          className="relative rounded-md px-2 py-1.5 backdrop-blur-md"
          style={{
            background: 'oklch(0 0 0 / 0.7)',
            boxShadow: 'inset 0 0 0 1px oklch(0.96 0.02 75 / 0.1)',
          }}
        >
          <div
            className="absolute inset-x-2 top-0.5 h-1 rounded-sm opacity-80"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, oklch(0.96 0.02 75) 0 4px, transparent 4px 10px)',
            }}
          />
          <div
            className="absolute inset-x-2 bottom-0.5 h-1 rounded-sm opacity-80"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, oklch(0.96 0.02 75) 0 4px, transparent 4px 10px)',
            }}
          />
          <div className="flex gap-1.5 py-2">
            {slides.map((s, i) => {
              const isActive = i === active
              return (
                <button
                  key={s.url}
                  type="button"
                  onClick={() => handleThumbClick(i)}
                  className={`group relative aspect-video h-10 shrink-0 overflow-hidden rounded-sm transition ${
                    isActive ? 'opacity-100' : 'opacity-55 hover:opacity-100'
                  }`}
                  style={{
                    boxShadow: isActive ? '0 0 0 2px oklch(0.86 0.08 55)' : undefined,
                    border: `1px solid ${isActive ? 'oklch(0.86 0.08 55)' : 'oklch(0.96 0.02 75 / 0.1)'}`,
                  }}
                  aria-label={`${s.label} — ${s.location}`}
                >
                  <Image
                    src={s.url}
                    alt=""
                    fill
                    sizes="120px"
                    quality={85}
                    className="object-cover"
                    loading="lazy"
                  />
                  <span
                    className="absolute left-0.5 top-0.5 text-[7px] uppercase tracking-widest mix-blend-difference"
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      color: 'oklch(0.96 0.02 75 / 0.9)',
                    }}
                  >
                    {String(i + 1).padStart(3, '0')}
                  </span>
                  {isActive && (
                    <motion.span
                      key={`bar-${active}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                      className="absolute bottom-0 left-0 h-0.5 w-full origin-left"
                      style={{ background: 'oklch(0.86 0.08 55)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
