import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Calculator, BadgeCheck, Compass } from 'lucide-react'
import { TOOLS } from '@/lib/tools-config'

export const dynamic = 'force-static'

const BASE_URL = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://www.uniquestaysusa.com').replace(/\/$/, '')

export function generateMetadata(): Metadata {
  return {
    title: 'Free Vacation Rental Tools — Unique Stays USA',
    description:
      'Free vacation rental tools: listing description generator, build cost calculator, listing score checker, and vacation match quiz. Built for hosts and travelers by Unique Stays USA.',
    alternates: { canonical: '/tools' },
    openGraph: {
      title: 'Free Vacation Rental Tools — Unique Stays USA',
      description:
        'Free vacation rental tools: listing generator, build cost calculator, score checker, and vacation quiz.',
    },
  }
}

export default function ToolsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Tools for Hosts & Travelers',
    description: 'Free vacation rental tools built by Unique Stays USA.',
    url: `${BASE_URL}/tools`,
    hasPart: TOOLS.map((t) => ({
      '@type': 'WebApplication',
      name: t.title,
      description: t.description,
      url: `${BASE_URL}/${t.slug}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
    })),
  }

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── THE FIELD KIT ── */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14 md:pb-20">
        {/* Stamp badge */}
        <div
          className="inline-flex items-center gap-2.5 px-3 py-1.5 mb-8"
          style={{ border: '2px solid oklch(0.55 0.14 38)', borderRadius: '2px' }}
        >
          <span style={{ color: 'oklch(0.55 0.14 38)', fontSize: '0.7rem' }}>✦</span>
          <span
            className="text-[0.65rem] font-black uppercase tracking-[0.14em]"
            style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            FIELD KIT
          </span>
        </div>

        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] max-w-xl"
          style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
        >
          Tools for the road
          <br />
          <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>
            &amp; the rental
          </span>
        </h1>

        <p
          className="mt-5"
          style={{
            fontFamily: 'Caveat, cursive',
            color: 'oklch(0.50 0.04 60)',
            fontSize: '1.15rem',
          }}
        >
          free, no signup
        </p>
      </section>

      {/* ── PERFORATION ── */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ borderTop: '2px dashed oklch(0.85 0.02 85)' }} />
      </div>

      {/* ── INSTRUMENTS ── */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-5 md:gap-6">
          {/* ── I. Listing Description Generator ── */}
          <Link href={`/${TOOLS[0].slug}`} className="md:w-[57%] group block">
            <div
              className="relative h-full p-7 md:p-9 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'oklch(0.99 0.005 85)',
                border: '1px solid oklch(0.88 0.02 75)',
                boxShadow: '0 1px 4px oklch(0.22 0.01 60 / 0.05)',
              }}
            >
              {/* Ghost numeral */}
              <span
                className="absolute top-2 right-5 text-7xl font-black opacity-[0.04] select-none pointer-events-none"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.55 0.14 38)' }}
                aria-hidden="true"
              >
                I
              </span>

              {/* Stamp label */}
              <div
                className="inline-flex items-center gap-2 px-2 py-0.5 mb-6"
                style={{ border: '1.5px solid oklch(0.55 0.14 38)', borderRadius: '1px' }}
              >
                <span style={{ color: 'oklch(0.55 0.14 38)', fontSize: '0.6rem' }}>✎</span>
                <span
                  className="text-[0.55rem] font-black tracking-[0.14em] uppercase"
                  style={{
                    color: 'oklch(0.55 0.14 38)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {TOOLS[0].stamp}
                </span>
              </div>

              <h2
                className="text-2xl md:text-3xl font-bold mb-3 max-w-md group-hover:text-[oklch(0.55_0.14_38)] transition-colors duration-200"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                {TOOLS[0].title}
              </h2>

              <p
                className="text-sm leading-relaxed max-w-md mb-8"
                style={{
                  color: 'oklch(0.40 0.03 60)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {TOOLS[0].description}
              </p>

              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all duration-200"
                style={{
                  color: 'oklch(0.55 0.14 38)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Open this <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* ── II. Build Cost Calculator ── */}
          <Link href={`/${TOOLS[1].slug}`} className="md:w-[39%] md:mt-16 group block">
            <div
              className="relative h-full p-7 md:p-9 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'oklch(0.99 0.005 85)',
                border: '1px solid oklch(0.88 0.02 145)',
                boxShadow: '0 1px 4px oklch(0.22 0.01 60 / 0.05)',
              }}
            >
              {/* Ghost numeral */}
              <span
                className="absolute top-2 right-5 text-7xl font-black opacity-[0.04] select-none pointer-events-none"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.38 0.08 145)' }}
                aria-hidden="true"
              >
                II
              </span>

              {/* Ledger ruled lines */}
              <div
                className="absolute inset-x-7 md:inset-x-9 bottom-20 flex flex-col gap-[1.7rem] pointer-events-none"
                style={{ opacity: 0.06 }}
                aria-hidden="true"
              >
                <div style={{ borderTop: '1px solid oklch(0.38 0.08 145)' }} />
                <div style={{ borderTop: '1px solid oklch(0.38 0.08 145)' }} />
                <div style={{ borderTop: '1px solid oklch(0.38 0.08 145)' }} />
              </div>

              {/* Icon seal */}
              <div
                className="inline-flex items-center justify-center w-11 h-11 rounded-full mb-5"
                style={{
                  background: 'oklch(0.93 0.025 145)',
                  color: 'oklch(0.38 0.08 145)',
                }}
              >
                <Calculator className="w-4.5 h-4.5" />
              </div>

              <span
                className="block text-[0.55rem] font-black tracking-[0.14em] uppercase mb-3"
                style={{
                  color: 'oklch(0.38 0.08 145)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {TOOLS[1].stamp}
              </span>

              <h2
                className="text-xl md:text-2xl font-bold mb-3 group-hover:text-[oklch(0.38_0.08_145)] transition-colors duration-200"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                {TOOLS[1].title}
              </h2>

              <p
                className="text-sm leading-relaxed mb-8"
                style={{
                  color: 'oklch(0.40 0.03 60)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {TOOLS[1].description}
              </p>

              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all duration-200"
                style={{
                  color: 'oklch(0.38 0.08 145)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Open this <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* ── III. Listing Score Checker ── */}
          <Link href={`/${TOOLS[2].slug}`} className="md:w-[40%] group block">
            <div
              className="relative h-full p-7 md:p-9 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'oklch(0.99 0.005 85)',
                border: '1px solid oklch(0.88 0.02 200)',
                boxShadow: '0 1px 4px oklch(0.22 0.01 60 / 0.05)',
              }}
            >
              {/* Ghost numeral */}
              <span
                className="absolute top-2 right-5 text-7xl font-black opacity-[0.04] select-none pointer-events-none"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.50 0.12 200)' }}
                aria-hidden="true"
              >
                III
              </span>

              {/* Badge seal */}
              <div
                className="inline-flex items-center justify-center mb-5"
                style={{
                  width: '3rem',
                  height: '3rem',
                  border: '1.5px solid oklch(0.50 0.12 200)',
                  borderRadius: '50%',
                  color: 'oklch(0.50 0.12 200)',
                }}
              >
                <BadgeCheck className="w-4 h-4" />
              </div>

              <span
                className="block text-[0.55rem] font-black tracking-[0.14em] uppercase mb-3"
                style={{
                  color: 'oklch(0.50 0.12 200)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {TOOLS[2].stamp}
              </span>

              <h2
                className="text-xl md:text-2xl font-bold mb-3 group-hover:text-[oklch(0.50_0.12_200)] transition-colors duration-200"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                {TOOLS[2].title}
              </h2>

              <p
                className="text-sm leading-relaxed mb-8"
                style={{
                  color: 'oklch(0.40 0.03 60)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {TOOLS[2].description}
              </p>

              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all duration-200"
                style={{
                  color: 'oklch(0.50 0.12 200)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Open this <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* ── IV. Vacation Match Quiz ── */}
          <Link href={`/${TOOLS[3].slug}`} className="md:w-[56%] group block">
            <div
              className="relative h-full p-7 md:p-9 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'oklch(0.99 0.005 85)',
                border: '1px solid oklch(0.88 0.02 60)',
                boxShadow: '0 1px 4px oklch(0.22 0.01 60 / 0.05)',
              }}
            >
              {/* Ghost numeral */}
              <span
                className="absolute top-2 right-5 text-7xl font-black opacity-[0.04] select-none pointer-events-none"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.50 0.12 60)' }}
                aria-hidden="true"
              >
                IV
              </span>

              <div className="flex items-center gap-3 mb-5">
                <Compass className="w-5 h-5" style={{ color: 'oklch(0.50 0.12 60)' }} />
                <span
                  className="text-[0.55rem] font-black tracking-[0.14em] uppercase"
                  style={{
                    color: 'oklch(0.50 0.12 60)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {TOOLS[3].stamp}
                </span>
              </div>

              <h2
                className="text-2xl md:text-3xl font-bold mb-2 max-w-md group-hover:text-[oklch(0.50_0.12_60)] transition-colors duration-200"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                {TOOLS[3].title}
              </h2>

              {/* Handwritten annotation */}
              <p
                className="mb-3"
                style={{
                  fontFamily: 'Caveat, cursive',
                  color: 'oklch(0.50 0.06 60)',
                  fontSize: '0.95rem',
                }}
              >
                find your kind of escape
              </p>

              <p
                className="text-sm leading-relaxed max-w-md mb-8"
                style={{
                  color: 'oklch(0.40 0.03 60)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {TOOLS[3].description}
              </p>

              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all duration-200"
                style={{
                  color: 'oklch(0.50 0.12 60)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Open this <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── PERFORATION ── */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ borderTop: '2px dashed oklch(0.85 0.02 85)' }} />
      </div>

      {/* ── POSTSCRIPT ── */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <p
          className="mb-3"
          style={{
            fontFamily: 'Caveat, cursive',
            color: 'oklch(0.45 0.06 60)',
            fontSize: '1.25rem',
          }}
        >
          P.S.
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{
            color: 'oklch(0.40 0.03 60)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          Have a unique property?{' '}
          <Link
            href="/submit"
            className="underline underline-offset-2 transition-colors duration-200"
            style={{
              color: 'oklch(0.55 0.14 38)',
              textDecorationColor: 'oklch(0.55 0.14 38 / 0.3)',
            }}
          >
            Submit a stay
          </Link>{' '}
          or{' '}
          <Link
            href="/collections"
            className="underline underline-offset-2 transition-colors duration-200"
            style={{
              color: 'oklch(0.55 0.14 38)',
              textDecorationColor: 'oklch(0.55 0.14 38 / 0.3)',
            }}
          >
            browse the collections
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
