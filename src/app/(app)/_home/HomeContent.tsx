'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import {
  motion,
} from 'framer-motion'
import { getPostHog } from '@/lib/posthog-lazy'
import StayCard from '@/components/StayCard'
import dynamic from 'next/dynamic'

const FilmstripSection = dynamic(() => import('@/components/FilmstripSection'), { ssr: false })
const CorkboardTestimonials = dynamic(() => import('@/components/CorkboardTestimonials'), { ssr: false })
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import type { NormalizedStay } from '@/lib/types'
import type { CategoryConfig } from '@/lib/categories-config'
import Hero from './Hero'

const SPOKES = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

interface HomeContentProps {
  featuredStays: NormalizedStay[]
  editorsPickStays: NormalizedStay[]
  filmstripStays: NormalizedStay[]
  allStays: NormalizedStay[]
  categories: CategoryConfig[]
  totalCount: number
}

// ── Intersection-based clip-reveal observer ────────────────
function useClipReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('.fade-up, .clip-reveal').forEach((el) =>
      observer.observe(el)
    )
    return () => observer.disconnect()
  }, [])
}

// ── Ghost section number ──────────────────────────────────
function GhostNumber({ n, light = false }: { n: string; light?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute select-none pointer-events-none font-display leading-none"
      style={{
        fontSize: 'clamp(8rem, 18vw, 15rem)',
        color: light ? 'oklch(0.99 0.005 85)' : 'oklch(0.22 0.01 60)',
        opacity: light ? 0.05 : 0.04,
        bottom: '-0.1em',
        left: '-0.04em',
        lineHeight: 1,
        fontFamily: 'Fraunces, serif',
        fontWeight: 900,
        zIndex: 0,
      }}
    >
      {n}
    </span>
  )
}

// ── Hub & Spoke Collections ────────────────────────────────
const SPOKE_TILTS = [-1.5, 1.2, -0.8, 1.8, -1.1]
const SPOKE_SHADOWS = [
  '-3px 5px 14px rgba(44,30,20,0.20), -4px 22px 52px -6px rgba(44,30,20,0.26)',
  '3px 5px 14px rgba(44,30,20,0.20), 4px 22px 52px -6px rgba(44,30,20,0.26)',
  '-2px 5px 14px rgba(44,30,20,0.20), -3px 22px 52px -6px rgba(44,30,20,0.26)',
  '4px 5px 14px rgba(44,30,20,0.20), 5px 22px 52px -6px rgba(44,30,20,0.26)',
  '-3px 5px 14px rgba(44,30,20,0.20), -4px 22px 52px -6px rgba(44,30,20,0.26)',
]

