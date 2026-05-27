'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef, useEffect, useMemo } from 'react'

/* ─── Colors ─── */

const C = {
  cream: 'oklch(0.975 0.012 85)',
  sand: 'oklch(0.93 0.025 75)',
  forest: 'oklch(0.38 0.09 155)',
  terra: 'oklch(0.55 0.14 38)',
  ink: 'oklch(0.22 0.01 60)',
  muted: 'oklch(0.45 0.03 60)',
  bodyText: 'oklch(0.40 0.03 60)',
  lightMuted: 'oklch(0.55 0.03 60)',
  light: 'oklch(0.99 0.005 85)',
  cream80: 'oklch(0.85 0.02 85)',
} as const

const FONT = {
  display: 'Fraunces, serif',
  body: 'Plus Jakarta Sans, sans-serif',
  hand: 'Caveat, cursive',
} as const

/* ─── Ghost Number ─── */

function GhostNumber({ n, light = false }: { n: string; light?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute select-none pointer-events-none leading-none"
      style={{
        fontSize: 'clamp(8rem, 18vw, 15rem)',
        color: light ? C.light : C.ink,
        opacity: light ? 0.05 : 0.04,
        bottom: '-0.1em',
        left: '-0.04em',
        lineHeight: 1,
        fontFamily: FONT.display,
        fontWeight: 900,
        zIndex: 0,
      }}
    >
      {n}
    </span>
  )
}

/* ─── Fade-up observer ─── */

function useClipReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
    )
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/* ─── Word-by-word reveal ─── */

