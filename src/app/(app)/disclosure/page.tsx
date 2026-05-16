import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: 'How Unique Stays USA earns commissions through affiliate partnerships — and why it never influences our recommendations.',
}

export default function DisclosurePage() {
  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      {/* Hero */}
      <section
        className="pt-32 pb-16 relative overflow-hidden"
        style={{ background: 'oklch(0.93 0.025 75)' }}
      >
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
              Affiliate{' '}
              <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>
                Disclosure
              </span>
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Honesty is the whole point of this site. Here&apos;s exactly how we make money, how it affects what you see, and what it costs you.
            </p>
            <p
              className="text-sm mt-4"
              style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Last updated: May 16, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="space-y-12 text-base leading-relaxed"
            style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {/* The Short Version */}
            <div
              className="p-8 rounded-2xl"
              style={{
                background: 'oklch(0.99 0.005 85)',
                border: '1.5px solid oklch(0.88 0.025 75)',
              }}
            >
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                The short version
              </h2>
              <p className="text-lg leading-relaxed">
                When you click a link on Unique Stays USA and book a stay, we may earn a small commission from the booking platform (Airbnb, VRBO, Wander, etc.). You pay the same price either way. We never let commissions influence which stays we feature — only the extraordinary ones make the cut.
              </p>
            </div>

            {/* How It Works */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                How affiliate links work
              </h2>
              <div className="space-y-4">
                <p>
                  Unique Stays USA participates in affiliate programs with vacation rental platforms. When you click a &ldquo;Book Now&rdquo; or listing link on our site, you&apos;re redirected to the booking platform&apos;s website.
                </p>
                <p>
                  If you complete a booking through that link, the platform pays us a small commission — typically 3-5% of the booking value. This comes out of the platform&apos;s marketing budget, not your pocket.
                </p>
                <p>
                  <strong>You never pay more.</strong> The price you see on Airbnb or VRBO is the same whether you found the listing through us or directly.
                </p>
              </div>
            </div>

            {/* Editorial Independence */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Editorial independence
              </h2>
              <p className="mb-4">
                This matters, so we&apos;ll be direct:
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'We feature stays because they\'re extraordinary — not because they pay more.',
                  'Commission rates do not influence which properties appear on our site.',
                  'We have no financial relationship with individual property owners.',
                  'If a stay stops being great, we remove it — regardless of affiliate potential.',
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'oklch(0.93 0.025 75)', color: 'oklch(0.55 0.14 38)' }}
                    >
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Our curation process is simple: find places that make us say &ldquo;I can&apos;t believe this exists.&rdquo; If it doesn&apos;t pass that test, it doesn&apos;t go on the site.
              </p>
            </div>

            {/* Which Platforms */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Which platforms we link to
              </h2>
              <p className="mb-4">
                We currently include listings from:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Airbnb</li>
                <li>VRBO</li>
                <li>Wander</li>
                <li>Hipcamp</li>
                <li>Direct booking sites (where available)</li>
              </ul>
              <p>
                Each platform has its own terms of service, cancellation policies, and pricing. We link to them — we don&apos;t control them.
              </p>
            </div>

            {/* What We Don't Do */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                What we don&apos;t do
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We don&apos;t process payments or bookings</li>
                <li>We don&apos;t collect your payment information</li>
                <li>We don&apos;t guarantee availability or pricing (those change on the platform side)</li>
                <li>We don&apos;t accept payment from property owners to feature their listings</li>
                <li>We don&apos;t receive compensation for positive reviews or placement</li>
              </ul>
            </div>

            {/* FTC Compliance */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                FTC compliance
              </h2>
              <p>
                This disclosure satisfies the Federal Trade Commission&apos;s guidelines on affiliate marketing and sponsored content (16 CFR Part 255). We are an independent review site that uses affiliate links as our primary revenue model. All affiliate relationships are disclosed on every page where they appear.
              </p>
            </div>

            {/* Other Revenue */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Other revenue
              </h2>
              <p>
                Affiliate commissions are our primary source of revenue. We may also run display advertising in the future. If we do, we&apos;ll update this page accordingly.
              </p>
            </div>

            {/* Questions */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Questions?
              </h2>
              <p>
                If anything here is unclear, call us out. We believe transparency isn&apos;t negotiable.
              </p>
              <p className="mt-3">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:hello@uniquestaysusa.com"
                  style={{ color: 'oklch(0.55 0.14 38)', textDecoration: 'underline' }}
                >
                  hello@uniquestaysusa.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
          >
            Now back to the{' '}
            <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>good stuff</span>
          </h2>
          <p
            className="text-base mb-8"
            style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            400+ curated stays across 48 states. Your next unforgettable trip starts here.
          </p>
          <Link href="/collection">
            <button
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all hover:gap-3 hover:shadow-lg"
              style={{
                background: 'oklch(0.55 0.14 38)',
                color: 'oklch(0.99 0.005 85)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Explore the Directory <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}
