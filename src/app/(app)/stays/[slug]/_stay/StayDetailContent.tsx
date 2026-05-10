'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Wifi, PawPrint, Zap, Truck } from 'lucide-react'
import StayCard from '@/components/StayCard'
import { SPOKES_CONFIG } from '@/lib/spokes-config'
import type { NormalizedStay } from '@/lib/types'

// ── Sticker design tokens ───────────────────────────────────────
const STICKER_VARIANTS = [
  { bg: 'oklch(0.965 0.018 78)', color: 'oklch(0.36 0.05 60)', border: 'oklch(0.82 0.03 72)' },
  { bg: 'oklch(0.945 0.028 58)', color: 'oklch(0.38 0.07 55)', border: 'oklch(0.80 0.04 58)' },
  { bg: 'oklch(0.936 0.032 148)', color: 'oklch(0.32 0.10 148)', border: 'oklch(0.76 0.07 148 / 0.7)' },
  { bg: 'oklch(0.955 0.024 85)', color: 'oklch(0.38 0.04 72)', border: 'oklch(0.80 0.03 80)' },
]
const STICKER_ROTATIONS = [-1.4, 0, 0.9, -0.6, 0, 1.2, 0, -1.4]
const POLAROID_ROTATIONS = [-2.2, 1.5, -0.8, 2.1]
const BARCODE_BARS: [number, number][] = [
  [1.5, 14], [3, 14], [1.5, 9], [1.5, 14], [3, 11],
  [1.5, 14], [3, 9], [1.5, 14], [1.5, 11], [3, 14],
  [1.5, 14], [1.5, 9], [3, 14],
]

// ── Helpers ─────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  'treehouses': 'Treehouse', 'a-frames': 'A-Frame', 'yurts': 'Yurt',
  'domes': 'Dome', 'cabins': 'Cabin', 'houseboats': 'Houseboat',
  'glamping': 'Glamping Site', 'tiny-houses': 'Tiny House', 'caves': 'Cave Stay',
  'windmills': 'Windmill', 'lighthouses': 'Lighthouse', 'barns': 'Barn',
  'castles': 'Castle', 'trains': 'Train Car', 'boats': 'Boat',
}

function prettifyCategory(slug: string): string {
  return CATEGORY_LABELS[slug] ??
    slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-')
}

function generateSerial(id: number, region: string): string {
  const prefix = region.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase() || 'US'
  return `#${prefix}-${String(id).padStart(4, '0')}`
}