function SpokeHubSection({ allStays }: { allStays: NormalizedStay[] }) {
  // Derive real per-spoke counts from allStays — no new DB queries
  const spokeLiveStats = useMemo(() => {
    const map = new Map<string, { count: number; states: number }>()
    for (const slug of SPOKE_SLUGS) {
      const matched = slug === 'unique'
        ? allStays
        : allStays.filter((s) => s.spokes?.includes(slug))
      map.set(slug, {
        count: matched.length,
        states: new Set(matched.map((s) => s.state)).size,
      })
    }
    return map
  }, [allStays])
  return (
    <section className="py-20" style={{ background: 'oklch(0.22 0.01 60)' }} data-dark-section>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 fade-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: 'oklch(0.99 0.005 85 / 0.18)' }} />
            <span
              className="stamp-badge"
              style={{ color: 'oklch(0.72 0.10 40)', borderColor: 'oklch(0.72 0.10 40)', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '5px 16px' }}
            >
              Five Collections
            </span>
            <div className="flex-1 h-px" style={{ background: 'oklch(0.99 0.005 85 / 0.18)' }} />
          </div>
          <p
            className="text-sm text-center max-w-md mx-auto"
            style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.7 }}
          >
            Some travelers know exactly what they need. A desk, strong wifi, no distractions.
            Some know only that they need to go somewhere with the dog.
            These are for both of them.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 py-4 items-stretch">
          {SPOKES.map((spoke, i) => (
            <Link key={spoke.slug} href={`/${spoke.slug}`} className="block h-full">
              <motion.div
                className="group cursor-pointer flex flex-col h-full"
                initial={{ opacity: 0, y: 24, rotate: SPOKE_TILTS[i] }}
                whileInView={{ opacity: 1, y: 0, rotate: SPOKE_TILTS[i] }}
                viewport={{ once: true, margin: '-60px' }}
                whileHover={{ y: -10, rotate: 0, boxShadow: '0 28px 64px -8px rgba(0,0,0,0.55)' }}
                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: i * 0.08 }}
                style={{
                  padding: '9px 9px 28px 9px',
                  borderRadius: '3px',
                  background: 'oklch(0.98 0.010 85)',
                  border: '1px solid oklch(0.78 0.025 75)',
                  boxShadow: SPOKE_SHADOWS[i],
                }}
                data-cursor="view"
              >
                {/* Photo */}
                <div className="relative h-52 overflow-hidden flex-shrink-0" style={{ borderRadius: '1px' }}>
                  <Image
                    src={spoke.heroImage}
                    alt={spoke.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}
                  />
                </div>

                {/* Caption — ruled lines via polaroid-caption */}
                <div className="polaroid-caption relative pt-3 px-1 flex flex-col flex-1">
                  {/* Globe watermark — bottom-right postcard stamp */}
                  <div
                    className="absolute bottom-1 right-1 pointer-events-none select-none"
                    style={{ opacity: 0.07, color: 'oklch(0.30 0.06 50)' }}
                    aria-hidden="true"
                  >
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="1"/>
                      <path d="M4 24 Q13 19 22 24 Q31 29 40 24 Q49 19 58 24" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M4 32 Q13 27 22 32 Q31 37 40 32 Q49 27 58 32" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M4 40 Q13 35 22 40 Q31 45 40 40 Q49 35 58 40" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                  <div className="relative flex flex-col flex-1" style={{ zIndex: 1 }}>
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      Collection
                    </p>
                    <h3
                      className="font-bold leading-tight mb-1"
                      style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)', fontSize: '1rem' }}
                    >
                      {spoke.title}
                    </h3>
                    <p
                      className="text-[11px] leading-snug mb-2.5 flex-1"
                      style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {spoke.tagline}
                    </p>
                    <div className="flex items-center justify-between mt-auto" style={{ paddingBottom: '6px' }}>
                      <div className="flex gap-3">
                        {(spoke.slug === 'unique'
                          ? [
                              { value: `${spokeLiveStats.get(spoke.slug)?.count ?? 0}+`, label: spoke.stats[0].label },
                              { value: `${spokeLiveStats.get(spoke.slug)?.states ?? 0}`, label: spoke.stats[1].label },
                            ]
                          : [
                              { value: `${spokeLiveStats.get(spoke.slug)?.count ?? 0}+`, label: spoke.stats[0].label },
                              { value: `${spokeLiveStats.get(spoke.slug)?.states ?? 0}`, label: spoke.stats[1].label },
                            ]
                        ).map((stat, j) => (
                          <div key={j}>
                            <div className="text-sm font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.30 0.02 60)' }}>
                              {stat.value}
                            </div>
                            <div className="text-[10px]" style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                      <motion.span
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        whileHover={{ gap: '6px' }}
                      >
                        Explore <ArrowRight className="w-2.5 h-2.5" />
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10 fade-up">
          <p className="text-xs" style={{ color: 'oklch(0.48 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            workfriendlystays.com · stayswithpets.com · rvreadystays.com · evreadystays.com — all redirect here
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function HomeContent({
  featuredStays,
  editorsPickStays,
  filmstripStays,
  allStays,
  categories,
  totalCount,
}: HomeContentProps) {
  useClipReveal()

  const [newsletterDone, setNewsletterDone] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterError, setNewsletterError] = useState<string | null>(null)

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>

      {/* ══════════════════════════════════════════════════════
          HERO — Cinematic slideshow · Ken Burns · Film strip
      ══════════════════════════════════════════════════════ */}
      <Hero
        categories={categories}
        stats={[
          { value: totalCount, suffix: '+', label: 'Curated Stays' },
          { value: 10, suffix: '', label: 'Unique Categories' },
          { value: 12000, suffix: '+', label: 'Weekly Readers' },
        ]}
      />

      {/* ══════════════════════════════════════════════════════
          01 — FEATURED STAYS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex items-stretch gap-6 mb-14 fade-up relative">
            <GhostNumber n="01" />
            <div className="flex-shrink-0 flex items-center relative z-10">
              <span
                className="font-bold leading-none select-none"
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'clamp(5rem, 10vw, 8rem)',
                  color: 'oklch(0.88 0.025 75)',
                  lineHeight: 1,
                }}
              >
                01
              </span>
            </div>
            <div
              className="w-px self-stretch relative z-10"
              style={{ background: 'oklch(0.88 0.025 75)' }}
            />
            <div className="flex flex-col justify-between py-1 flex-1 relative z-10">
              <div>
                <h2
                  className="font-bold leading-tight mb-2"
                  style={{
                    fontFamily: 'Fraunces, serif',
                    color: 'oklch(0.22 0.01 60)',
                    fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
                  }}
                >
                  This Week&apos;s Stays
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  The places we can&apos;t stop thinking about.
                </p>
              </div>
              <Link href="/collection">
                <motion.button
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 border-2 text-sm font-semibold self-start"
                  style={{
                    borderRadius: '2px',
                    borderColor: 'oklch(0.55 0.14 38)',
                    color: 'oklch(0.55 0.14 38)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                  whileHover={{
                    background: 'oklch(0.55 0.14 38)',
                    color: 'oklch(0.99 0.005 85)',
                  }}
                  transition={{ duration: 0.18 }}
                >
                  Browse Everything <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Asymmetric grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {/* Large featured card */}
            <div className="lg:col-span-2 fade-up" style={{ transitionDelay: '80ms' }}>
              {featuredStays[0] && (
                <a
                  href={featuredStays[0].affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="group block"
                  data-cursor="view"
                >
                  <motion.div
                    className="relative overflow-hidden"
                    style={{ height: '500px', borderRadius: '3px' }}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
                    <Image
                      src={featuredStays[0].imageUrl}
                      alt={featuredStays[0].title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/15 to-transparent" />
                    <div className="absolute top-5 left-5 flex gap-2">
                      <span
                        className="stamp-badge"
                        style={{
                          background: 'oklch(0.55 0.14 38)',
                          color: 'oklch(0.99 0.005 85)',
                          borderColor: 'oklch(0.72 0.10 40)',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}
                      >
                        ✦ Editor&apos;s Pick
                      </span>
                      <span
                        className="stamp-badge"
                        style={{ background: '#FFE4DE', color: '#FF5A5F', borderColor: '#FF5A5F', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {featuredStays[0].platform}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-7">
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: 'oklch(0.85 0.10 45)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {featuredStays[0].category} · {featuredStays[0].state}
                      </p>
                      <h3
                        className="text-3xl font-bold text-white mb-2 leading-tight"
                        style={{ fontFamily: 'Fraunces, serif' }}
                      >
                        {featuredStays[0].title}
                      </h3>
                      <p
                        className="text-sm text-white/70 mb-5 line-clamp-2 max-w-lg"
                        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {featuredStays[0].description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Fraunces, serif' }}>
                            ${featuredStays[0].price}
                          </span>
                          <span className="text-white/55 text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            / night
                          </span>
                        </div>
                        <motion.span
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                          style={{
                            background: 'oklch(0.55 0.14 38)',
                            color: 'oklch(0.99 0.005 85)',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                          }}
                          whileHover={{ gap: '12px', paddingRight: '20px' }}
                          transition={{ duration: 0.2 }}
                        >
                          Take Me There <ArrowRight className="w-4 h-4" />
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                </a>
              )}
            </div>

            {/* Right column — two stacked cards */}
            <div className="flex flex-col gap-7">
              {featuredStays.slice(1, 3).map((stay, i) => (
                <div key={stay.id} className="fade-up" style={{ transitionDelay: `${180 + i * 100}ms` }}>
                  <StayCard stay={stay} href={stay.affiliateUrl} external index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          EDITORIAL MANIFESTO
      ══════════════════════════════════════════════════════ */}
      <section
        className="py-28 overflow-hidden grain-overlay"
        style={{ background: 'oklch(0.38 0.09 155)' }}
        data-dark-section
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className="mb-4"
              >
                <span
                  className="stamp-badge"
                  style={{ color: 'oklch(0.72 0.10 40)', borderColor: 'oklch(0.72 0.10 40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Our Editorial Philosophy
                </span>
              </motion.div>

              <h2
                className="font-bold"
                style={{
                  fontFamily: 'Fraunces, serif',
                  color: 'oklch(0.99 0.005 85)',
                  fontSize: 'clamp(3.2rem, 7vw, 6rem)',
                  lineHeight: 1.0,
                }}
              >
                {['We', 'don\'t', 'list', 'hotels.', 'We', 'find'].map((word, i) => (
                  <motion.span
                    key={i}
                    style={{ display: 'inline-block', marginRight: '0.22em' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                  >
                    {word}
                  </motion.span>
                ))}
                <br />
                <motion.span
                  style={{ display: 'inline-block', color: 'oklch(0.85 0.10 45)', fontStyle: 'italic' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                >
                  the unforgettable.
                </motion.span>
              </h2>

              <motion.p
                className="text-base leading-loose mt-8 max-w-md"
                style={{
                  color: 'oklch(0.80 0.04 155)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  lineHeight: 1.85,
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                There&apos;s a treehouse in Oregon where the wind stays up in the canopy
                and the ground is almost completely still. That particular quiet —
                the kind you can&apos;t manufacture — is what we spend our time looking
                for. The places that don&apos;t perform for the camera. The ones that
                earn your presence before you&apos;ve even unpacked.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: 1.05 }}
                className="mt-10"
              >
                <Link href="/about">
                  <motion.span
                    className="inline-flex items-center gap-2 text-sm font-semibold"
                    style={{
                      color: 'oklch(0.72 0.10 40)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      borderBottom: '1px solid oklch(0.72 0.10 40 / 0.4)',
                      paddingBottom: '2px',
                    }}
                    whileHover={{ gap: '12px' }}
                    transition={{ duration: 0.2 }}
                  >
                    Read our approach <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </Link>
              </motion.div>
            </div>

            {/* Right — postcard stack with drop animation */}
            <div className="lg:col-span-5 relative flex justify-center items-center" style={{ minHeight: '720px' }}>
              <div
                className="absolute select-none pointer-events-none"
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)',
                  color: 'oklch(0.99 0.005 85)',
                  opacity: 0.06,
                  transform: 'rotate(-12deg)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                  zIndex: 0,
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}
              >
                Greetings from
                <br />
                somewhere extraordinary
              </div>

              <motion.div
                className="absolute overflow-hidden shadow-2xl"
                style={{
                  width: '88%',
                  maxWidth: 420,
                  borderRadius: '3px',
                  top: '2%',
                  right: '2%',
                  zIndex: 1,
                }}
                initial={{ y: -100, rotate: -3, opacity: 0 }}
                whileInView={{ y: 0, rotate: -8, opacity: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.15 }}
              >
                <Image
                  src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/hero-dome-fNq53JMSCre9pYDm759BF5.webp"
                  alt="Desert dome"
                  width={420}
                  height={288}
                  className="w-full h-72 object-cover"
                />
                <div className="px-4 py-3" style={{ background: 'oklch(0.99 0.005 85)' }}>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: '0.75rem', color: 'oklch(0.35 0.02 60)', fontStyle: 'italic' }}>
                    Desert dome — Joshua Tree, CA
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="relative overflow-hidden shadow-2xl"
                style={{
                  width: '90%',
                  maxWidth: 440,
                  borderRadius: '3px',
                  border: '10px solid oklch(0.99 0.005 85)',
                  zIndex: 2,
                  marginTop: '200px',
                }}
                initial={{ y: -120, rotate: 2, opacity: 0 }}
                whileInView={{ y: 0, rotate: 5, opacity: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.3 }}
              >
                <Image
                  src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/hero-banner-mhiZ34LNJ6enqJKTL8o9M4.webp"
                  alt="Unique stays collage"
                  width={440}
                  height={320}
                  className="w-full h-80 object-cover"
                />
                <div className="px-4 py-3" style={{ background: 'oklch(0.99 0.005 85)' }}>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: '0.75rem', color: 'oklch(0.35 0.02 60)', fontStyle: 'italic' }}>
                    Old-growth forest — Arch Cape, OR
                  </p>
                </div>
                <motion.div
                  className="absolute top-4 right-4"
                  initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 280, damping: 18 }}
                >
                  <span
                    className="stamp-badge"
                    style={{
                      background: 'oklch(0.55 0.14 38)',
                      color: 'oklch(0.99 0.005 85)',
                      borderColor: 'oklch(0.72 0.10 40)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: '0.65rem',
                      padding: '4px 10px',
                    }}
                  >
                    {totalCount}+ stays found ✦
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          02 — EDITOR'S PICKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 fade-up flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative">
            <GhostNumber n="02" />
            <h2
              className="font-bold leading-none relative z-10"
              style={{
                fontFamily: 'Fraunces, serif',
                color: 'oklch(0.22 0.01 60)',
                fontSize: 'clamp(4rem, 10vw, 8rem)',
              }}
            >
              Editor&apos;s
              <br />
              <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>
                Picks.
              </span>
            </h2>
            <p
              className="text-sm max-w-xs pb-2 relative z-10"
              style={{
                color: 'oklch(0.50 0.03 60)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                lineHeight: 1.65,
              }}
            >
              Hand-reviewed by our team. Every one of these made us say{' '}
              <em>&ldquo;I need to go here.&rdquo;</em>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editorsPickStays.map((stay, i) => (
              <div
                key={stay.id}
                className="fade-up"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <StayCard stay={stay} href={stay.affiliateUrl} external index={i + 3} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORY SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: 'oklch(0.22 0.01 60)' }}
        data-dark-section
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 fade-up">
            <h2
              className="font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.93 0.025 75)', fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              Browse by type
            </h2>
            <Link href="/collection">
              <span
                className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: 'oklch(0.72 0.10 40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                All stays <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat, i) => {
              const palette = [
                { bg: 'oklch(0.55 0.14 38)', text: 'oklch(0.99 0.005 85)', count: 'oklch(0.85 0.10 45)' },
                { bg: 'oklch(0.38 0.09 155)', text: 'oklch(0.99 0.005 85)', count: 'oklch(0.72 0.12 155)' },
                { bg: 'oklch(0.30 0.01 60)',  text: 'oklch(0.93 0.025 75)', count: 'oklch(0.60 0.02 60)' },
                { bg: 'oklch(0.72 0.10 40)',  text: 'oklch(0.15 0.01 60)',  count: 'oklch(0.30 0.04 40)' },
                { bg: 'oklch(0.56 0.09 220)', text: 'oklch(0.99 0.005 85)', count: 'oklch(0.82 0.06 220)' },
                { bg: 'oklch(0.30 0.01 60)',  text: 'oklch(0.93 0.025 75)', count: 'oklch(0.60 0.02 60)' },
                { bg: 'oklch(0.52 0.08 155)', text: 'oklch(0.99 0.005 85)', count: 'oklch(0.80 0.06 155)' },
                { bg: 'oklch(0.55 0.14 38)',  text: 'oklch(0.99 0.005 85)', count: 'oklch(0.85 0.10 45)' },
                { bg: 'oklch(0.88 0.04 75)',  text: 'oklch(0.22 0.01 60)',  count: 'oklch(0.50 0.03 60)' },
                { bg: 'oklch(0.38 0.09 155)', text: 'oklch(0.99 0.005 85)', count: 'oklch(0.72 0.12 155)' },
              ][i % 10]
              return (
                <Link key={cat.id} href={`/collection?category=${encodeURIComponent(cat.id)}`} className="block">
                  <motion.div
                    className="fade-up cursor-pointer flex flex-col justify-between p-5"
                    style={{
                      background: palette.bg,
                      borderRadius: '3px',
                      aspectRatio: '5 / 2',
                      transitionDelay: `${i * 60}ms`,
                    }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    data-cursor="view"
                  >
                    <div className="text-3xl">{cat.emoji}</div>
                    <div>
                      <div className="font-bold mb-1 text-lg leading-tight" style={{ fontFamily: 'Fraunces, serif', color: palette.text }}>
                        {cat.label}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: palette.count, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        {cat.count} stays
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HUB & SPOKE COLLECTIONS
      ══════════════════════════════════════════════════════ */}
      <SpokeHubSection allStays={allStays} />

      {/* ══════════════════════════════════════════════════════
          03 — FILMSTRIP
      ══════════════════════════════════════════════════════ */}
      <FilmstripSection stays={filmstripStays} />

      {/* ══════════════════════════════════════════════════════
          PLATFORM LOGOS
      ══════════════════════════════════════════════════════ */}
      <section
        className="py-12 border-y border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.99 0.005 85)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className="text-center text-xs font-bold uppercase tracking-widest mb-8"
            style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            We curate stays from
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">
            {[
              { name: 'Airbnb', color: '#FF5A5F', desc: 'Unique homes & experiences' },
              { name: 'VRBO', color: '#1B5E9E', desc: 'Vacation rentals by owner' },
              { name: 'Wander', color: '#2E7D32', desc: 'Smart vacation homes' },
              { name: 'Direct', color: 'oklch(0.55 0.14 38)', desc: 'Owner direct bookings' },
            ].map((p) => (
              <div key={p.name} className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Fraunces, serif', color: p.color }}>
                  {p.name}
                </div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NEWSLETTER
      ══════════════════════════════════════════════════════ */}
      <section
        id="newsletter"
        className="py-24 relative overflow-hidden grain-overlay"
        style={{ background: 'oklch(0.33 0.10 38)' }}
        data-dark-section
      >
        <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6">
          <div className="fade-up">
            <h2
              className="font-bold mb-4 text-left"
              style={{
                fontFamily: 'Fraunces, serif',
                color: 'oklch(0.99 0.005 85)',
                lineHeight: 1.05,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
              }}
            >
              The Weekly
              <br />
              <span style={{ fontStyle: 'italic', color: 'oklch(0.85 0.10 45)' }}>
                Wanderer.
              </span>
            </h2>
            <p
              className="text-base mb-8 text-left"
              style={{ color: 'oklch(0.78 0.06 42)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              New extraordinary stays in your inbox every Tuesday.
            </p>

            {newsletterDone ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex items-center gap-3 py-4"
              >
                <CheckCircle2
                  className="w-6 h-6 flex-shrink-0"
                  style={{ color: 'oklch(0.72 0.10 40)' }}
                />
                <div>
                  <p
                    className="font-bold text-base"
                    style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}
                  >
                    You&apos;re on the list.
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: 'oklch(0.75 0.05 40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    First issue arrives next Tuesday.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form
                className="flex flex-col sm:flex-row gap-3"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setNewsletterError(null)
                  setNewsletterLoading(true)
                  const formData = new FormData(e.currentTarget)
                  const email = formData.get('email') as string
                  try {
                    const res = await fetch('/api/newsletter', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-POSTHOG-DISTINCT-ID': (await getPostHog()).get_distinct_id(),
                      },
                      body: JSON.stringify({ email }),
                    })
                    if (!res.ok) {
                      const data = await res.json()
                      setNewsletterError(data.error || 'Something went wrong')
                      return
                    }
                    setNewsletterDone(true)
                    const ph = await getPostHog()
                    ph.identify(email, { email })
                    ph.capture('newsletter_subscribed', { source: 'homepage' })
                  } catch {
                    setNewsletterError('Network error. Please try again.')
                  } finally {
                    setNewsletterLoading(false)
                  }
                }}
              >
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  disabled={newsletterLoading}
                  className="flex-1 px-4 py-3 text-sm outline-none focus:ring-2"
                  style={{
                    background: 'oklch(0.26 0.07 38)',
                    color: 'oklch(0.93 0.025 75)',
                    border: '1.5px solid oklch(0.45 0.10 38)',
                    borderRadius: '3px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  } as React.CSSProperties}
                />
                <motion.button
                  type="submit"
                  disabled={newsletterLoading}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-wider flex-shrink-0 disabled:opacity-60"
                  style={{
                    background: 'oklch(0.85 0.10 45)',
                    color: 'oklch(0.22 0.01 60)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    borderRadius: '3px',
                    letterSpacing: '0.1em',
                    fontSize: '0.7rem',
                  }}
                  whileHover={newsletterLoading ? undefined : { scale: 1.02 }}
                  whileTap={newsletterLoading ? undefined : { scale: 0.98 }}
                >
                  {newsletterLoading ? 'Subscribing...' : 'Send Me Picks'}
                </motion.button>
                {newsletterError && (
                  <p
                    className="text-xs sm:col-span-2"
                    style={{ color: 'oklch(0.75 0.12 25)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {newsletterError}
                  </p>
                )}
              </form>
            )}

            <p
              className="text-xs mt-4"
              style={{ color: 'oklch(0.65 0.05 40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              12,000+ subscribers. New picks every Tuesday. Bail anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CORKBOARD TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <CorkboardTestimonials />

      {/* ══════════════════════════════════════════════════════
          ABOUT TEASER
      ══════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="fade-up">
              <h2
                className="font-bold mb-6"
                style={{
                  fontFamily: 'Fraunces, serif',
                  color: 'oklch(0.22 0.01 60)',
                  fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                  lineHeight: 1.05,
                }}
              >
                Built by travelers,
                <br />
                <span style={{ fontStyle: 'italic', color: 'oklch(0.38 0.09 155)' }}>
                  for dreamers.
                </span>
              </h2>
              <div className="mb-5">
                <span
                  className="stamp-badge"
                  style={{
                    color: 'oklch(0.55 0.14 38)',
                    borderColor: 'oklch(0.55 0.14 38)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  Est. 2024
                </span>
              </div>
              <p
                className="text-base leading-relaxed mb-5"
                style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                We&apos;re a small team of obsessive travelers who got tired of
                scrolling through thousands of ordinary listings to find the one
                worth remembering. So we built the directory we always wanted.
              </p>
              <p
                className="text-base leading-relaxed mb-8"
                style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Every stay in our directory has been personally reviewed. When
                you book through our links, we earn a small affiliate commission
                that keeps this site running.
              </p>
              <Link href="/about">
                <motion.button
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
                  style={{
                    background: 'oklch(0.38 0.09 155)',
                    color: 'oklch(0.99 0.005 85)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                  whileHover={{ gap: '12px', paddingRight: '20px' }}
                  transition={{ duration: 0.2 }}
                >
                  How We Pick Them <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            <div className="fade-up relative" style={{ transitionDelay: '150ms' }}>
              <div className="relative h-96">
                <motion.div
                  className="absolute top-0 right-0 w-4/5 h-64 overflow-hidden shadow-xl"
                  style={{ borderRadius: '3px' }}
                  initial={{ rotate: 2, opacity: 0, y: 20 }}
                  whileInView={{ rotate: 5, opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.1 }}
                >
                  <Image
                    src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/hero-dome-fNq53JMSCre9pYDm759BF5.webp"
                    alt="Desert dome glamping"
                    fill
                    sizes="(max-width: 1024px) 80vw, 40vw"
                    className="object-cover"
                  />
                </motion.div>
                <motion.div
                  className="absolute bottom-0 left-0 w-3/5 h-52 overflow-hidden shadow-xl border-[10px] border-white"
                  style={{ borderRadius: '3px' }}
                  initial={{ rotate: 0, opacity: 0, y: 20 }}
                  whileInView={{ rotate: -4, opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.25 }}
                >
                  <Image
                    src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/hero-houseboat-6e6D3bBeEjwZSSmSxByNAZ.webp"
                    alt="Houseboat on autumn lake"
                    fill
                    sizes="(max-width: 1024px) 60vw, 30vw"
                    className="object-cover"
                  />
                </motion.div>
                <motion.div
                  className="absolute top-1/2 left-1/2 z-10 shadow-lg"
                  initial={{ opacity: 0, scale: 0.7, rotate: -14 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: -10 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.45 }}
                  style={{ transform: 'translate(-50%, -50%) rotate(-10deg)', whiteSpace: 'nowrap' }}
                >
                  <span
                    className="stamp-badge"
                    style={{
                      background: 'oklch(0.55 0.14 38)',
                      color: 'oklch(0.99 0.005 85)',
                      borderColor: 'oklch(0.72 0.10 40)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: '0.7rem',
                      padding: '6px 14px',
                      letterSpacing: '0.14em',
                    }}
                  >
                    {totalCount}+ stays & counting ✦
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
