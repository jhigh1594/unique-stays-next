import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Unique Stays USA collects, uses, and protects your information.',
}

export default function PrivacyPage() {
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
              Legal
            </p>
            <h1
              className="text-5xl md:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Privacy Policy
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              We take your trust seriously. This page explains what information we collect, why we collect it, and how we keep it safe. Written in plain English because legal documents shouldn&apos;t require a law degree to understand.
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
            {/* Who We Are */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Who we are
              </h2>
              <p>
                Unique Stays USA (uniquestaysusa.com) is a curated directory of extraordinary vacation rentals across the United States. We connect travelers with unique stays — treehouses, domes, lighthouses, houseboats, and more — through affiliate partnerships with platforms like Airbnb, VRBO, and Wander.
              </p>
            </div>

            {/* What We Collect */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                What information we collect
              </h2>
              <p className="mb-4">
                Not much. We built this site to be browsed, not interrogated.
              </p>

              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Information you give us
              </h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  <strong>Email address</strong> — only if you subscribe to our newsletter or contact us directly. We never sell or share it.
                </li>
                <li>
                  <strong>Stay submissions</strong> — if you submit a property for review, we collect the details you provide (name, email, property info).
                </li>
              </ul>

              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Information collected automatically
              </h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  <strong>Usage data</strong> — pages visited, time on site, referral source. We use privacy-respecting analytics (no personal data stored).
                </li>
                <li>
                  <strong>Cookies</strong> — essential cookies for site functionality and performance. No third-party tracking cookies.
                </li>
                <li>
                  <strong>Device information</strong> — browser type, screen size, and operating system. Used only to make the site work properly.
                </li>
              </ul>

              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                What we don&apos;t collect
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment information — we never process payments. All bookings happen on the platform you choose (Airbnb, VRBO, etc.).</li>
                <li>Social security numbers, driver&apos;s licenses, or government IDs.</li>
                <li>Health or financial information.</li>
              </ul>
            </div>

            {/* How We Use It */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                How we use your information
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To operate and improve the site</li>
                <li>To send newsletters (only if you opted in)</li>
                <li>To respond to your messages or stay submissions</li>
                <li>To understand how people use the site so we can make it better</li>
                <li>To comply with legal obligations</li>
              </ul>
            </div>

            {/* Affiliate Links */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Affiliate links &amp; third parties
              </h2>
              <p className="mb-4">
                When you click a &ldquo;Book Now&rdquo; link on our site, you&apos;re redirected to Airbnb, VRBO, Wander, or another booking platform. These platforms have their own privacy policies, and we encourage you to read them.
              </p>
              <p>
                We earn a small commission on qualifying bookings. This does not affect the price you pay, and it does not influence which stays we choose to feature. For full details, see our <a href="/disclosure" style={{ color: 'oklch(0.55 0.14 38)', textDecoration: 'underline' }}>Affiliate Disclosure</a>.
              </p>
            </div>

            {/* Data Sharing */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Who we share your data with
              </h2>
              <p className="mb-4">Short answer: almost nobody.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service providers</strong> — tools that help us run the site (hosting, email, analytics). Each is bound by data protection agreements.</li>
                <li><strong>Legal requirements</strong> — if required by law, regulation, or valid legal process.</li>
                <li><strong>Business transfers</strong> — in the unlikely event we sell or merge the business, user data transfers with it.</li>
              </ul>
              <p className="mt-4">We never sell your personal information to advertisers or data brokers.</p>
            </div>

            {/* Data Security */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Data security
              </h2>
              <p>
                We use industry-standard measures to protect your information — SSL encryption, secure hosting, and access controls. No system is perfect, but we take reasonable steps to keep your data safe.
              </p>
            </div>

            {/* Your Rights */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Your rights
              </h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications at any time</li>
                <li>Request a copy of your data in a portable format</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, email us at{' '}
                <a
                  href="mailto:hello@uniquestaysusa.com"
                  style={{ color: 'oklch(0.55 0.14 38)', textDecoration: 'underline' }}
                >
                  hello@uniquestaysusa.com
                </a>
                . We&apos;ll respond within 30 days.
              </p>
            </div>

            {/* Children */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Children&apos;s privacy
              </h2>
              <p>
                Our site is not directed at children under 13. We don&apos;t knowingly collect personal information from children. If we become aware that we&apos;ve inadvertently collected data from a child under 13, we&apos;ll delete it promptly.
              </p>
            </div>

            {/* Changes */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Changes to this policy
              </h2>
              <p>
                We may update this policy from time to time. When we do, we&apos;ll update the &ldquo;Last updated&rdquo; date at the top of this page. Significant changes will be noted on the site or via email.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Contact us
              </h2>
              <p>
                Questions about this privacy policy? Reach out anytime.
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
    </div>
  )
}
