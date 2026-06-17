'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Wifi, PawPrint, Zap, Truck } from 'lucide-react'
import posthog from 'posthog-js'
import StayCard from '@/components/StayCard'
import { SPOKES_CONFIG } from '@/lib/spokes-config'
import type { NormalizedStay } from '@/lib/types'

/** price=0/null means "scraped price unavailable" — render as such, never "$0". */
const hasStayPrice = (price: number | null | undefined): boolean => price != null && price > 0

// ── Sticker design tokens ───────────────────────────────────────
const STICKER_VARIANTS = [
  { bg: 'oklch(0.965 0.018 78)', color: 'oklch(0.36 0.05 60)', border: 'oklch(0.82 0.03 72)' },
  { bg: 'oklch(0.945 0.028 58)', color: 'oklch(0.38 0.07 55)', border: 'oklch(0.80 0.04 58)' },
  { bg: 'oklch(0.936 0.032 148)', color: 'oklch(0.32 0.10 148)', border: 'oklch(0.76 0.07 148 / 0.7)' },
  { bg: 'oklch(0.955 0.024 85)', color: 'oklch(0.38 0.04 72)', border: 'oklch(0.80 0.03 80)' },
]
const STICKER_ROTATIONS = [-1.4, 0, 0.9, -0.6, 0, 1.2, 0, -1.4]
const POLAROID_ROTATIONS = [-2.2, 1.5, -0.8, 2.1]
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

function formatStayLocation(location: string, state: string): string {
  const city = location.split(',')[0]?.trim() || location
  return [city, state].filter(Boolean).join(', ')
}

function formatBedrooms(count: number): string {
  return `${count} ${count === 1 ? 'bedroom' : 'bedrooms'}`
}

function formatBathrooms(count: number): string {
  return `${count} ${count === 1 ? 'bath' : 'baths'}`
}

function formatReviewCount(count: number | null | undefined): string | null {
  if (count == null) return null
  return `${count} ${count === 1 ? 'review' : 'reviews'}`
}

