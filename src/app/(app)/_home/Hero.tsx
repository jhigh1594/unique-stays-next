'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, animate } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { CategoryConfig } from '@/lib/categories-config'

const SLIDE_MS = 5500
const SHOW_COUNT = 6

interface HeroSlide {
  url: string
  label: string
  location: string
  categoryLabel: string
  categoryEmoji: string
}

const HERO_POOL: HeroSlide[] = [
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/stays/sitka-lighthouse-ak.jpeg', label: 'Lighthouse on the Coast', location: 'Sitka, Alaska', categoryLabel: 'Lighthouses', categoryEmoji: '🗼' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/stays/luxury-castle-davis-ca.jpeg', label: 'Castle Estate', location: 'Davis, California', categoryLabel: 'Castles & Estates', categoryEmoji: '🏰' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/dome-water.jpg', label: 'Geodesic Dome on the Water', location: 'Alaska', categoryLabel: 'Geodesic Domes', categoryEmoji: '🔮' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/aframe-pnw.jpg', label: 'A-Frame in the Pacific Northwest', location: 'Washington', categoryLabel: 'A-Frame Cabins', categoryEmoji: '🏔️' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/lighthouse-rocky.jpg', label: 'Lighthouse on the Rocky Coast', location: 'Oregon Coast', categoryLabel: 'Lighthouses', categoryEmoji: '🗼' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/houseboat-calm.jpg', label: 'Houseboat on Calm Waters', location: 'Finland', categoryLabel: 'Houseboats', categoryEmoji: '⛵' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/tiny-house-mountains.jpg', label: 'Tiny House in the Mountains', location: 'Montenegro', categoryLabel: 'Tiny Homes', categoryEmoji: '🏡' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/tiny-house-countryside.jpg', label: 'Tiny House in the Countryside', location: 'Sweden', categoryLabel: 'Tiny Homes', categoryEmoji: '🏡' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/glamping-mountain.jpg', label: 'Glamping with Mountain Views', location: 'Switzerland', categoryLabel: 'Glamping', categoryEmoji: '⛺' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/safari-sunset.jpg', label: 'Safari Tent at Sunset', location: 'Tanzania', categoryLabel: 'Glamping', categoryEmoji: '⛺' },
  { url: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/hero/castle-fog.jpg', label: 'Castle in Morning Fog', location: 'Bavaria', categoryLabel: 'Castles & Estates', categoryEmoji: '🏰' },
]

// Deterministic daily rotation — no hydration mismatch, no double-render
const DAY_OFFSET = new Date().getDate() % HERO_POOL.length
const INITIAL_SLIDES = [...HERO_POOL.slice(DAY_OFFSET), ...HERO_POOL.slice(0, DAY_OFFSET)].slice(0, SHOW_COUNT)
export const HERO_FIRST_IMAGE = INITIAL_SLIDES[0].url

function AnimatedStat({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!isInView || !ref.current) return
    const controls = animate(0, to, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v) + suffix
      },
    })
    return controls.stop
  }, [isInView, to, suffix])

  return <span ref={ref}>0{suffix}</span>
}

const headline = ['Stay', 'somewhere', 'extraordinary']

interface HeroProps {
  categories: CategoryConfig[]
  stats: Array<{ value: number; suffix: string; label: string }>
}

