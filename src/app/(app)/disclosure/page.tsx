import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: 'How UniqueStaysUSA earns commissions and our commitment to honest, unbiased recommendations.',
  alternates: { canonical: '/disclosure' },
}

export default function DisclosurePage() {
  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <section className="pt-32 pb-20 relative overflow-hidden" style={{ background: 'oklch(0.93 0.025 75)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Transparency
            </p>
            <h1
              className="text-5xl md:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Affiliate <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>Disclosure</span>
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              We want you to know exactly how this site works and how we get paid.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              How We Earn Money
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              UniqueStaysUSA participates in affiliate programs with Airbnb, VRBO, Wander, and other booking platforms. When you click a &ldquo;Book&rdquo; link on our site and complete a reservation, we may earn a small commission from the booking platform at no additional cost to you.
            </p>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Our Editorial Independence
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Affiliate commissions never influence which stays we feature, how we describe them, or where they appear on the site. We curate every listing based on architectural uniqueness, setting, and guest experience — not commission rates. If a stay isn&apos;t extraordinary, it doesn&apos;t make the directory regardless of payout.
            </p>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Pricing &amp; Availability
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Prices shown on UniqueStaysUSA are approximate nightly rates at the time of publication and may not reflect current availability, seasonal rates, taxes, or fees. Always verify pricing and availability on the booking platform before reserving.
            </p>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Third-Party Content
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              We link to third-party booking platforms for reservations. UniqueStaysUSA does not own, operate, or control these properties. All bookings, cancellations, and disputes are handled directly through the respective platform.
            </p>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Questions
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              If you have questions about our affiliate relationships or how the site operates, reach us at{' '}
              <a href="mailto:hello@uniquestaysusa.com" style={{ color: 'oklch(0.55 0.14 38)', textDecoration: 'underline' }}>
                hello@uniquestaysusa.com
              </a>.
            </p>
          </div>

          <div style={{ borderTop: '1px solid oklch(0.88 0.025 75)', paddingTop: 24 }}>
            <Link
              href="/"
              style={{ fontSize: 14, fontWeight: 600, color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
