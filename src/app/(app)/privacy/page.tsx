import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How UniqueStaysUSA collects, uses, and protects your information.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <section className="pt-32 pb-20 relative overflow-hidden" style={{ background: 'oklch(0.93 0.025 75)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Your Rights
            </p>
            <h1
              className="text-5xl md:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Privacy <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>Policy</span>
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Last updated: May 2026
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
              Information We Collect
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              UniqueStaysUSA is a curated directory. When you browse the site, we may collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <li>Usage data through analytics tools (pages visited, time on site, referral source)</li>
              <li>Email addresses if you subscribe to our newsletter</li>
              <li>Basic device and browser information for site performance</li>
            </ul>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-base" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <li>To send newsletter updates you opted into</li>
              <li>To understand how visitors use the site and improve the experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Third-Party Services
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              We use third-party services that may collect information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <li><strong>Analytics:</strong> Vercel Analytics and PostHog for site performance and usage insights</li>
              <li><strong>Email:</strong> Beehiiv for newsletter delivery</li>
              <li><strong>Booking platforms:</strong> When you click through to Airbnb, VRBO, or Wander, their privacy policies apply</li>
            </ul>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Cookies
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              We use essential cookies for site functionality and analytics cookies to understand usage patterns. You can manage cookie preferences through your browser settings.
            </p>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Data Retention &amp; Your Rights
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              We retain newsletter subscriber information only as long as you remain subscribed. You may unsubscribe at any time. Analytics data is aggregated and not personally identifiable. To request deletion of your data, contact us at the email below.
            </p>
          </div>

          <div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Contact
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              For privacy-related questions or data requests, email{' '}
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