export default function Hero({ categories, stats }: HeroProps) {
  const [slides] = useState(INITIAL_SLIDES)
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const handleThumbClick = (i: number) => {
    setActive(i)
    resetTimer()
  }

  const current = slides[active]

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden" style={{ background: 'oklch(0.13 0.02 40)' }}>
      {/* Photo stage — crossfading film reel */}
      <div className="absolute inset-0">
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
              alt={`${current.label} — ${current.location}`}
              fill
              sizes="100vw"
              quality={80}
              className="object-cover will-change-transform"
              priority={active === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Bottom-up espresso gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, oklch(0.13 0.02 40) 0%, oklch(0.15 0.02 40 / 0.85) 25%, transparent 60%)' }} />
        {/* Side vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, oklch(0.13 0.02 40 / 0.7) 100%)' }} />
        {/* Light leak */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-[60vh] w-[60vh] rounded-full blur-2xl animate-light-leak"
          style={{ background: 'radial-gradient(circle, oklch(0.86 0.12 60 / 0.45), transparent 60%)' }}
        />
      </div>

      {/* Reel caption — top right */}
      <div className="pointer-events-none absolute top-24 right-6 z-10 hidden md:flex flex-col items-end gap-1 text-[10px] uppercase tracking-[0.25em]" style={{ color: 'oklch(0.96 0.02 75 / 0.7)' }}>
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
            <div className="font-display text-base italic normal-case tracking-normal" style={{ color: 'oklch(0.86 0.08 55)' }}>
              {current.categoryLabel}
            </div>
            <div>{current.location}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-80px)] w-[min(95%,1280px)] flex-col justify-end pb-10 pt-24 md:pb-16">
        {/* Headline with mask-up reveal */}
        <h1
          className="leading-[0.92] tracking-[-0.02em]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.25rem, 9vw, 10.5rem)',
            fontWeight: 300,
            color: 'oklch(0.96 0.02 75)',
          }}
        >
          {headline.map((word, i) => (
            <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
              <motion.span
                className={`inline-block ${word === 'somewhere' ? 'italic' : ''}`}
                style={word === 'somewhere' ? { fontWeight: 400, color: 'oklch(0.86 0.08 55)' } : undefined}
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 1.1, delay: 0.35 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* Sub + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-7 flex max-w-xl flex-col gap-6"
        >
          <p
            className="text-base leading-relaxed md:text-lg"
            style={{ color: 'oklch(0.96 0.02 75 / 0.8)', fontFamily: 'var(--font-body)' }}
          >
            A weekly field guide to the most unforgettable short-term rentals in the country —
            from treetop hideouts to coastal cabins worth the detour.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/collection">
              <span
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition hover:brightness-110 cursor-pointer"
                style={{
                  background: 'oklch(0.55 0.14 38)',
                  color: 'oklch(0.99 0.005 85)',
                  boxShadow: '0 15px 40px -12px oklch(0.55 0.14 38 / 0.85)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Browse all stays
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <a href="#newsletter">
              <span
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/10 cursor-pointer"
                style={{
                  border: '1px solid oklch(0.96 0.02 75 / 0.15)',
                  background: 'oklch(0.96 0.02 75 / 0.05)',
                  color: 'oklch(0.96 0.02 75)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Get weekly picks
              </span>
            </a>
          </div>
        </motion.div>

        {/* Stat ribbon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-6 grid grid-cols-3 rounded-2xl px-2 py-5 backdrop-blur-md md:max-w-2xl"
          style={{
            background: 'oklch(0 0 0 / 0.25)',
            border: '1px solid oklch(0.96 0.02 75 / 0.1)',
          }}
        >
          {stats.map((s, idx) => (
            <div key={s.label} className="px-4 text-center md:text-left" style={{ borderRight: idx < stats.length - 1 ? '1px solid oklch(0.96 0.02 75 / 0.1)' : 'none' }}>
              <div
                className="text-3xl md:text-4xl"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'oklch(0.96 0.02 75)' }}
              >
                <AnimatedStat to={s.value} suffix={s.suffix} />
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.2em] md:text-xs"
                style={{ color: 'oklch(0.96 0.02 75 / 0.6)', fontFamily: 'var(--font-body)' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Film strip — bottom-right, desktop only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.3 }}
        className="pointer-events-none absolute bottom-20 right-4 z-20 hidden md:block"
      >
        <div className="pointer-events-auto relative rounded-md px-2 py-1.5 backdrop-blur-md" style={{ background: 'oklch(0 0 0 / 0.7)', boxShadow: 'inset 0 0 0 1px oklch(0.96 0.02 75 / 0.1)' }}>
          {/* Sprocket holes */}
          <div
            className="absolute inset-x-2 top-0.5 h-1 rounded-sm opacity-80"
            style={{ backgroundImage: 'repeating-linear-gradient(to right, oklch(0.96 0.02 75) 0 4px, transparent 4px 10px)' }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-2 bottom-0.5 h-1 rounded-sm opacity-80"
            style={{ backgroundImage: 'repeating-linear-gradient(to right, oklch(0.96 0.02 75) 0 4px, transparent 4px 10px)' }}
            aria-hidden="true"
          />
          <div className="flex gap-1.5 py-2">
            {slides.map((s, i) => {
              const isActive = i === active
              return (
                <button
                  key={s.url}
                  onClick={() => handleThumbClick(i)}
                  className={`group relative aspect-video h-10 shrink-0 overflow-hidden rounded-sm transition ${
                    isActive
                      ? 'shadow-[0_0_0_2px_oklch(0.86_0.08_55)]'
                      : 'opacity-55 hover:opacity-100'
                  }`}
                  style={{ boxShadow: isActive ? '0 0 0 2px oklch(0.86 0.08 55)' : undefined, border: `1px solid ${isActive ? 'oklch(0.86 0.08 55)' : 'oklch(0.96 0.02 75 / 0.1)'}` }}
                  aria-label={`${s.label} — ${s.location}`}
                >
                  <Image src={s.url} alt="" fill sizes="120px" quality={85} className="object-cover" loading="lazy" />
                  <span className="absolute left-0.5 top-0.5 text-[7px] uppercase tracking-widest mix-blend-difference" style={{ fontFamily: 'ui-monospace, monospace', color: 'oklch(0.96 0.02 75 / 0.9)' }}>
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
      </motion.div>

      {/* Marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.7 }}
        className="relative z-10 backdrop-blur-md"
        style={{ background: 'oklch(0 0 0 / 0.4)', borderTop: '1px solid oklch(0.96 0.02 75 / 0.1)', borderBottom: '1px solid oklch(0.96 0.02 75 / 0.1)' }}
      >
        <div className="group flex overflow-hidden py-3.5">
          <div className="flex shrink-0 animate-marquee gap-10 whitespace-nowrap pr-10 group-hover:[animation-play-state:paused]">
            {[...categories, ...categories].map((c, i) => (
              <span key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'oklch(0.96 0.02 75 / 0.85)' }}>
                <span className="text-base">{c.emoji}</span>
                <span className="italic" style={{ fontFamily: 'var(--font-display)', color: 'oklch(0.86 0.08 55)' }}>{c.label}</span>
                <span style={{ color: 'oklch(0.96 0.02 75 / 0.4)' }}>— {c.count}</span>
                <span className="ml-10" style={{ color: 'oklch(0.96 0.02 75 / 0.2)' }}>&#10022;</span>
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
