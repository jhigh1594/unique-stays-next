'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, X, ArrowRight, Wifi, PawPrint,
  Zap, Truck, Star, ExternalLink, ChevronRight,
} from 'lucide-react'
import StayCard from '@/components/StayCard'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import type { SpokeSlug } from '@/lib/spokes-config'
import type { NormalizedStay, SpokeConfig } from '@/lib/types'

const REGIONS = ['All', 'West', 'Southwest', 'South', 'Midwest', 'Northeast', 'Southeast'] as const
type Region = typeof REGIONS[number]

const SPOKE_ICONS: Record<SpokeSlug, React.ReactNode> = {
  'unique': <Star className="w-5 h-5" />,
  'work-friendly': <Wifi className="w-5 h-5" />,
  'pet-friendly': <PawPrint className="w-5 h-5" />,
  'rv-ready': <Truck className="w-5 h-5" />,
  'ev-ready': <Zap className="w-5 h-5" />,
}

const SPOKE_FILTERS: Record<SpokeSlug, string[]> = {
  'unique': ['All', 'Treehouses', 'Geodesic Domes', 'Houseboats', 'Lighthouses', 'Cave Dwellings', 'A-Frame Cabins', 'Glamping'],
  'work-friendly': ['All', '100+ Mbps', '500+ Mbps', 'Gigabit', 'Starlink', 'Has Desk'],
  'pet-friendly': ['All', 'Dogs Welcome', 'No Size Limit', 'Fenced Yard', 'Cat Friendly'],
  'rv-ready': ['All', '30-Amp', '50-Amp', 'Full Hookup', 'Pull-Through', 'Pet Friendly'],
  'ev-ready': ['All', 'Tesla Charger', 'Level 2', 'J1772', 'Solar Powered'],
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

interface SpokeContentProps {
  slug: string
  config: SpokeConfig
  stays: NormalizedStay[]
}

function SpokeCallout({ slug, config }: { slug: SpokeSlug; config: SpokeConfig }) {
  const callouts: Record<SpokeSlug, { title: string; body: string; cta: string }> = {
    'unique': {
      title: "Can't find what you're looking for?",
      body: "We're constantly adding new extraordinary stays. Submit a hidden gem you've discovered and we'll review it for the directory.",
      cta: 'Submit a Stay',
    },
    'work-friendly': {
      title: 'Are you a remote-work-ready host?',
      body: 'If your property has verified high-speed WiFi and a dedicated workspace, get listed in our Work-Friendly directory and reach thousands of digital nomads.',
      cta: 'List Your Property',
    },
    'pet-friendly': {
      title: 'Host a pet-friendly property?',
      body: 'Earn more bookings by getting listed in our Pet-Friendly directory. Travelers with pets are loyal, high-value guests who book longer stays.',
      cta: 'Get Listed',
    },
    'rv-ready': {
      title: 'Have RV hookups on your property?',
      body: 'The RV travel market is booming. Get your hookup site in front of thousands of RV travelers planning their next adventure.',
      cta: 'List Your Site',
    },
    'ev-ready': {
      title: 'Have an EV charger at your property?',
      body: 'EV drivers specifically seek out properties with on-site charging. Get listed and capture this fast-growing, high-income traveler segment.',
      cta: 'Get EV Verified',
    },
  }

  const c = callouts[slug]

  return (
    <section className="py-14" style={{ background: config.accentColorLight }}>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 fade-up">
          <div className="max-w-xl">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              {c.title}
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'oklch(0.40 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {c.body}
            </p>
          </div>
          <Link href="/submit">
            <button
              className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all hover:gap-3 hover:shadow-lg"
              style={{
                background: config.accentColor,
                color: 'oklch(0.99 0.005 85)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {c.cta} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function SpokeContent({ slug, config, stays }: SpokeContentProps) {
  useScrollReveal()
  void SPOKE_ICONS

  const spokeSlug = slug as SpokeSlug

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeRegion, setActiveRegion] = useState<Region>('All')

  const filters = SPOKE_FILTERS[spokeSlug]

  const filtered = useMemo(() => {
    let results = [...stays]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.description.toLowerCase().includes(q)
      )
    }

    if (activeRegion !== 'All') {
      results = results.filter((s) => s.region === activeRegion)
    }

    if (activeFilter !== 'All') {
      results = results.filter((s) => {
        switch (spokeSlug) {
          case 'unique':
            return s.category === activeFilter
          case 'work-friendly':
            if (activeFilter === 'Has Desk') return s.hasDesk
            if (activeFilter === 'Gigabit') return s.wifiSpeed?.includes('Gbps') || s.wifiSpeed?.includes('940')
            if (activeFilter === 'Starlink') return s.wifiSpeed?.toLowerCase().includes('starlink')
            if (activeFilter === '500+ Mbps') return parseInt(s.wifiSpeed || '0') >= 500 || s.wifiSpeed?.includes('Gbps')
            if (activeFilter === '100+ Mbps') return parseInt(s.wifiSpeed || '0') >= 100
            return true
          case 'pet-friendly':
            if (activeFilter === 'No Size Limit') return s.petPolicy?.toLowerCase().includes('no size') || s.petPolicy?.toLowerCase().includes('any size')
            if (activeFilter === 'Fenced Yard') return s.tags.some(t => t.toLowerCase().includes('fenced'))
            if (activeFilter === 'Cat Friendly') return s.petPolicy?.toLowerCase().includes('cat')
            if (activeFilter === 'Dogs Welcome') return s.petFriendly
            return true
          case 'rv-ready':
            if (activeFilter === '50-Amp') return s.rvDetails?.includes('50-amp') || s.rvDetails?.includes('50 amp')
            if (activeFilter === '30-Amp') return s.rvDetails?.includes('30-amp') || s.rvDetails?.includes('30 amp')
            if (activeFilter === 'Full Hookup') return s.rvDetails?.toLowerCase().includes('full')
            if (activeFilter === 'Pull-Through') return s.rvDetails?.toLowerCase().includes('pull')
            if (activeFilter === 'Pet Friendly') return s.petFriendly
            return true
          case 'ev-ready':
            if (activeFilter === 'Tesla Charger') return s.evDetails?.toLowerCase().includes('tesla')
            if (activeFilter === 'Level 2') return s.evDetails?.toLowerCase().includes('level 2')
            if (activeFilter === 'J1772') return s.evDetails?.toLowerCase().includes('j1772')
            if (activeFilter === 'Solar Powered') return s.tags.some(t => t.toLowerCase().includes('solar'))
            return true
          default:
            return true
        }
      })
    }

    results.sort((a, b) => {
      if (a.editorsPick && !b.editorsPick) return -1
      if (!a.editorsPick && b.editorsPick) return 1
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return (b.rating ?? 0) - (a.rating ?? 0)
    })

    return results
  }, [stays, searchQuery, activeFilter, activeRegion, spokeSlug])

  const siblings = SPOKE_SLUGS.filter((s) => s !== spokeSlug).map((s) => SPOKES_CONFIG[s])

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[480px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={config.heroImage}
            alt={config.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, oklch(0.12 0.02 60 / 0.92) 0%, oklch(0.12 0.02 60 / 0.55) 50%, oklch(0.12 0.02 60 / 0.25) 100%)`,
            }}
          />
        </div>

        <div className="relative z-10 w-full pb-12 pt-32">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
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
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {config.title}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                  style={{
                    background: `${config.accentColor}33`,
                    color: 'oklch(0.99 0.005 85)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid oklch(0.99 0.005 85 / 0.2)`,
                  }}
                >
                  <span>{config.heroEmoji}</span>
                  <span>Curated by Unique Stays USA</span>
                </div>

                <h1
                  className="text-5xl md:text-6xl font-bold leading-tight mb-4"
                  style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.99 0.005 85)' }}
                >
                  {config.title.split(' ').map((word, i, arr) =>
                    i === arr.length - 1 ? (
                      <span key={i} style={{ fontStyle: 'italic', color: 'oklch(0.92 0.08 75)' }}>
                        {' '}{word}
                      </span>
                    ) : (
                      <span key={i}>{i > 0 ? ' ' : ''}{word}</span>
                    )
                  )}
                </h1>

                <p
                  className="text-lg leading-relaxed max-w-xl"
                  style={{ color: 'oklch(0.85 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {config.description}
                </p>

                <div
                  className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'oklch(0.99 0.005 85 / 0.12)',
                    color: 'oklch(0.85 0.01 85)',
                    border: '1px solid oklch(0.99 0.005 85 / 0.2)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {config.externalDomain} redirects here
                </div>
              </div>

              <div className="flex gap-6">
                {config.stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="text-3xl font-bold"
                      style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.92 0.08 75)' }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-xs mt-0.5 opacity-70"
                      style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH + FILTERS ─────────────────────────────── */}
      <section
        className="sticky top-16 md:top-20 z-30 py-3 border-b border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.975 0.012 85 / 0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-xl"
              style={{ background: 'oklch(0.99 0.005 85)', border: '1.5px solid oklch(0.88 0.025 75)' }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: config.accentColor }} />
              <input
                type="text"
                placeholder={`Search ${config.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'oklch(0.22 0.01 60)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4" style={{ color: 'oklch(0.55 0.03 60)' }} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeFilter === f ? config.accentColor : 'oklch(0.99 0.005 85)',
                    color: activeFilter === f ? 'oklch(0.99 0.005 85)' : 'oklch(0.40 0.03 60)',
                    border: `1.5px solid ${activeFilter === f ? config.accentColor : 'oklch(0.88 0.025 75)'}`,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {f}
                </button>
              ))}

              <select
                value={activeRegion}
                onChange={(e) => setActiveRegion(e.target.value as Region)}
                className="appearance-none px-3 py-1.5 rounded-full text-xs font-semibold outline-none"
                style={{
                  background: activeRegion !== 'All' ? config.accentColor : 'oklch(0.99 0.005 85)',
                  color: activeRegion !== 'All' ? 'oklch(0.99 0.005 85)' : 'oklch(0.40 0.03 60)',
                  border: `1.5px solid ${activeRegion !== 'All' ? config.accentColor : 'oklch(0.88 0.025 75)'}`,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>
                ))}
              </select>
            </div>

            <div
              className="ml-auto text-sm font-medium self-center whitespace-nowrap"
              style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {filtered.length} stays
            </div>
          </div>
        </div>
      </section>

      {/* ── LISTINGS GRID ────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">{config.heroEmoji}</div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                No stays found
              </h3>
              <p
                className="text-sm mb-6"
                style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Try adjusting your filters or search terms
              </p>
              <button
                className="px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{
                  background: config.accentColor,
                  color: 'oklch(0.99 0.005 85)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
                onClick={() => { setSearchQuery(''); setActiveFilter('All'); setActiveRegion('All') }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((stay, i) => (
                <div
                  key={stay.id}
                  className="fade-up"
                  style={{ transitionDelay: `${Math.min(i * 50, 400)}ms` }}
                >
                  <StayCard stay={stay} accentColor={config.accentColor} index={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SPOKE-SPECIFIC CALLOUT ───────────────────────── */}
      <SpokeCallout slug={spokeSlug} config={config} />

      {/* ── CROSS-LINK TO OTHER SPOKES ───────────────────── */}
      <section
        className="py-16 border-t border-[oklch(0.88_0.025_75)]"
        style={{ background: 'oklch(0.99 0.005 85)' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 fade-up">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              More from Unique Stays USA
            </p>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Explore Other Collections
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {siblings.map((s, i) => (
              <Link key={s.slug} href={`/${s.slug}`}>
                <div
                  className="fade-up group relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: s.accentColorLight,
                    border: `1.5px solid ${s.accentColor}30`,
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <div className="text-3xl mb-3">{s.heroEmoji}</div>
                  <h3
                    className="font-bold text-sm mb-1"
                    style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-xs leading-snug opacity-70"
                    style={{ color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {s.tagline}
                  </p>
                  <div
                    className="mt-3 flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                    style={{ color: s.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Explore <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
