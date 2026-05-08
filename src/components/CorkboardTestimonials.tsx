'use client'

import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote:
      "We stayed in a cave carved into Sedona's red rocks. I didn't believe the photos were real until we pulled into the driveway. This site found it.",
    name: 'Sarah M.',
    location: 'Austin, TX',
    tilt: -3,
    delay: 0,
  },
  {
    quote:
      "The treehouse in Oregon was the specific kind of quiet my kids had never encountered. Two years later they still ask when we're going back.",
    name: 'James & Lisa T.',
    location: 'Seattle, WA',
    tilt: 1.8,
    delay: 0.1,
  },
  {
    quote:
      "Every stay I've booked through this site has had the one thing that makes a place worth remembering. That's not an accident — it's curation.",
    name: 'Maya R.',
    location: 'Brooklyn, NY',
    tilt: -2.2,
    delay: 0.2,
  },
]

const Thumbtack = () => (
  <svg
    width="14"
    height="22"
    viewBox="0 0 14 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
  >
    <ellipse cx="7" cy="7" rx="6" ry="6" fill="oklch(0.55 0.14 38)" />
    <ellipse cx="7" cy="7" rx="3" ry="3" fill="oklch(0.72 0.10 40)" opacity="0.6" />
    <line x1="7" y1="13" x2="7" y2="22" stroke="oklch(0.38 0.02 60)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const PostmarkStamp = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="16" stroke="oklch(0.55 0.14 38)" strokeWidth="1.2" opacity="0.35" />
    <circle cx="18" cy="18" r="11" stroke="oklch(0.55 0.14 38)" strokeWidth="0.8" opacity="0.25" />
    <path d="M6 16 Q12 12 18 16 Q24 20 30 16" stroke="oklch(0.55 0.14 38)" strokeWidth="1" fill="none" opacity="0.3" />
    <path d="M6 20 Q12 16 18 20 Q24 24 30 20" stroke="oklch(0.55 0.14 38)" strokeWidth="1" fill="none" opacity="0.3" />
  </svg>
)

export default function CorkboardTestimonials() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: 'oklch(0.23 0.04 52)' }}
      data-dark-section
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E")`,
          opacity: 0.7,
          mixBlendMode: 'overlay',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.99 0.005 85 / 0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className="stamp-badge inline-block mb-4"
            style={{
              color: 'oklch(0.72 0.10 40)',
              borderColor: 'oklch(0.72 0.10 40)',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Postcards Received
          </span>
          <h2
            className="font-bold"
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
              color: 'oklch(0.93 0.012 85)',
              lineHeight: 1.1,
            }}
          >
            From the travelers
            <br />
            <span style={{ fontStyle: 'italic', color: 'oklch(0.72 0.10 40)' }}>who went.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: t.tilt }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.7,
                delay: t.delay,
                type: 'spring',
                stiffness: 160,
                damping: 18,
              }}
              whileHover={{ rotate: 0, y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              className="relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <Thumbtack />
              </div>

              <div
                className="relative px-6 pt-8 pb-6"
                style={{
                  background: 'oklch(0.97 0.008 80)',
                  borderRadius: '3px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
                }}
              >
                <div className="absolute top-4 right-4 opacity-60">
                  <PostmarkStamp />
                </div>

                <p
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontStyle: 'italic',
                    fontSize: '0.95rem',
                    lineHeight: 1.75,
                    color: 'oklch(0.28 0.02 60)',
                    marginBottom: '1.25rem',
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div style={{ height: '1px', background: 'oklch(0.82 0.025 75)', marginBottom: '0.75rem' }} />

                <div className="flex items-center justify-between">
                  <div>
                    <div
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'oklch(0.35 0.02 60)',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '0.65rem',
                        color: 'oklch(0.55 0.02 60)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t.location}
                    </div>
                  </div>
                  <div
                    className="stamp-badge"
                    style={{
                      color: 'oklch(0.38 0.09 155)',
                      borderColor: 'oklch(0.38 0.09 155)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: '0.52rem',
                      opacity: 0.8,
                    }}
                  >
                    Verified Stay
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
