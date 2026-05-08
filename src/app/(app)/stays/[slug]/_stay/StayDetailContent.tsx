'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star, MapPin, Users, BedDouble, ExternalLink,
  ArrowRight, ChevronRight, Wifi, PawPrint, Zap, Truck,
} from 'lucide-react'
import StayCard from '@/components/StayCard'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import type { NormalizedStay } from '@/lib/types'

const PLATFORM_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Airbnb: { bg: '#FFE4DE', text: '#FF5A5F', label: 'Airbnb' },
  VRBO: { bg: '#E0F0FF', text: '#1B5E9E', label: 'VRBO' },
  Wander: { bg: '#E8F5E9', text: '#2E7D32', label: 'Wander' },
  Direct: { bg: 'oklch(0.93 0.025 75)', text: 'oklch(0.40 0.03 60)', label: 'Direct' },
}

const SPOKE_ICONS: Record<string, React.ReactNode> = {
  'work-friendly': <Wifi className="w-4 h-4" />,
  'pet-friendly': <PawPrint className="w-4 h-4" />,
  'rv-ready': <Truck className="w-4 h-4" />,
  'ev-ready': <Zap className="w-4 h-4" />,
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

interface StayDetailContentProps {
  stay: NormalizedStay
  related: NormalizedStay[]
}

export default function StayDetailContent({ stay, related }: StayDetailContentProps) {
  useScrollReveal()

  const platform = PLATFORM_STYLES[stay.platform] || PLATFORM_STYLES.Direct
  const primarySpoke = stay.spokes
    .map((s) => SPOKES_CONFIG[s])
    .find(Boolean)

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[420px] md:min-h-[520px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {stay.imageUrl ? (
            <Image
              src={stay.imageUrl}
              alt={stay.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full" style={{ background: 'oklch(0.22 0.01 60)' }} />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, oklch(0.12 0.02 60 / 0.92) 0%, oklch(0.12 0.02 60 / 0.50) 50%, oklch(0.12 0.02 60 / 0.20) 100%)`,
            }}
          />
        </div>

        <div className="relative z-10 w-full pb-10 pt-32">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-5">
              <Link href="/">
                <span
                  className="text-xs font-semibold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Unique Stays USA
                </span>
              </Link>
              <ChevronRight className="w-3 h-3 opacity-50" style={{ color: 'oklch(0.99 0.005 85)' }} />
              {primarySpoke ? (
                <>
                  <Link href={`/${primarySpoke.slug}`}>
                    <span
                      className="text-xs font-semibold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {primarySpoke.title}
                    </span>
                  </Link>
                  <ChevronRight className="w-3 h-3 opacity-50" style={{ color: 'oklch(0.99 0.005 85)' }} />
                </>
              ) : (
                <>
                  <Link href="/directory">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      Directory
                    </span>
                  </Link>
                  <ChevronRight className="w-3 h-3 opacity-50" style={{ color: 'oklch(0.99 0.005 85)' }} />
                </>
              )}
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'oklch(0.85 0.10 45)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {stay.title}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {stay.editorsPick && (
                <span
                  className="stamp-badge"
                  style={{
                    background: 'oklch(0.55 0.14 38)',
                    color: 'oklch(0.99 0.005 85)',
                    borderColor: 'oklch(0.72 0.10 40)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  ✦ Editor&apos;s Pick
                </span>
              )}
              {stay.isNew && (
                <span
                  className="stamp-badge"
                  style={{
                    background: 'oklch(0.38 0.09 155)',
                    color: 'oklch(0.99 0.005 85)',
                    borderColor: 'oklch(0.52 0.08 155)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  New
                </span>
              )}
              <span
                className="stamp-badge"
                style={{
                  background: platform.bg,
                  color: platform.text,
                  borderColor: platform.text,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  opacity: 0.92,
                }}
              >
                {platform.label}
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-3"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.99 0.005 85)' }}
            >
              {stay.title}
            </h1>

            {stay.subtitle && (
              <p
                className="text-lg md:text-xl mb-3"
                style={{ color: 'oklch(0.85 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontStyle: 'italic' }}
              >
                {stay.subtitle}
              </p>
            )}

            {/* Location + Rating */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" style={{ color: 'oklch(0.85 0.10 45)' }} />
                <span
                  className="text-sm"
                  style={{ color: 'oklch(0.85 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {stay.location}, {stay.state}
                </span>
              </div>
              {stay.rating != null && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[oklch(0.85_0.10_45)] text-[oklch(0.85_0.10_45)]" />
                  <span
                    className="text-sm font-bold"
                    style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {stay.rating}
                  </span>
                  {stay.reviewCount != null && (
                    <span
                      className="text-sm opacity-70"
                      style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      ({stay.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT GRID ────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left column — main content */}
            <div className="lg:col-span-2">
              {/* Category + Region */}
              <div className="flex items-center gap-3 mb-6 fade-up">
                <span
                  className="stamp-badge"
                  style={{
                    color: 'oklch(0.55 0.14 38)',
                    borderColor: 'oklch(0.55 0.14 38)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {stay.category}
                </span>
                <span
                  className="stamp-badge"
                  style={{
                    color: 'oklch(0.50 0.03 60)',
                    borderColor: 'oklch(0.88 0.025 75)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {stay.region}
                </span>
              </div>

              {/* Description */}
              <div className="fade-up mb-10">
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.85 }}
                >
                  {stay.description}
                </p>
              </div>

              {/* Tags */}
              {stay.tags.length > 0 && (
                <div className="mb-10 fade-up">
                  <h3
                    className="text-xs font-bold uppercase tracking-widest mb-4"
                    style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Amenities &amp; Features
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stay.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          border: '1.5px solid oklch(0.70 0.04 60)',
                          borderRadius: '2px',
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'oklch(0.40 0.04 60)',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Spoke-specific details */}
              {stay.spokes.some((s) => SPOKE_SLUGS.includes(s as typeof SPOKE_SLUGS[number]) && s !== 'unique') && (
                <div className="mb-10 fade-up">
                  <h3
                    className="text-xs font-bold uppercase tracking-widest mb-4"
                    style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Stay Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stay.spokes.includes('work-friendly') && (stay.wifiSpeed || stay.hasDesk) && (
                      <div
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ background: 'oklch(0.93 0.025 250)', border: '1px solid oklch(0.45 0.12 250 / 0.2)' }}
                      >
                        <div className="mt-0.5" style={{ color: 'oklch(0.45 0.12 250)' }}>
                          <Wifi className="w-5 h-5" />
                        </div>
                        <div>
                          <div
                            className="text-xs font-bold uppercase tracking-wider mb-1"
                            style={{ color: 'oklch(0.45 0.12 250)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            Work-Friendly
                          </div>
                          {stay.wifiSpeed && (
                            <div className="text-sm" style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                              WiFi: {stay.wifiSpeed}
                            </div>
                          )}
                          {stay.hasDesk && (
                            <div className="text-sm" style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                              Dedicated workspace
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {stay.petFriendly && (
                      <div
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ background: 'oklch(0.93 0.025 145)', border: '1px solid oklch(0.50 0.14 145 / 0.2)' }}
                      >
                        <div className="mt-0.5" style={{ color: 'oklch(0.50 0.14 145)' }}>
                          <PawPrint className="w-5 h-5" />
                        </div>
                        <div>
                          <div
                            className="text-xs font-bold uppercase tracking-wider mb-1"
                            style={{ color: 'oklch(0.50 0.14 145)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            Pet-Friendly
                          </div>
                          {stay.petPolicy && (
                            <div className="text-sm" style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                              {stay.petPolicy}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {stay.rvHookup && stay.rvDetails && (
                      <div
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ background: 'oklch(0.93 0.025 60)', border: '1px solid oklch(0.50 0.14 60 / 0.2)' }}
                      >
                        <div className="mt-0.5" style={{ color: 'oklch(0.50 0.14 60)' }}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div
                            className="text-xs font-bold uppercase tracking-wider mb-1"
                            style={{ color: 'oklch(0.50 0.14 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            RV-Ready
                          </div>
                          <div className="text-sm" style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {stay.rvDetails}
                          </div>
                        </div>
                      </div>
                    )}

                    {stay.evCharger && stay.evDetails && (
                      <div
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ background: 'oklch(0.93 0.025 200)', border: '1px solid oklch(0.50 0.14 200 / 0.2)' }}
                      >
                        <div className="mt-0.5" style={{ color: 'oklch(0.50 0.14 200)' }}>
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div
                            className="text-xs font-bold uppercase tracking-wider mb-1"
                            style={{ color: 'oklch(0.50 0.14 200)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            EV-Ready
                          </div>
                          <div className="text-sm" style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {stay.evDetails}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick stats */}
              <div className="flex items-center gap-6 mb-10 fade-up">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: 'oklch(0.55 0.14 38)' }} />
                  <span className="text-sm font-medium" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Sleeps {stay.sleeps}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4" style={{ color: 'oklch(0.55 0.14 38)' }} />
                  <span className="text-sm font-medium" style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {stay.bedrooms} {stay.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right column — sticky CTA */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-28">
                <div
                  className="p-6 rounded-lg"
                  style={{
                    background: 'oklch(0.99 0.005 85)',
                    border: '1.5px solid oklch(0.88 0.025 75)',
                    boxShadow: '0 4px 24px rgba(44, 30, 20, 0.08)',
                  }}
                >
                  {/* Price */}
                  <div className="mb-5">
                    <span
                      className="text-3xl font-bold"
                      style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                    >
                      ${stay.price}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      /night
                    </span>
                  </div>

                  {/* Primary CTA */}
                  <a
                    href={stay.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="group flex items-center justify-center gap-2 w-full py-4 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:gap-3"
                    style={{
                      background: 'oklch(0.55 0.14 38)',
                      color: 'oklch(0.99 0.005 85)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      letterSpacing: '0.1em',
                    }}
                    data-cursor="view"
                  >
                    Book on {platform.label}
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Platform badge */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span
                      className="stamp-badge"
                      style={{
                        background: platform.bg,
                        color: platform.text,
                        borderColor: platform.text,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '0.65rem',
                      }}
                    >
                      Listed on {platform.label}
                    </span>
                  </div>

                  {/* Quick info */}
                  <div
                    className="mt-5 pt-5 space-y-3"
                    style={{ borderTop: '1px solid oklch(0.88 0.025 75)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Location
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'oklch(0.30 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        {stay.location}, {stay.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Sleeps
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'oklch(0.30 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        {stay.sleeps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Bedrooms
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'oklch(0.30 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        {stay.bedrooms}
                      </span>
                    </div>
                    {stay.rating != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider" style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                          Rating
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[oklch(0.72_0.10_40)] text-[oklch(0.72_0.10_40)]" />
                          <span className="text-sm font-bold" style={{ color: 'oklch(0.30 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {stay.rating}
                          </span>
                          {stay.reviewCount != null && (
                            <span className="text-xs" style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                              ({stay.reviewCount})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Affiliate disclosure */}
                  <p
                    className="text-[10px] leading-relaxed mt-5 pt-4"
                    style={{ color: 'oklch(0.60 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', borderTop: '1px solid oklch(0.88 0.025 75)' }}
                  >
                    Bookings made through this link earn us a small commission at no extra cost to you. This helps keep our directory running.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RELATED STAYS ───────────────────────────────── */}
      {related.length > 0 && (
        <section
          className="py-16 border-t border-[oklch(0.88_0.025_75)]"
          style={{ background: 'oklch(0.99 0.005 85)' }}
        >
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10 fade-up">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold"
                  style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                >
                  More {stay.category}
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Similar stays you might like
                </p>
              </div>
              <Link href="/directory">
                <span
                  className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                  style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Browse All <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((r, i) => (
                <div
                  key={r.id}
                  className="fade-up"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <StayCard stay={r} href={r.affiliateUrl} external index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
