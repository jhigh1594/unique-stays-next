import Link from 'next/link'
import { ArrowRight, Heart, Search, Star, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us — Our Story',
  description: 'Learn how Unique Stays USA curates extraordinary vacation rentals across America.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>

      {/* Hero */}
      <section
        className="pt-32 pb-20 relative overflow-hidden"
        style={{ background: 'oklch(0.93 0.025 75)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Our Story
            </p>
            <h1
              className="text-5xl md:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              We believe travel should
              <br />
              <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>
                make you feel alive.
              </span>
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Unique Stays USA was born from a simple frustration: too many boring places to stay, and too much time wasted finding the extraordinary ones. We fixed that.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="fade-up">
              <h2
                className="text-4xl font-bold mb-6"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                The mission is simple.
              </h2>
              <div className="space-y-5">
                {[
                  {
                    icon: <Search className="w-5 h-5" />,
                    title: 'We do the searching',
                    body: "We scour Airbnb, VRBO, Wander, and direct booking sites to find the stays that make you gasp. You shouldn't have to scroll for hours.",
                  },
                  {
                    icon: <Star className="w-5 h-5" />,
                    title: 'We curate ruthlessly',
                    body: 'Not every treehouse makes the cut. We look for genuine "wow" factor — architectural uniqueness, stunning settings, and memorable experiences.',
                  },
                  {
                    icon: <Heart className="w-5 h-5" />,
                    title: 'We share with love',
                    body: "Every listing comes with honest context: what makes it special, who it's perfect for, and what to expect when you arrive.",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    title: "We're transparent",
                    body: "We earn affiliate commissions when you book through our links. This never influences which stays we feature — only the extraordinary ones make it in.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'oklch(0.93 0.025 75)', color: 'oklch(0.55 0.14 38)' }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3
                        className="font-bold mb-1"
                        style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-up relative" style={{ transitionDelay: '150ms' }}>
              <div className="relative h-[480px]">
                <div
                  className="absolute top-0 right-0 w-4/5 h-72 rounded-2xl overflow-hidden shadow-xl"
                  style={{ transform: 'rotate(2deg)' }}
                >
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/stay-cave-DzUjvuyWRjdY2ijdYdCnYC.webp"
                    alt="Cave dwelling"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute bottom-0 left-0 w-3/5 h-56 rounded-2xl overflow-hidden shadow-xl border-4 border-white"
                  style={{ transform: 'rotate(-2deg)' }}
                >
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/86702083/ByQr52J2uJxPcTScSSaduY/stay-barn-JvwT2jj9bCD3f5FXSDQu76.webp"
                    alt="Converted barn"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20"
        style={{ background: 'oklch(0.93 0.025 75)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 fade-up">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Simple as it gets
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              How It <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Browse the Directory',
                body: 'Filter by category, region, or platform. Search for your dream stay by vibe, state, or type.',
              },
              {
                step: '02',
                title: 'Find Your Wonder',
                body: 'Read our curated descriptions, check the platform, and see what makes each stay truly extraordinary.',
              },
              {
                step: '03',
                title: 'Book & Go',
                body: 'Click through to Airbnb, VRBO, or Wander to book directly. We earn a small commission — you pay nothing extra.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="fade-up p-8 rounded-2xl"
                style={{
                  background: 'oklch(0.99 0.005 85)',
                  transitionDelay: `${i * 100}ms`,
                  border: '1.5px solid oklch(0.88 0.025 75)',
                }}
              >
                <div
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.88 0.025 75)' }}
                >
                  {item.step}
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center fade-up">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
          >
            Ready to find your
            <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}> extraordinary</span>?
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