// ── Sub-components ──────────────────────────────────────────────
function RegistrationMark({ position }: { position: 'tl' | 'br' }) {
  const pos = position === 'tl' ? { top: 10, left: 10 } : { bottom: 62, right: 10 }
  return (
    <div style={{ position: 'absolute', width: 16, height: 16, zIndex: 4, pointerEvents: 'none', ...pos }}>
      <div style={{ position: 'absolute', top: 0, left: 5, width: 1, height: 16, background: 'oklch(0.99 0.005 85 / 0.28)' }} />
      <div style={{ position: 'absolute', top: 5, left: 0, height: 1, width: 16, background: 'oklch(0.99 0.005 85 / 0.28)' }} />
    </div>
  )
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

// ── Main component ───────────────────────────────────────────────
interface StayDetailContentProps {
  stay: NormalizedStay
  related: NormalizedStay[]
}

export default function StayDetailContent({ stay, related }: StayDetailContentProps) {
  useScrollReveal()

  const allImages = [stay.imageUrl, ...stay.galleryImages].filter(Boolean)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const currentImage = allImages[selectedIdx] || ''

  const categoryDisplay = prettifyCategory(stay.category)
  const serialNo = generateSerial(stay.id, stay.region)
  const primarySpoke = stay.spokes.map((s) => SPOKES_CONFIG[s]).find(Boolean)
  const hasFastFacts = stay.bestFor || stay.bestSeason || stay.vibe
  const pullQuote = stay.editorNote || (stay.description ? stay.description.split('.')[0] + '.' : '')

  const now = new Date()
  const postmarkDate = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .replace(' ', ' · ').toUpperCase()

  const PLATFORM_LABELS: Record<string, string> = {
    Airbnb: 'Airbnb', VRBO: 'VRBO', Wander: 'Wander', Direct: 'Direct',
  }
  const platformLabel = PLATFORM_LABELS[stay.platform] ?? stay.platform

  return (
    <div style={{ background: 'oklch(0.90 0.028 75)', minHeight: '100vh' }}>

      {/* ── DESKTOP SPLIT FRAME ─────────────────────────────────── */}
      <div className="hidden lg:block">
        <div
          style={{
            display: 'flex', overflow: 'hidden',
            height: '100dvh', minHeight: 500,
          }}
        >

          {/* ── LEFT: IMAGE PANEL ── */}
          <div style={{ width: '46%', flexShrink: 0, position: 'relative', background: 'oklch(0.14 0.02 60)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {currentImage && (
              <div className="absolute inset-0">
                <Image
                  src={currentImage}
                  alt={stay.title}
                  fill
                  sizes="46vw"
                  className="object-cover"
                  style={{ objectPosition: 'center 25%', filter: 'saturate(0.88) contrast(1.05)' }}
                  priority
                />
              </div>
            )}
            {/* Vignette */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, oklch(0.08 0.02 60 / 0.65) 100%)' }} />
            {/* Bottom gradient */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 35%, oklch(0.10 0.02 60 / 0.90) 100%)' }} />
            {/* Grain */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              opacity: 0.06, mixBlendMode: 'overlay',
            }} />

            <RegistrationMark position="tl" />
            <RegistrationMark position="br" />

            {/* Editor's Pick seal */}
            {stay.editorsPick && (
              <div style={{
                position: 'absolute', top: 14, right: 14, zIndex: 5,
                width: 72, height: 72, borderRadius: '50%',
                border: '3px solid oklch(0.85 0.10 45 / 0.6)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transform: 'rotate(-18deg)',
                background: 'oklch(0.55 0.14 38 / 0.18)', backdropFilter: 'blur(2px)',
              }}>
                <span style={{ fontSize: 14, color: 'oklch(0.85 0.10 45 / 0.9)', display: 'block', lineHeight: 1 }}>✦</span>
                <div style={{ width: '65%', height: 1.5, background: 'oklch(0.85 0.10 45 / 0.55)', margin: '3px auto' }} />
                <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'oklch(0.85 0.10 45 / 0.85)', textAlign: 'center', lineHeight: 1.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  EDITOR&apos;S<br />PICK
                </div>
                <div style={{ width: '65%', height: 1.5, background: 'oklch(0.85 0.10 45 / 0.55)', margin: '3px auto' }} />
              </div>
            )}

            {/* Content overlay */}
            <div style={{ position: 'relative', zIndex: 3, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {stay.editorsPick && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 7.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'oklch(0.85 0.10 45)', border: '1.5px solid oklch(0.72 0.10 40 / 0.6)',
                  borderRadius: 1, padding: '3px 8px', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  width: 'fit-content', background: 'oklch(0.55 0.14 38 / 0.2)', backdropFilter: 'blur(4px)',
                  marginBottom: 10,
                }}>
                  ✦ &nbsp; Editor&apos;s Pick · {now.getFullYear()}
                </div>
              )}
              <h1 style={{
                fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 700, lineHeight: 1.05,
                color: 'oklch(0.99 0.005 85)', marginBottom: 5, letterSpacing: '-0.02em',
                textShadow: '0 2px 20px rgba(0,0,0,0.4)',
              }}>
                {stay.title}
              </h1>
              {stay.subtitle && (
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontStyle: 'italic', color: 'oklch(0.72 0.01 85)', marginBottom: 10 }}>
                  {stay.subtitle}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9.5, color: 'oklch(0.62 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 10 }}>
                <span>{stay.location}</span>
                <span style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: 'currentColor', opacity: 0.4, display: 'inline-block', flexShrink: 0 }} />
                <span>{stay.region}</span>
                <span style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: 'currentColor', opacity: 0.4, display: 'inline-block', flexShrink: 0 }} />
                <span>{categoryDisplay}</span>
              </div>
              <div style={{ fontSize: 8.5, fontStyle: 'italic', color: 'oklch(0.62 0.01 85)', fontFamily: 'Fraunces, serif', paddingTop: 8, borderTop: '1px solid oklch(0.99 0.005 85 / 0.15)' }}>
                {stay.location} · {stay.state}
              </div>
            </div>

            {/* Polaroid strip */}
            {allImages.length > 1 && (
              <div style={{
                position: 'relative', zIndex: 3,
                display: 'flex', gap: 8, padding: '12px 14px 14px',
                background: 'oklch(0.06 0.02 60 / 0.8)', backdropFilter: 'blur(8px)',
              }}>
                {allImages.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    aria-label={`View photo ${i + 1}`}
                    style={{
                      flex: 1, background: 'white', padding: '3px 3px 11px',
                      cursor: 'pointer', border: 'none',
                      boxShadow: selectedIdx === i ? '0 6px 24px rgba(168,70,38,0.5)' : '0 2px 10px rgba(0,0,0,0.4)',
                      transform: selectedIdx === i
                        ? 'rotate(0deg) scale(1.1)'
                        : `rotate(${POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]}deg)`,
                      outline: selectedIdx === i ? '2px solid oklch(0.55 0.14 38)' : 'none',
                      outlineOffset: 1,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative', zIndex: selectedIdx === i ? 2 : 1,
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
                      <Image
                        src={img}
                        alt={`${stay.title} photo ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: SCROLLABLE PANEL ── */}
          <div style={{ flex: 1, background: 'oklch(0.975 0.012 85)', overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Nav-clearance zone + breadcrumb */}
            <div style={{ padding: '88px 18px 0' }}>
              <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                <Link href="/" style={{ color: 'oklch(0.50 0.03 60)', opacity: 0.7, textDecoration: 'none' }}>
                  Home
                </Link>
                <span style={{ color: 'oklch(0.70 0.02 60)' }}>·</span>
                {primarySpoke ? (
                  <Link href={`/${primarySpoke.slug}`} style={{ color: 'oklch(0.50 0.03 60)', opacity: 0.7, textDecoration: 'none' }}>
                    {primarySpoke.title}
                  </Link>
                ) : (
                  <Link href="/collection" style={{ color: 'oklch(0.50 0.03 60)', opacity: 0.7, textDecoration: 'none' }}>
                    Directory
                  </Link>
                )}
                <span style={{ color: 'oklch(0.70 0.02 60)' }}>·</span>
                <span style={{ color: 'oklch(0.55 0.14 38)' }}>{stay.title}</span>
              </nav>
            </div>

            {/* ═══ TICKET STUB (sticky) ═══ */}
            <div style={{ padding: '0 18px 24px', position: 'sticky', top: 80, zIndex: 10, background: 'oklch(0.975 0.012 85)' }}>
              <div style={{
                position: 'relative', overflow: 'hidden', borderRadius: 3,
                background: 'oklch(0.985 0.008 80)',
                border: '1px solid oklch(0.80 0.04 70)',
                boxShadow: '0 1px 0 oklch(0.92 0.02 75) inset, 0 4px 20px rgba(44,30,20,0.13)',
              }}>
                {/* Diagonal stripes */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', opacity: 0.045 }}>
                  <div style={{ position: 'absolute', inset: '-50%', background: 'repeating-linear-gradient(-45deg, oklch(0.55 0.14 38) 0px, oklch(0.55 0.14 38) 3px, transparent 3px, transparent 14px)' }} />
                </div>

                {/* Header band */}
                <div style={{ position: 'relative', zIndex: 1, background: 'oklch(0.55 0.14 38)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'oklch(0.99 0.005 85 / 0.9)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    ✦ &nbsp; Unique Stays USA
                  </span>
                  <span style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'oklch(0.85 0.10 45 / 0.8)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Curated Listing
                  </span>
                </div>

                {/* Ticket body */}
                <div style={{ position: 'relative', zIndex: 1, padding: '12px 14px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.62 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 3 }}>
                      Experience
                    </div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, color: 'oklch(0.18 0.01 60)', lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 6 }}>
                      One-of-a-Kind {categoryDisplay}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[
                        { label: 'Location', value: `${stay.location.split(',')[0]}, ${stay.state}` },
                        { label: 'Region', value: stay.region },
                        { label: 'Capacity', value: `Sleeps ${stay.sleeps}` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: 6, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'oklch(0.65 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'oklch(0.28 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rubber stamp rating */}
                  {stay.rating != null && (
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                      border: '2.5px solid oklch(0.55 0.14 38 / 0.4)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      transform: 'rotate(10deg)',
                      background: 'oklch(0.55 0.14 38 / 0.07)',
                      boxShadow: 'inset 0 0 0 5px oklch(0.55 0.14 38 / 0.05)',
                      marginTop: 2,
                    }}>
                      <span style={{ color: 'oklch(0.55 0.14 38)', fontSize: 10, display: 'block', lineHeight: 1, marginBottom: 1 }}>★</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {stay.rating}
                      </span>
                      {stay.reviewCount != null && (
                        <span style={{ fontSize: 6, fontWeight: 600, color: 'oklch(0.55 0.14 38 / 0.65)', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.04em', marginTop: 1 }}>
                          {stay.reviewCount} reviews
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Price band */}
                <div style={{
                  position: 'relative', zIndex: 1,
                  background: 'oklch(0.96 0.022 78)',
                  borderTop: '1px dashed oklch(0.78 0.04 70)',
                  borderBottom: '1px dashed oklch(0.78 0.04 70)',
                  padding: '8px 14px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.62 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Admission</div>
                    <div>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: 'oklch(0.18 0.01 60)', letterSpacing: '-0.02em', lineHeight: 1 }}>${stay.price}</span>
                      <span style={{ fontSize: 11, color: 'oklch(0.58 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginLeft: 3 }}>/night</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.62 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    via {platformLabel}
                  </div>
                </div>

                {/* Perforation */}
                <div style={{ position: 'relative', zIndex: 1, height: 14, display: 'flex', alignItems: 'center', background: 'oklch(0.985 0.008 80)' }}>
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: -7, width: 13, height: 13, borderRadius: '50%', background: 'oklch(0.975 0.012 85)', border: '1px solid oklch(0.80 0.04 70)', zIndex: 2 }} />
                  <div style={{ flex: 1, margin: '0 8px', borderBottom: '1.5px dashed oklch(0.75 0.04 70)' }} />
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: -7, width: 13, height: 13, borderRadius: '50%', background: 'oklch(0.975 0.012 85)', border: '1px solid oklch(0.80 0.04 70)', zIndex: 2 }} />
                </div>

                {/* Stub */}
                <div style={{ position: 'relative', zIndex: 1, background: 'oklch(0.975 0.01 78)', padding: '12px 14px 13px' }}>
                  <a
                    href={stay.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    data-cursor="view"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      width: '100%', padding: 12, marginBottom: 10,
                      background: 'oklch(0.55 0.14 38)', color: 'white',
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: 1, textDecoration: 'none',
                      boxShadow: '0 2px 0 oklch(0.38 0.12 38), 0 4px 12px oklch(0.55 0.14 38 / 0.28)',
                    }}
                  >
                    Book on {platformLabel} &nbsp; ↗
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', color: 'oklch(0.68 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', opacity: 0.7 }}>
                      {serialNo}
                    </span>
                    <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', height: 16 }}>
                      {BARCODE_BARS.map(([w, h], i) => (
                        <span key={i} style={{ display: 'block', width: w, height: h, background: 'oklch(0.55 0.14 38 / 0.28)' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ EDITORIAL CARD ═══ */}
            <div style={{ padding: '10px 18px 0' }}>
              <div style={{
                background: 'oklch(0.995 0.004 85)',
                border: '1.5px solid oklch(0.86 0.028 75)',
                borderRadius: 1, padding: '20px 18px 18px',
                position: 'relative', overflow: 'hidden',
                boxShadow: '3px 4px 0 oklch(0.86 0.028 75), 6px 8px 0 oklch(0.88 0.025 75 / 0.5)',
              }}>
                {/* Paper texture */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at 85% 15%, oklch(0.93 0.03 75 / 0.55) 0%, transparent 50%), radial-gradient(ellipse at 10% 88%, oklch(0.90 0.03 60 / 0.4) 0%, transparent 48%)',
                }} />

                {/* Postmark */}
                <div style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 2,
                  width: 64, height: 64, borderRadius: '50%',
                  border: '2.5px solid oklch(0.55 0.14 38 / 0.22)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transform: 'rotate(-16deg)', pointerEvents: 'none',
                  background: 'oklch(0.55 0.14 38 / 0.04)',
                }}>
                  {['CURATED', postmarkDate, 'U·S·A'].map((txt, i) => (
                    <div key={txt}>
                      <div style={{ fontSize: 6, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38 / 0.35)', textAlign: 'center', lineHeight: 1.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        {txt}
                      </div>
                      {i < 2 && <div style={{ width: '68%', height: 1.5, background: 'oklch(0.55 0.14 38 / 0.22)', margin: '2.5px auto' }} />}
                    </div>
                  ))}
                </div>

                {/* Editor's Note label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, fontSize: 7.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative', zIndex: 1 }}>
                  ✦ &nbsp; Editor&apos;s Note
                </div>

                {/* Ghost quotation */}
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 80, fontWeight: 900, color: 'oklch(0.55 0.14 38 / 0.12)', lineHeight: '0.5', display: 'block', marginBottom: -8, letterSpacing: '-0.06em', position: 'relative', zIndex: 1 }}>
                  &ldquo;
                </span>

                {/* Pull quote */}
                {pullQuote && (
                  <div style={{ borderLeft: '3px solid oklch(0.55 0.14 38)', paddingLeft: 14, marginBottom: 14, position: 'relative', zIndex: 1 }}>
                    <p style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.6, color: 'oklch(0.20 0.01 60)' }}>
                      {pullQuote}
                    </p>
                  </div>
                )}

                {/* Magazine body */}
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11.5, lineHeight: 1.88, color: 'oklch(0.40 0.02 60)', position: 'relative', zIndex: 1 }}>
                  {stay.description}
                </p>
              </div>
            </div>

            {/* ═══ FAST FACTS ═══ */}
            {hasFastFacts && (
              <div style={{ padding: '10px 18px 0' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
                  border: '1.5px solid oklch(0.82 0.035 70)', borderRadius: 1,
                  background: 'oklch(0.972 0.022 72)', overflow: 'hidden',
                  boxShadow: '3px 4px 0 oklch(0.82 0.035 70)', position: 'relative',
                }}>
                  {[
                    { label: 'Made for', value: stay.bestFor },
                    null,
                    { label: 'Go in', value: stay.bestSeason },
                    null,
                    { label: 'The vibe', value: stay.vibe },
                  ].map((item, i) =>
                    item === null ? (
                      <div key={i} style={{ background: 'oklch(0.82 0.035 70)', width: 1 }} />
                    ) : (
                      <div key={i} style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ width: 24, height: 2, background: 'oklch(0.55 0.14 38 / 0.55)', borderRadius: 1, marginBottom: 8 }} />
                        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 4 }}>
                          {item.label}
                        </div>
                        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 400, fontStyle: 'italic', color: 'oklch(0.20 0.01 60)', lineHeight: 1.3 }}>
                          {item.value || '—'}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ═══ AMENITY STICKERS ═══ */}
            {stay.tags.length > 0 && (
              <div style={{ padding: '18px 18px 0' }}>
                <div style={{ borderTop: '1.5px solid oklch(0.86 0.028 75)', paddingTop: 16 }}>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'oklch(0.62 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'oklch(0.55 0.14 38 / 0.5)', fontSize: 8 }}>✦</span> Amenities &amp; Features
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
                    {stay.tags.map((tag, i) => {
                      const v = STICKER_VARIANTS[i % STICKER_VARIANTS.length]
                      const rot = STICKER_ROTATIONS[i % STICKER_ROTATIONS.length]
                      return (
                        <span
                          key={tag}
                          style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '5px 10px', borderRadius: 2,
                            fontSize: 7.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            background: v.bg, color: v.color, border: `1px solid ${v.border}`,
                            boxShadow: '0 1px 3px rgba(44,30,20,0.14), inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.06)',
                            transform: `rotate(${rot}deg)`,
                          }}
                        >
                          {tag}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SPOKE DETAILS ═══ */}
            {(stay.spokes.includes('work-friendly') && (stay.wifiSpeed || stay.hasDesk)) && (
              <SpokeDetail icon={<Wifi className="w-4 h-4" />} label="Work-Friendly" color="oklch(0.45 0.12 250)">
                {stay.wifiSpeed && <span>WiFi: {stay.wifiSpeed}</span>}
                {stay.hasDesk && <span>Dedicated workspace</span>}
              </SpokeDetail>
            )}
            {stay.petFriendly && (
              <SpokeDetail icon={<PawPrint className="w-4 h-4" />} label="Pet-Friendly" color="oklch(0.50 0.14 145)">
                {stay.petPolicy && <span>{stay.petPolicy}</span>}
              </SpokeDetail>
            )}
            {stay.rvHookup && stay.rvDetails && (
              <SpokeDetail icon={<Truck className="w-4 h-4" />} label="RV-Ready" color="oklch(0.50 0.14 60)">
                <span>{stay.rvDetails}</span>
              </SpokeDetail>
            )}
            {stay.evCharger && stay.evDetails && (
              <SpokeDetail icon={<Zap className="w-4 h-4" />} label="EV-Ready" color="oklch(0.50 0.14 200)">
                <span>{stay.evDetails}</span>
              </SpokeDetail>
            )}

            {/* Affiliate disclosure */}
            <div style={{ padding: '16px 18px 0', marginTop: 'auto' }}>
              <p style={{ fontSize: 9, lineHeight: 1.7, color: 'oklch(0.62 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', borderTop: '1px solid oklch(0.88 0.025 75)', paddingTop: 12 }}>
                Bookings through this link earn us a small commission at no extra cost to you — this helps keep our directory running and our recommendations independent.
              </p>
            </div>

            {/* ═══ RELATED STAYS (desktop, inside right panel) ═══ */}
            {related.length > 0 && (
              <div style={{ padding: '0 18px 32px', borderTop: '1px solid oklch(0.88 0.025 75)', marginTop: 20 }}>
                <div style={{ paddingTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: 'oklch(0.22 0.01 60)' }}>
                        More {categoryDisplay}s
                      </h2>
                      <p style={{ fontSize: 11, color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginTop: 3 }}>
                        Similar stays you might like
                      </p>
                    </div>
                    <Link href="/collection" style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      Browse All <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {related.map((r, i) => (
                      <div key={r.id} className="fade-up" style={{ transitionDelay: `${i * 80}ms` }}>
                        <StayCard stay={r} href={r.affiliateUrl} external index={i} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────── */}
      <div className="lg:hidden">
        {currentImage && (
          <div className="relative" style={{ height: 320 }}>
            <Image src={currentImage} alt={stay.title} fill sizes="100vw" className="object-cover" priority />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, oklch(0.10 0.02 60 / 0.82) 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0" style={{ padding: '0 20px 20px' }}>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: 'oklch(0.99 0.005 85)', marginBottom: 4, textShadow: '0 2px 10px rgba(0,0,0,0.4)', lineHeight: 1.1 }}>
                {stay.title}
              </h1>
              {stay.subtitle && (
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontStyle: 'italic', color: 'oklch(0.80 0.01 85)' }}>{stay.subtitle}</p>
              )}
              <p style={{ fontSize: 11, color: 'oklch(0.72 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginTop: 4 }}>
                {stay.location} · {stay.state}
              </p>
            </div>
          </div>
        )}

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Mobile CTA */}
          <div style={{ background: 'oklch(0.985 0.008 80)', border: '1px solid oklch(0.80 0.04 70)', borderRadius: 3, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: 'oklch(0.18 0.01 60)' }}>${stay.price}</span>
              <span style={{ fontSize: 13, color: 'oklch(0.58 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>/night</span>
            </div>
            <a
              href={stay.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: 14,
                background: 'oklch(0.55 0.14 38)', color: 'white',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                borderRadius: 2, textDecoration: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Book on {platformLabel} ↗
            </a>
          </div>

          {/* Mobile description */}
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {stay.description}
          </p>

          {/* Mobile fast facts */}
          {hasFastFacts && (
            <div style={{ borderTop: '1px solid oklch(0.85 0.025 75)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Made for', value: stay.bestFor },
                { label: 'Go in', value: stay.bestSeason },
                { label: 'The vibe', value: stay.vibe },
              ].filter((f) => f.value).map(({ label, value }) => (
                <div key={label}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</span>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontStyle: 'italic', color: 'oklch(0.22 0.01 60)', marginTop: 2, lineHeight: 1.4 }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Mobile stickers */}
          {stay.tags.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'oklch(0.62 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 10 }}>
                Amenities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {stay.tags.map((tag, i) => {
                  const v = STICKER_VARIANTS[i % STICKER_VARIANTS.length]
                  return (
                    <span key={tag} style={{ display: 'inline-flex', padding: '6px 11px', borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Plus Jakarta Sans, sans-serif', background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>
                      {tag}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile related stays */}
        {related.length > 0 && (
          <section style={{ background: 'oklch(0.99 0.005 85)', borderTop: '1px solid oklch(0.88 0.025 75)', padding: '40px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: 'oklch(0.22 0.01 60)' }}>
                  More {categoryDisplay}s
                </h2>
                <p style={{ fontSize: 12, color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginTop: 3 }}>
                  Similar stays you might like
                </p>
              </div>
              <Link href="/collection" style={{ fontSize: 12, fontWeight: 600, color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                Browse All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((r, i) => (
                <div key={r.id}>
                  <StayCard stay={r} href={r.affiliateUrl} external index={i} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  )
}

// ── Spoke detail card ────────────────────────────────────────────
function SpokeDetail({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 18px 0' }}>
      <div style={{ borderTop: '1px solid oklch(0.88 0.025 75)', paddingTop: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ color, marginTop: 1, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color, fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 3 }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: 'oklch(0.38 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
