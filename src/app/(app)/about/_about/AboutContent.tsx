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
      {/* ── I. The Moment ── */}
      <section className="pt-32 pb-20 relative overflow-hidden" style={{ background: C.sand }}>
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
                className="text-5xl md:text-6xl font-bold leading-tight mb-6 fade-up"
                style={{ fontFamily: FONT.display, color: C.ink }}
              >
                This started with a treehouse.
              </h1>

              <p
                className="text-lg leading-relaxed mb-4 fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                Oregon, somewhere past Silverton. Forty feet up in a stand of Douglas fir. The host
                had built the staircase himself, each plank a different width because he&rsquo;d cut
                them by hand, and the railing was driftwood he&rsquo;d carried from the coast piece
                by piece.
              </p>

              <p
                className="text-base leading-relaxed mb-4 fade-up"
                style={{ color: C.muted, fontFamily: FONT.body }}
              >
                The wind moved through the canopy but never quite reached the platform, and the
                stillness up there felt like the trees were holding you. A kind of quiet
                I&rsquo;d forgotten existed.
              </p>

              <p
                className="text-base leading-relaxed mb-4 fade-up"
                style={{ fontFamily: FONT.display, color: C.ink, fontStyle: 'italic' }}
              >
                I lay there thinking this is what a weekend is supposed to feel like.
              </p>

              <p
                className="text-base leading-relaxed mb-4 fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                Three months later I tried to recreate that weekend. Another unforgettable stay,
                somewhere that would stop me cold the way that treehouse did. Instead I scrolled
                through cookie-cutter after cookie-cutter. The same cabin with a
                &ldquo;Live, Laugh, Love&rdquo; sign on the same wall, the same generic
                &ldquo;cozy retreat&rdquo; in every state, blurring together until I couldn&rsquo;t
                tell if I&rsquo;d already seen this one or not.
              </p>

              <p
                className="text-base leading-relaxed fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                I never set out to build a directory. I just wanted another weekend like that one.
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

      {/* ── II. The Frustration ── */}
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
            text="Then I went home and tried to find another one."
            className="text-2xl md:text-3xl font-bold leading-snug mb-10"
            style={{ fontFamily: FONT.display, color: C.light }}
          />

          <motion.p
            className="text-lg leading-relaxed mb-6"
            style={{ color: C.cream80, fontFamily: FONT.body }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            You find one extraordinary place and you figure the algorithm will show you more like it.
            That&rsquo;s the whole promise. But instead it&rsquo;s page after page of the same
            white-on-white cozy retreat with the same sheepskin draped over the same accent chair.
          </motion.p>

          <motion.p
            className="text-lg leading-relaxed mb-6"
            style={{ color: C.cream80, fontFamily: FONT.body }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Fine places. Clean places. Places you forget by next Tuesday. I&rsquo;d scroll through
            hundreds of them on a Sunday afternoon, worn out by page six, and book whatever was left.
            Then I&rsquo;d show up and think: this could be a Holiday Inn with better lighting.
          </motion.p>

          <motion.p
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: FONT.display }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <span style={{ color: C.terra }}>Fine is the enemy.</span>{' '}
            <span style={{ color: C.light }}>
              But fine is all the algorithm knows how to give you.
            </span>
          </motion.p>
        </div>
      </section>

      {/* ── III. The Discovery ── */}
      <section className="py-24 relative overflow-hidden">
        <GhostNumber n="III" />

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span
                className="stamp-badge mb-6 inline-block"
                style={{ color: C.terra, borderColor: C.terra }}
              >
                The Spark
              </span>

              <h2
                className="text-4xl md:text-5xl font-bold leading-tight mb-8 fade-up"
                style={{ fontFamily: FONT.display, color: C.ink }}
              >
                Page six. Four times.
              </h2>

              <div
                className="space-y-5 fade-up"
                style={{ color: C.bodyText, fontFamily: FONT.body }}
              >
                <p className="text-base leading-relaxed">
                  A converted barn in upstate New York with a handmade iron bed frame and exposed
                  beams that were actually old, not &ldquo;reclaimed&rdquo; from a warehouse sale.
                  A woodstove and a window seat where the morning light came in at an angle and
                  stayed for an hour.
                </p>

                <p className="text-base leading-relaxed">
                  A fire tower in the Southwest that someone spent two years restoring by hand. The
                  cabin at the top had a 360-degree view of canyon and sky and nothing else.
                </p>

                <p className="text-base leading-relaxed">
                  A cave dwelling where the light came through the rock at four in the afternoon and
                  turned everything amber.
                </p>

                <p
                  className="text-lg font-bold mt-6"
                  style={{ fontFamily: FONT.display, color: C.ink }}
                >
                  These places existed. They were just buried on page six behind hundreds of
                  listings with the word &ldquo;charming&rdquo; in the title.
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

      {/* ── IV. The Obsession ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: C.sand }}>
        <GhostNumber n="IV" />

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14 fade-up">
            <span
              className="stamp-badge mb-4 inline-block"
              style={{ color: C.terra, borderColor: C.terra }}
            >
              The List
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: FONT.display, color: C.ink }}
            >
              It started with a spreadsheet.
            </h2>
            <p
              className="text-base leading-relaxed max-w-xl mx-auto mb-2"
              style={{ color: C.muted, fontFamily: FONT.body }}
            >
              URL, location, one sentence about what made it different. Then a folder of saved
              photos, then a notes file with links and prices and reviews I&rsquo;d actually read
              all the way through.
            </p>
            <p
              className="text-base leading-relaxed max-w-xl mx-auto"
              style={{ color: C.muted, fontFamily: FONT.body }}
            >
              I showed it to friends. They said, &ldquo;How did you find this?&rdquo; Page six.
              Every time.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <motion.p
              className="text-lg leading-relaxed text-center mb-4"
              style={{ color: C.bodyText, fontFamily: FONT.body }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8 }}
            >
              Then a friend texted on a Thursday looking for a place in Vermont that weekend,
              something like that barn I&rsquo;d shown him. I had an answer in three minutes because
              I&rsquo;d already looked at every listing in the state.
            </motion.p>

            <motion.p
              className="text-lg leading-relaxed text-center mb-4"
              style={{ color: C.bodyText, fontFamily: FONT.body }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              A few more friends asked the same question over the next couple months.
            </motion.p>

            <motion.p
              className="text-xl font-bold text-center mt-6"
              style={{ fontFamily: FONT.display, color: C.terra }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              That&rsquo;s when the spreadsheet stopped being a spreadsheet.
            </motion.p>
          </div>

          {/* Step cards */}
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

      {/* ── V. The Standard ── */}
      <section className="py-24 relative overflow-hidden">
        <GhostNumber n="V" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-10 fade-up">
            <span
              className="stamp-badge mb-6 inline-block"
              style={{ color: C.terra, borderColor: C.terra }}
            >
              The Filter
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: FONT.display, color: C.ink }}
            >
              What makes the cut.
            </h2>
            <p
              className="text-lg font-semibold mb-6"
              style={{ fontFamily: FONT.display, color: C.ink }}
            >
              Every stay passes one test: does it make us stop scrolling?
            </p>
            <p className="text-base leading-relaxed mb-4" style={{ color: C.bodyText, fontFamily: FONT.body }}>
              We&rsquo;re looking for a place that doesn&rsquo;t look like every other place, with a
              setting that stops you cold and something you&rsquo;ll actually describe to friends
              afterward.
            </p>
            <p className="text-base leading-relaxed mb-4" style={{ color: C.bodyText, fontFamily: FONT.body }}>
              We check Airbnb, VRBO, Wander, and direct booking sites and read the reviews and study
              the photos and look at the map. We&rsquo;ve spent an hour on a listing before realizing
              the photos were hiding a parking lot two feet from the &ldquo;secluded&rdquo; deck, or
              a highway visible through the &ldquo;forest&rdquo; view. Stays come down when they stop
              being great.
            </p>
            <p
              className="text-xl font-bold mt-8"
              style={{ fontFamily: FONT.display, color: C.terra }}
            >
              We looked at thousands. A few hundred made it.
            </p>
            <p
              className="text-base mt-4"
              style={{ fontFamily: FONT.display, color: C.ink, fontStyle: 'italic' }}
            >
              That&rsquo;s the work. Finding the right ones and having the discipline to leave the
              rest.
            </p>
          </div>
        </div>
      </section>

      {/* ── VI. The Collection ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: C.sand }}>
        <GhostNumber n="VI" />

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
              For every kind of trip.
            </h2>
            <p className="text-base mb-2" style={{ color: C.muted, fontFamily: FONT.body }}>
              Some travelers know exactly what they need. A desk, strong wifi, a door that closes.
              Others know only that the dog has to come.
            </p>
            <p className="text-base mb-8" style={{ color: C.muted, fontFamily: FONT.body }}>
              The collections grew from real trips. The work trip where we needed reliable internet
              and found a yurt with fiber. The weekend we couldn&rsquo;t bring the dog because we
              couldn&rsquo;t find a single place that meant it when they said &ldquo;pet-friendly.&rdquo;
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
            Same standard. Different need. Only the ones worth your time.
          </p>
        </div>
      </section>

      {/* ── VII. The Invitation ── */}
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
            So are a few hundred others.
          </motion.h2>

          <motion.p
            className="text-base mb-2"
            style={{ color: C.cream80, fontFamily: FONT.body }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            That treehouse in Oregon. The barn. The fire tower. The cave. And a few hundred more
            that made us stop scrolling.
          </motion.p>

          <motion.p
            className="text-lg font-semibold mb-8"
            style={{ fontFamily: FONT.display, color: C.light }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            We built this because we were tired of settling for page six.
          </motion.p>

          <motion.p
            className="text-xl mb-8"
            style={{ fontFamily: FONT.display, color: C.light, fontStyle: 'italic' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Now you don&rsquo;t have to either.
          </motion.p>

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

      {/* ── Journal ── */}
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
    </div>
  )
}