function WordReveal({
  text,
  className,
  style,
}: {
  text: string
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const words = useMemo(() => text.split(' '), [text])

  return (
    <div ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden" style={{ marginRight: '0.3em' }}>
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={inView ? { y: '0%', opacity: 1 } : {}}
            transition={{
              duration: 0.5,
              delay: i * 0.04,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  )
}

/* ─── Spoke data ─── */

const SPOKES = [
  { name: 'Unique', desc: 'Treehouses, fire towers, caves. Places that exist once.' },
  {
    name: 'Work-friendly',
    desc: 'Reliable wifi, a proper desk, and a door that closes. For the people who take calls from a yurt.',
  },
  {
    name: 'Pet-friendly',
    desc: 'Your dog comes. No fine print, no arguing with a host at check-in.',
  },
  { name: 'RV-ready', desc: 'Hookup, access, and a spot worth the drive.' },
  { name: 'EV-ready', desc: 'Charge when you arrive. Not when you get home.' },
]

/* ─── Step cards ─── */

const STEPS = [
  {
    step: '01',
    title: 'Browse the directory',
    body: 'Filter by category, region, or the kind of trip you need. Search by state or type.',
  },
  {
    step: '02',
    title: 'Find your wonder',
    body: 'Read the descriptions. See what makes each stay different. Every one passed our filter.',
  },
  {
    step: '03',
    title: 'Book and go',
    body: 'Click through to Airbnb, VRBO, Wander, or direct. You pay the same price either way.',
  },
]

const STEP_ROTATIONS = [1, -0.5, 1.5]

/* ─── Main ─── */

export default function AboutContent() {
  useClipReveal()

  return (
    <div className="min-h-screen" style={{ background: C.cream }}>
      {/* ── I. Hero ── */}
      <section className="pt-32 pb-20 relative overflow-hidden" style={{ background: C.sand }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <span
                className="stamp-badge mb-6 inline-block"
                style={{ color: C.terra, borderColor: C.terra }}
              >
                Field Report / Est. 2024
              </span>

              <h1
                className="text-5xl md:text-6xl font-bold leading-tight mb-6 fade-up"
                style={{ fontFamily: FONT.display, color: C.ink }}
              >
                This started with a treehouse.
              </h1>

              <p
                className="text-lg leading-relaxed mb-4 fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                There&rsquo;s a treehouse in Oregon where the wind stays up in the canopy and the
                ground is almost completely still. That particular quiet is what we spend our time
                looking for.
              </p>

              <p
                className="text-base leading-relaxed fade-up"
                style={{ color: C.muted, fontFamily: FONT.body }}
              >
                We got tired of losing weekends to the scroll, past three thousand forgettable
                listings, trying to find the one worth booking. So we started collecting.
              </p>
            </div>

            {/* Postcard stack */}
            <div className="relative h-[420px] hidden lg:block">
              <motion.div
                className="absolute top-0 right-0 w-4/5 h-72 rounded-2xl overflow-hidden shadow-xl"
                initial={{ y: -80, rotate: -5, opacity: 0 }}
                whileInView={{ y: 0, rotate: 3, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 160, damping: 16 }}
              >
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/stay-cave-DzUjvuyWRjdY2ijdYdCnYC.webp"
                  alt="Cave dwelling with amber light"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                className="absolute bottom-0 left-0 w-3/5 h-56 rounded-2xl overflow-hidden shadow-xl border-4 border-white"
                initial={{ y: -80, rotate: 2, opacity: 0 }}
                whileInView={{ y: 0, rotate: -2, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.15 }}
              >
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/stay-barn-JvwT2jj9bCD3f5FXSDQu76.webp"
                  alt="Converted barn with handmade details"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── II. The Problem ── */}
      <section
        className="py-28 relative overflow-hidden grain-overlay"
        style={{ background: C.forest }}
        data-dark-section
      >
        <GhostNumber n="II" light />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span
            className="stamp-badge mb-8 inline-block"
            style={{ color: C.light, borderColor: 'oklch(0.99 0.005 85 / 0.5)' }}
          >
            The Problem
          </span>

          <WordReveal
            text="You want something memorable. You open the app. Page after page of the same cozy retreat with the same IKEA lamp. Fine places. Clean places. Places you'll forget by next Tuesday."
            className="text-2xl md:text-3xl font-bold leading-snug mb-10"
            style={{ fontFamily: FONT.display, color: C.light }}
          />

          <motion.p
            className="text-lg leading-relaxed mb-10"
            style={{ color: C.cream80, fontFamily: FONT.body }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            But somewhere on page eleven, there&rsquo;s a converted barn with a handmade iron bed
            frame. A fire tower someone spent two years restoring by hand. A cave dwelling where the
            light comes through the rock at four in the afternoon and turns everything amber.
          </motion.p>

          <motion.p
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: FONT.display }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <span style={{ color: C.terra }}>Fine is the enemy.</span>{' '}
            <span style={{ color: C.light }}>We find what&rsquo;s buried.</span>
          </motion.p>
        </div>
      </section>

      {/* ── III. The Filter ── */}
      <section className="py-24 relative overflow-hidden">
        <GhostNumber n="III" />

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span
                className="stamp-badge mb-6 inline-block"
                style={{ color: C.terra, borderColor: C.terra }}
              >
                The Filter
              </span>

              <h2
                className="text-4xl md:text-5xl font-bold leading-tight mb-6 fade-up"
                style={{ fontFamily: FONT.display, color: C.ink }}
              >
                What makes the cut
              </h2>

              <div
                className="space-y-5 fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                <p
                  className="text-lg font-semibold"
                  style={{ fontFamily: FONT.display, color: C.ink }}
                >
                  Every stay passes one test: does it make us stop scrolling?
                </p>

                <p className="text-base leading-relaxed">
                  Not commission potential. Not platform popularity. Not whether it photographs well
                  from every angle. We look for architectural singularity. A setting that stops you
                  cold. Something you&rsquo;ll describe to friends.
                </p>

                <p className="text-base leading-relaxed">
                  We check Airbnb, VRBO, Wander, and direct booking sites. Read the reviews. Study
                  the photos. Look at the map. If a stay stops being great, it comes down.
                </p>

                <p
                  className="text-xl font-bold mt-8"
                  style={{ fontFamily: FONT.display, color: C.terra }}
                >
                  We looked at over ten thousand. Roughly four hundred made it.
                </p>
              </div>
            </div>

            {/* Polaroid */}
            <motion.div
              className="relative flex justify-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            >
              <div
                className="polaroid max-w-sm w-full relative"
                style={{ transform: 'rotate(-3deg)' }}
              >
                <div className="rounded-sm overflow-hidden">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/stay-cave-DzUjvuyWRjdY2ijdYdCnYC.webp"
                    alt="Cave dwelling where the light turns amber"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
                <div className="polaroid-caption pt-3 pb-1 px-1">
                  <p className="text-sm" style={{ fontFamily: FONT.hand, color: C.bodyText }}>
                    Where the light turns amber at 4pm
                  </p>
                </div>
                <span
                  className="stamp-badge absolute -bottom-3 -right-3"
                  style={{ color: C.terra, borderColor: C.terra, background: C.light }}
                >
                  Verified
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── IV. How It Works ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: C.sand }}>
        <GhostNumber n="IV" />

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14 fade-up">
            <span
              className="stamp-badge mb-4 inline-block"
              style={{ color: C.terra, borderColor: C.terra }}
            >
              Simple as it gets
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: FONT.display, color: C.ink }}
            >
              How It{' '}
              <span style={{ fontStyle: 'italic', color: C.terra }}>Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((item, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-2xl relative"
                style={{
                  background: C.light,
                  border: '1.5px solid oklch(0.88 0.025 75)',
                  transform: `rotate(${STEP_ROTATIONS[i]}deg)`,
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: FONT.display, color: C.terra, opacity: 0.2 }}
                >
                  {item.step}
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: FONT.display, color: C.ink }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: C.muted, fontFamily: FONT.body }}
                >
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>

          <p
            className="text-center mt-10 text-sm fade-up"
            style={{ color: C.lightMuted, fontFamily: FONT.body }}
          >
            No hidden fees. No pay-for-placement. No property owners paying to appear.
          </p>
        </div>
      </section>

      {/* ── V. Spokes ── */}
      <section className="py-24 relative overflow-hidden">
        <GhostNumber n="V" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-12 fade-up">
            <span
              className="stamp-badge mb-6 inline-block"
              style={{ color: C.terra, borderColor: C.terra }}
            >
              Five Collections
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: FONT.display, color: C.ink }}
            >
              For every kind of trip
            </h2>
            <p className="text-base" style={{ color: C.muted, fontFamily: FONT.body }}>
              Some travelers know exactly what they need. A desk, strong wifi, a door that closes.
              Others know only that the dog has to come.
            </p>
          </div>

          <div className="space-y-8">
            {SPOKES.map((spoke, i) => (
              <motion.div
                key={spoke.name}
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <span
                  className="stamp-badge flex-shrink-0 mt-1"
                  style={{ color: C.terra, borderColor: C.terra }}
                >
                  {spoke.name}
                </span>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: C.bodyText, fontFamily: FONT.body }}
                >
                  {spoke.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <p
            className="mt-10 text-base font-semibold fade-up"
            style={{ fontFamily: FONT.display, color: C.ink }}
          >
            Same standard, different need. Only the ones worth your time.
          </p>

          <p
            className="mt-8 text-base fade-up"
            style={{ color: C.muted, fontFamily: FONT.body }}
          >
            For longer reads between trips, the Journal is our field report.
          </p>
        </div>
      </section>

      {/* ── VI. Journal ── */}
      <section className="py-20 relative overflow-hidden" style={{ background: C.sand }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span
            className="stamp-badge mb-6 inline-block"
            style={{ color: C.terra, borderColor: C.terra }}
          >
            From the Dispatch Desk
          </span>

          <h2
            className="text-3xl md:text-4xl font-bold mb-4 fade-up"
            style={{ fontFamily: FONT.display, color: C.ink }}
          >
            The Journal
          </h2>

          <p
            className="text-base leading-relaxed mb-2 fade-up mx-auto"
            style={{
              color: C.muted,
              fontFamily: FONT.body,
              maxWidth: '480px',
            }}
          >
            Route guides, regional deep dives, and stories from the stays themselves. Written like a
            letter from someone who just got back.
          </p>

          <p
            className="text-sm fade-up"
            style={{ fontFamily: FONT.hand, color: C.lightMuted, fontSize: '1.1rem' }}
          >
            Pinned to the board as they arrive.
          </p>

          <motion.div className="mt-8" whileHover={{ gap: '12px' }} transition={{ duration: 0.2 }}>
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: C.terra, fontFamily: FONT.body }}
            >
              Read the Journal <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── VII. CTA ── */}
      <section
        className="py-24 relative overflow-hidden grain-overlay"
        style={{ background: C.terra }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: FONT.display, color: C.light }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            The treehouse is in here.
            <br />
            So are four hundred others.
          </motion.h2>

          <p
            className="text-base mb-8"
            style={{ color: C.cream80, fontFamily: FONT.body }}
          >
            Your next trip is waiting.
          </p>

          <Link href="/collection">
            <motion.button
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
              style={{
                background: C.light,
                color: C.terra,
                fontFamily: FONT.body,
              }}
              whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
              transition={{ duration: 0.2 }}
            >
              Explore the directory <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  )
}