function formatRatingLabel(rating: number | null | undefined, reviewCount: number | null | undefined): string | null {
  if (rating == null) return null
  const reviews = formatReviewCount(reviewCount)
  return reviews ? `Rated ${rating} out of 5 from ${reviews}` : `Rated ${rating} out of 5`
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

function PolaroidGalleryStrip({
  images,
  selectedIdx,
  onSelect,
  stayTitle,
  variant = 'desktop',
}: {
  images: string[]
  selectedIdx: number
  onSelect: (index: number) => void
  stayTitle: string
  variant?: 'desktop' | 'mobile'
}) {
  if (images.length <= 1) return null

  const isMobile = variant === 'mobile'

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 3,
        display: 'flex',
        gap: isMobile ? 10 : 8,
        padding: isMobile ? '14px 16px 16px' : '12px 14px 14px',
        background: 'oklch(0.06 0.02 60 / 0.84)',
        backdropFilter: 'blur(8px)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {images.map((img, i) => (
        <button
          key={`${img}-${i}`}
          onClick={() => onSelect(i)}
          aria-label={`View photo ${i + 1}`}
          style={{
            flex: isMobile ? '0 0 74px' : '0 0 clamp(58px, 18%, 92px)',
            background: 'white',
            padding: isMobile ? '4px 4px 13px' : '3px 3px 11px',
            cursor: 'pointer',
            border: 'none',
            boxShadow: selectedIdx === i
              ? '0 6px 24px rgba(168,70,38,0.5)'
              : '0 2px 10px rgba(0,0,0,0.4)',
            transform: selectedIdx === i
              ? 'rotate(0deg) scale(1.08)'
              : `rotate(${POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]}deg)`,
            outline: selectedIdx === i ? '2px solid oklch(0.55 0.14 38)' : 'none',
            outlineOffset: 1,
            transition: 'transform 0.2s, box-shadow 0.2s',
            position: 'relative',
            zIndex: selectedIdx === i ? 2 : 1,
            flexShrink: 0,
          }}
        >
          <div style={{ width: '100%', aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
            <Image
              src={img}
              alt={`${stayTitle} photo ${i + 1}`}
              fill
              sizes={isMobile ? '74px' : '92px'}
              className="object-cover"
            />
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
interface StayDetailContentProps {
  stay: NormalizedStay
  related: NormalizedStay[]
}

export default function StayDetailContent({ stay, related }: StayDetailContentProps) {
  useScrollReveal()

  useEffect(() => {
    posthog.capture('stay_viewed', {
      stay_slug: stay.slug,
      stay_title: stay.title,
      stay_location: stay.location,
      stay_platform: stay.platform,
      stay_price: stay.price,
      stay_category: stay.category,
      stay_region: stay.region,
      is_editors_pick: stay.editorsPick,
    })
  }, [stay.slug, stay.title, stay.location, stay.platform, stay.price, stay.category, stay.region, stay.editorsPick])

  const handleAffiliateClick = useCallback(() => {
    posthog.capture('affiliate_link_clicked', {
      stay_slug: stay.slug,
      stay_title: stay.title,
      stay_platform: stay.platform,
      stay_price: stay.price,
      affiliate_url: stay.affiliateUrl,
    })
  }, [stay.slug, stay.title, stay.platform, stay.price, stay.affiliateUrl])

  const allImages = [stay.imageUrl, ...stay.galleryImages].filter(Boolean)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const currentImage = allImages[selectedIdx] || ''

  const categoryDisplay = prettifyCategory(stay.category)
  const serialNo = generateSerial(stay.id, stay.region)
  const primarySpoke = stay.spokes.map((s) => SPOKES_CONFIG[s]).find(Boolean)
  const hasFastFacts = stay.bestFor || stay.bestSeason || stay.vibe
  const firstSentence = (text: string) => { const s = text.split('.')[0]; return s ? s + '.' : '' }
  const pullQuote = stay.editorNote || (stay.body ? firstSentence(stay.body) : (stay.description ? firstSentence(stay.description) : ''))

  const now = new Date()
  const postmarkDate = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .replace(' ', ' · ').toUpperCase()

  const PLATFORM_LABELS: Record<string, string> = {
    Airbnb: 'Airbnb', VRBO: 'VRBO', Wander: 'Wander', Direct: 'Direct',
  }
  const platformLabel = PLATFORM_LABELS[stay.platform] ?? stay.platform
  const compactLocation = formatStayLocation(stay.location, stay.state)
  const bedroomLabel = formatBedrooms(stay.bedrooms)
  const bathroomLabel = formatBathrooms(stay.bathrooms)
  const sleepsLabel = `Sleeps ${stay.sleeps}`
  const reviewLabel = formatReviewCount(stay.reviewCount)
  const ratingLabel = formatRatingLabel(stay.rating, stay.reviewCount)
  const priceCaveat = `Final price shown on ${platformLabel}`
  const mobileFactsSummary = `${compactLocation} · ${bedroomLabel} · ${bathroomLabel} · ${sleepsLabel}`

  return (
    <div style={{ background: 'oklch(0.90 0.028 75)', minHeight: '100vh', paddingTop: 80 }}>

      {/* ── DESKTOP SPLIT FRAME ─────────────────────────────────── */}
      <div className="hidden lg:block">
        <div
          style={{
            display: 'flex', overflow: 'hidden',
            height: 'calc(100dvh - 80px)', minHeight: 500,
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

            <PolaroidGalleryStrip
              images={allImages}
              selectedIdx={selectedIdx}
              onSelect={setSelectedIdx}
              stayTitle={stay.title}
            />
          </div>

          {/* ── RIGHT: SCROLLABLE PANEL ── */}
          <div style={{ flex: 1, background: 'oklch(0.975 0.012 85)', overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Nav-clearance zone + breadcrumb */}
            <div style={{ padding: '16px 18px 0' }}>
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
            <div style={{ padding: '0 18px 24px', position: 'sticky', top: 16, zIndex: 10, background: 'oklch(0.975 0.012 85)' }}>
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
                    Curated Stay
                  </span>
                </div>

                {/* Ticket body */}
                <div style={{ position: 'relative', zIndex: 1, padding: '12px 14px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.62 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 3 }}>
                      Passage
                    </div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: 'oklch(0.18 0.01 60)', lineHeight: 1.12, letterSpacing: '-0.015em', marginBottom: 6 }}>
                      One-of-a-Kind {categoryDisplay}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                      {[
                        { label: 'Region', value: stay.region },
                        { label: 'Location', value: `${stay.location.split(',')[0]}, ${stay.state}` },
                        { label: 'Bedrooms', value: `${stay.bedrooms} ${stay.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}` },
                        { label: 'Bathrooms', value: `${stay.bathrooms} ${stay.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}` },
                        { label: 'Capacity', value: `Sleeps ${stay.sleeps}` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 6.8, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'oklch(0.65 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.28 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</span>
                        </div>
                      ))}
                    </div>

                  </div>

                  {stay.rating != null && (
                    <div style={{
                      position: 'relative',
                      flexShrink: 0,
                      minWidth: 88,
                      padding: 3,
                      background: 'oklch(0.985 0.008 80 / 0.34)',
                      border: '1.5px solid oklch(0.55 0.14 38 / 0.54)',
                      borderRadius: 2,
                      boxShadow: 'inset 0 0 0 1px oklch(0.55 0.14 38 / 0.12), 1.5px 1.5px 0 oklch(0.80 0.04 70 / 0.32)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      textAlign: 'center',
                      transform: 'rotate(-0.9deg)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'relative',
                        border: '1px dashed oklch(0.55 0.14 38 / 0.42)',
                        padding: '3px 6px 4px',
                      }}>
                        <div style={{ fontSize: 6.1, fontWeight: 900, letterSpacing: '0.17em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38 / 0.72)', marginBottom: 2 }}>
                          Guest Rated
                        </div>
                        <div style={{ width: '100%', borderTop: '1px solid oklch(0.55 0.14 38 / 0.4)', margin: '0 0 3px' }} />
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, color: 'oklch(0.55 0.14 38)' }}>
                          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.06em' }}>
                            {stay.rating}
                          </span>
                          <span style={{ fontSize: 7.5, fontWeight: 900, lineHeight: 1, letterSpacing: '0.02em', transform: 'translateY(-2px)' }}>/5</span>
                        </div>
                        <div style={{ width: '100%', borderTop: '1px solid oklch(0.55 0.14 38 / 0.38)', margin: '4px 0 0' }} />
                        {stay.reviewCount != null && (
                          <div style={{ fontSize: 7.7, fontWeight: 850, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'oklch(0.44 0.045 60)', marginTop: 2, whiteSpace: 'nowrap' }}>
                            {stay.reviewCount} reviews
                          </div>
                        )}
                      </div>
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
                    <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.62 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Nightly Fare</div>
                    <div>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: 'oklch(0.18 0.01 60)', letterSpacing: '-0.02em', lineHeight: 1 }}>{hasStayPrice(stay.price) ? `$${stay.price}` : 'Price unavailable'}</span>
                      {hasStayPrice(stay.price) && <span style={{ fontSize: 11, color: 'oklch(0.58 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginLeft: 3 }}>/night</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.62 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    via {platformLabel}
                  </div>
                </div>

                {/* Stub */}
                <div style={{ position: 'relative', zIndex: 1, background: 'oklch(0.975 0.01 78)', padding: '12px 14px 13px' }}>
                  <a
                    href={stay.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    data-cursor="view"
                    onClick={handleAffiliateClick}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      width: '100%', padding: 12,
                      background: 'oklch(0.55 0.14 38)', color: 'white',
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: 1, textDecoration: 'none',
                      boxShadow: '0 2px 0 oklch(0.38 0.12 38), 0 4px 12px oklch(0.55 0.14 38 / 0.28)',
                    }}
                  >
                    Book on {platformLabel} &nbsp; ↗
                  </a>
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
                  {stay.body || stay.description}
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

            {/* ═══ AREA GUIDE ═══ */}
            {stay.areaGuide && (
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

                  {/* Compass needle */}
                  <div style={{
                    position: 'absolute', top: 14, right: 14, zIndex: 2,
                    width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'oklch(0.55 0.14 38 / 0.3)', fontSize: 22,
                    fontFamily: 'Fraunces, serif', transform: 'rotate(-12deg)',
                    pointerEvents: 'none',
                  }}>
                    ⊹
                  </div>

                  {/* Section label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, fontSize: 7.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative', zIndex: 1 }}>
                    ✦ &nbsp; The Neighborhood
                  </div>

                  <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11.5, lineHeight: 1.88, color: 'oklch(0.40 0.02 60)', position: 'relative', zIndex: 1 }}>
                    {stay.areaGuide}
                  </p>
                </div>
              </div>
            )}

            {/* ═══ FAQs ═══ */}
            {stay.faqs && stay.faqs.length > 0 && (
              <div style={{ padding: '10px 18px 0' }}>
                <div style={{ borderTop: '1.5px solid oklch(0.86 0.028 75)', paddingTop: 16 }}>
                  <div style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: 'oklch(0.55 0.14 38 / 0.5)', fontSize: 8 }}>✦</span> Questions &amp; Answers
                  </div>
                  <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stay.faqs.map((faq, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <dt style={{ fontFamily: 'Fraunces, serif', fontSize: 13.5, fontWeight: 600, color: 'oklch(0.22 0.01 60)', lineHeight: 1.4 }}>
                          {faq.question}
                        </dt>
                        <dd style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11.5, lineHeight: 1.7, color: 'oklch(0.40 0.02 60)', margin: 0 }}>
                          {faq.answer}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
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
        {/* Mobile breadcrumb */}
        <div style={{ padding: '12px 16px 0' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Link href="/" style={{ color: 'oklch(0.50 0.03 60)', textDecoration: 'none' }}>
              Home
            </Link>
            <span style={{ color: 'oklch(0.70 0.02 60)' }}>·</span>
            {primarySpoke ? (
              <Link href={`/${primarySpoke.slug}`} style={{ color: 'oklch(0.50 0.03 60)', textDecoration: 'none' }}>
                {primarySpoke.title}
              </Link>
            ) : (
              <Link href="/collection" style={{ color: 'oklch(0.50 0.03 60)', textDecoration: 'none' }}>
                Directory
              </Link>
            )}
            <span style={{ color: 'oklch(0.70 0.02 60)' }}>·</span>
            <span style={{ color: 'oklch(0.55 0.14 38)' }}>{stay.title.length > 25 ? stay.title.slice(0, 25) + '…' : stay.title}</span>
          </nav>
        </div>

        {currentImage && (
          <div>
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
            <PolaroidGalleryStrip
              images={allImages}
              selectedIdx={selectedIdx}
              onSelect={setSelectedIdx}
              stayTitle={stay.title}
              variant="mobile"
            />
          </div>
        )}

        <div style={{ padding: '20px 16px 112px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Mobile booking decision */}
          <section
            aria-label="Mobile booking details"
            data-testid="mobile-booking-details"
            style={{
              background: 'oklch(0.985 0.008 80)',
              border: '1px solid oklch(0.80 0.04 70)',
              borderRadius: 3,
              padding: 16,
              boxShadow: '0 1px 0 oklch(0.99 0.005 85) inset, 0 10px 28px oklch(0.42 0.08 55 / 0.10)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'oklch(0.62 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 3 }}>
                  Nightly fare
                </div>
                <div>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: 'oklch(0.18 0.01 60)', letterSpacing: '-0.02em', lineHeight: 1 }}>{hasStayPrice(stay.price) ? `$${stay.price}` : 'Price unavailable'}</span>
                  {hasStayPrice(stay.price) && <span style={{ fontSize: 13, color: 'oklch(0.58 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginLeft: 3 }}>/night</span>}
                </div>
              </div>
              {stay.rating != null && (
                <div aria-label={ratingLabel ?? undefined} style={{ textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 800, color: 'oklch(0.55 0.14 38)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                    {stay.rating}<span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 800, color: 'oklch(0.55 0.14 38 / 0.78)', marginLeft: 3 }}>★</span>
                  </div>
                  {reviewLabel && (
                    <div style={{ fontSize: 10.5, color: 'oklch(0.52 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap' }}>
                      {reviewLabel}
                    </div>
                  )}
                </div>
              )}
            </div>

            <a
              href={stay.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleAffiliateClick}
              aria-label={`Book ${stay.title} on ${platformLabel}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', minHeight: 56, padding: '0 14px',
                background: 'oklch(0.55 0.14 38)', color: 'white',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                borderRadius: 2, textDecoration: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
                boxShadow: '0 2px 0 oklch(0.38 0.12 38), 0 5px 14px oklch(0.55 0.14 38 / 0.24)',
              }}
            >
              Book on {platformLabel} ↗
            </a>

            <div style={{ marginTop: 8, fontSize: 11, color: 'oklch(0.56 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.5 }}>
              {priceCaveat}
            </div>

            <div style={{ marginTop: 13, paddingTop: 12, borderTop: '1px dashed oklch(0.80 0.04 70)', fontSize: 12, lineHeight: 1.55, color: 'oklch(0.32 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}>
              <span aria-label={`Stay facts: ${mobileFactsSummary}`}>{mobileFactsSummary}</span>
            </div>
          </section>

          {/* Mobile description */}
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'oklch(0.35 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {stay.body || stay.description}
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

          {/* Mobile area guide */}
          {stay.areaGuide && (
            <div style={{ borderTop: '1px solid oklch(0.85 0.025 75)', paddingTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11 }}>✦</span> The Neighborhood
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'oklch(0.38 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {stay.areaGuide}
              </p>
            </div>
          )}

          {/* Mobile FAQs */}
          {stay.faqs && stay.faqs.length > 0 && (
            <div style={{ borderTop: '1px solid oklch(0.85 0.025 75)', paddingTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11 }}>✦</span> Questions &amp; Answers
              </div>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {stay.faqs.map((faq, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <dt style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 600, color: 'oklch(0.22 0.01 60)', lineHeight: 1.4 }}>
                      {faq.question}
                    </dt>
                    <dd style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13.5, lineHeight: 1.7, color: 'oklch(0.38 0.02 60)', margin: 0 }}>
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
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

        <div
          aria-label="Mobile sticky booking bar"
          data-testid="mobile-sticky-booking"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
            background: 'oklch(0.985 0.008 80 / 0.96)',
            borderTop: '1px solid oklch(0.80 0.04 70)',
            boxShadow: '0 -12px 30px oklch(0.30 0.04 55 / 0.16)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 750, color: 'oklch(0.18 0.01 60)', lineHeight: 1 }}>{hasStayPrice(stay.price) ? `$${stay.price}` : 'Price unavailable'}</span>
              {hasStayPrice(stay.price) && <span style={{ fontSize: 10.5, color: 'oklch(0.58 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>/night</span>}
            </div>
            {stay.rating != null && (
              <div aria-label={ratingLabel ?? undefined} style={{ marginTop: 2, fontSize: 10.5, color: 'oklch(0.50 0.04 60)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stay.rating} ★{reviewLabel ? ` · ${reviewLabel}` : ''}
              </div>
            )}
          </div>
          <a
            href={stay.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleAffiliateClick}
            aria-label={`Book ${stay.title} on ${platformLabel} from sticky bar`}
            style={{
              flexShrink: 0,
              minHeight: 46,
              minWidth: 112,
              padding: '0 18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'oklch(0.55 0.14 38)',
              color: 'white',
              borderRadius: 2,
              textDecoration: 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 0 oklch(0.38 0.12 38)',
            }}
          >
            Book ↗
          </a>
        </div>
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
