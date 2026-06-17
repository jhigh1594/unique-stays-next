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

/* ─── Stats counter ─── */

function StatsBar() {
  const stats = [
    { value: '352', label: 'curated stays' },
    { value: '50', label: 'states covered' },
    { value: '5', label: 'stay categories' },
    { value: '0', label: 'paid placements' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
        >
          <div
            className="text-4xl md:text-5xl font-bold mb-1"
            style={{ fontFamily: FONT.display, color: C.terra }}
          >
            {stat.value}
          </div>
          <div
            className="text-sm"
            style={{ fontFamily: FONT.body, color: C.muted }}
          >
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Belief data ─── */

const BELIEFS = [
  {
    icon: '◉',
    title: 'Extraordinary is a category of one.',
    body: 'A treehouse in Oregon and a fire tower in New Mexico have nothing in common except this: you\'ll remember both.',
  },
  {
    icon: '◎',
    title: 'The best places are hard to find.',
    body: 'That\'s by accident, not design. The extraordinary stays are buried behind hundreds of generic ones. We do the digging.',
  },
  {
    icon: '◈',
    title: 'A directory should have taste.',
    body: 'We say no to fine places all the time. Thousands of them. The discipline to leave things out is what makes the collection mean something.',
  },
  {
    icon: '◇',
    title: 'You should pay the same price we do.',
    body: 'No booking fees. No pay-for-placement. No property owners paying to appear. Click through and book direct.',
  },
]

/* ─── Main ─── */

export default function AboutContent() {
  useClipReveal()

  return (
    <div className="min-h-screen" style={{ background: C.cream }}>
      {/* ── I. The Moment ── */}
      <section className="pt-32 pb-24 relative overflow-hidden" style={{ background: C.sand }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <span
                className="stamp-badge mb-6 inline-block"
                style={{ color: C.terra, borderColor: C.terra }}
              >
                Field Report / Est. 2026
              </span>

              <h1
                className="text-5xl md:text-6xl font-bold leading-tight mb-8 fade-up"
                style={{ fontFamily: FONT.display, color: C.ink }}
              >
                This started with a treehouse.
              </h1>

              <p
                className="text-lg leading-relaxed mb-5 fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                Oregon, somewhere past Silverton. Forty feet up in a stand of Douglas fir. The host
                had built the staircase himself, each plank a different width because he&rsquo;d cut
                them by hand. The railing was driftwood he&rsquo;d carried from the coast piece by
                piece.
              </p>

              <p
                className="text-base leading-relaxed mb-5 fade-up"
                style={{ color: C.muted, fontFamily: FONT.body }}
              >
                The wind moved through the canopy but never quite reached the platform. A kind of
                quiet I&rsquo;d forgotten existed.
              </p>

              <p
                className="text-lg leading-relaxed mb-5 fade-up"
                style={{ fontFamily: FONT.display, color: C.ink, fontStyle: 'italic' }}
              >
                I lay there thinking this is what a weekend is supposed to feel like.
              </p>

              <p
                className="text-base leading-relaxed fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                Three months later I tried to find another one. Instead I scrolled through
                cookie-cutter after cookie-cutter. The same cabin with the same
                &ldquo;Live, Laugh, Love&rdquo; sign, the same generic cozy retreat in every state,
                blurring together until I couldn&rsquo;t tell if I&rsquo;d already seen this one.
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
            text="Fine is the enemy."
            className="text-3xl md:text-4xl font-bold leading-snug mb-10"
            style={{ fontFamily: FONT.display, color: C.terra }}
          />

          <motion.p
            className="text-lg leading-relaxed mb-6"
            style={{ color: C.cream80, fontFamily: FONT.body }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            You find one extraordinary place and the algorithm promises more like it. Instead:
            page after page of the same white-on-white cozy retreat, the same sheepskin on the same
            accent chair, the same word &ldquo;charming&rdquo; in every title until the word
            loses meaning.
          </motion.p>

          <motion.p
            className="text-lg leading-relaxed mb-8"
            style={{ color: C.cream80, fontFamily: FONT.body }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            I&rsquo;d scroll through hundreds on a Sunday afternoon and book whatever was left.
            Then I&rsquo;d show up and think: this could be a Holiday Inn with better lighting.
          </motion.p>

          <motion.p
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: FONT.display, color: C.light }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            The extraordinary places were there.
            <br />
            They were just buried on page six.
          </motion.p>
        </div>
      </section>

      {/* ── III. The Work ── */}
      <section className="py-24 relative overflow-hidden">
        <GhostNumber n="III" />

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto mb-16">
            <span
              className="stamp-badge mb-6 inline-block"
              style={{ color: C.terra, borderColor: C.terra }}
            >
              The Work
            </span>

            <h2
              className="text-4xl md:text-5xl font-bold leading-tight mb-8 fade-up"
              style={{ fontFamily: FONT.display, color: C.ink }}
            >
              A spreadsheet became an obsession.
            </h2>

            <motion.p
              className="text-lg leading-relaxed mb-6"
              style={{ color: C.bodyText, fontFamily: FONT.body }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8 }}
            >
              A converted barn in upstate New York with a handmade iron bed frame and exposed beams
              that were actually old. A fire tower in the Southwest someone spent two years restoring
              by hand. A cave dwelling where the light turned everything amber at four in the
              afternoon.
            </motion.p>

            <motion.p
              className="text-lg leading-relaxed mb-6"
              style={{ color: C.bodyText, fontFamily: FONT.body }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              These places existed. I kept finding them, buried on page six. I started a spreadsheet:
              URL, location, one sentence about what made each one different. Friends saw it and
              started asking where to go. A friend texted on a Thursday looking for Vermont that
              weekend and I had an answer in three minutes because I&rsquo;d already looked at every
              listing in the state.
            </motion.p>

            <motion.p
              className="text-xl font-bold mb-8"
              style={{ fontFamily: FONT.display, color: C.terra }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              That&rsquo;s when the spreadsheet stopped being a spreadsheet.
            </motion.p>
          </div>

          {/* Stats */}
          <StatsBar />

          {/* How we curate */}
          <div className="max-w-3xl mx-auto mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'We search.',
                  body: 'Airbnb, VRBO, Wander, direct booking sites. We read the reviews. Study the photos. Check the map.',
                },
                {
                  step: '02',
                  title: 'We verify.',
                  body: 'We\'ve spent an hour on a listing before realizing the photos were hiding a parking lot two feet from the "secluded" deck.',
                },
                {
                  step: '03',
                  title: 'We curate.',
                  body: 'Every stay passes one test: does it make us stop scrolling? Stays come down when they stop being great.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="p-8 rounded-2xl relative"
                  style={{
                    background: C.light,
                    border: '1.5px solid oklch(0.88 0.025 75)',
                    transform: `rotate(${[1, -0.5, 1.5][i]}deg)`,
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

            <motion.p
              className="text-center mt-10 text-base font-semibold"
              style={{ fontFamily: FONT.display, color: C.ink, fontStyle: 'italic' }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              We looked at thousands. 352 made the cut. That&rsquo;s the discipline.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── IV. What We Believe ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: C.sand }}>
        <GhostNumber n="IV" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-14 fade-up">
            <span
              className="stamp-badge mb-6 inline-block"
              style={{ color: C.terra, borderColor: C.terra }}
            >
              What We Believe
            </span>

            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: FONT.display, color: C.ink }}
            >
              The principles behind the list.
            </h2>

            <p
              className="text-base max-w-xl"
              style={{ color: C.muted, fontFamily: FONT.body }}
            >
              Five collections grew from real trips. The work trip where we needed reliable internet
              and found a yurt with fiber. The weekend we couldn&rsquo;t bring the dog because we
              couldn&rsquo;t find a single place that meant it when they said &ldquo;pet-friendly.&rdquo;
            </p>
          </div>

          {/* Beliefs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {BELIEFS.map((belief, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <div
                  className="text-2xl mb-3"
                  style={{ color: C.terra }}
                >
                  {belief.icon}
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ fontFamily: FONT.display, color: C.ink }}
                >
                  {belief.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: C.bodyText, fontFamily: FONT.body }}
                >
                  {belief.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Collections summary */}
          <motion.div
            className="mt-14 pt-10 border-t"
            style={{ borderColor: 'oklch(0.85 0.02 75)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p
              className="text-sm mb-6"
              style={{ color: C.muted, fontFamily: FONT.body }}
            >
              Five collections, one standard:
            </p>
            <div className="flex flex-wrap gap-3">
              {['Unique', 'Work-friendly', 'Pet-friendly', 'RV-ready', 'EV-ready'].map((name) => (
                <Link key={name} href={`/${name.toLowerCase()}`}>
                  <span
                    className="stamp-badge cursor-pointer transition-transform hover:scale-105"
                    style={{ color: C.terra, borderColor: C.terra }}
                  >
                    {name}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── V. The Invitation ── */}
      <section
        className="py-28 relative overflow-hidden grain-overlay"
        style={{ background: C.terra }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.p
            className="text-sm uppercase tracking-widest mb-6"
            style={{ fontFamily: FONT.body, color: C.cream80, letterSpacing: '0.15em' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            352 stays across all 50 states
          </motion.p>

          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: FONT.display, color: C.light }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            The treehouse is in here.
          </motion.h2>

          <motion.p
            className="text-lg mb-10"
            style={{ color: C.cream80, fontFamily: FONT.body, lineHeight: 1.7 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            That treehouse in Oregon. The barn with the window seat. The fire tower. The cave.
            And a few hundred more that made us stop scrolling.
          </motion.p>

          <motion.p
            className="text-xl mb-10"
            style={{ fontFamily: FONT.display, color: C.light, fontStyle: 'italic' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Now you don&rsquo;t have to scroll to page six to find them.
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                Explore the collection <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>

            <Link href="/vacation-quiz">
              <motion.button
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
                style={{
                  background: 'transparent',
                  color: C.light,
                  fontFamily: FONT.body,
                  border: `1.5px solid oklch(0.99 0.005 85 / 0.4)`,
                }}
                whileHover={{ scale: 1.03, borderColor: C.light }}
                transition={{ duration: 0.2 }}
              >
                Take the 60-second quiz
              </motion.button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
