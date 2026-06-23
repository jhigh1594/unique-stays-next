'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Users, ExternalLink } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { getPostHog } from '@/lib/posthog-lazy'
import { formatCapacitySummary } from '@/lib/stay-capacity'
import type { NormalizedStay } from '@/lib/types'

interface StayCardProps {
  stay: NormalizedStay
  featured?: boolean
  style?: CSSProperties
  accentColor?: string
  index?: number
  href?: string
  external?: boolean
}

const PLATFORM_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Airbnb: { bg: '#FFE4DE', text: '#FF5A5F', label: 'Airbnb' },
  VRBO: { bg: '#E0F0FF', text: '#1B5E9E', label: 'VRBO' },
  Wander: { bg: '#E8F5E9', text: '#2E7D32', label: 'Wander' },
  Direct: { bg: 'oklch(0.93 0.025 75)', text: 'oklch(0.40 0.03 60)', label: 'Direct' },
}

const TILTS = [-1.5, 1.2, -0.8, 1.8, -1.1, 0.7, -1.9, 1.4, -0.6, 2.0, -1.3, 0.9]

/** price=0/null means "scraped price unavailable" — render as such, never "$0". */
const hasStayPrice = (price: number | null | undefined): boolean => price != null && price > 0

const MAT_GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`

export default function StayCard({
  stay,
  featured = false,
  style,
  accentColor,
  index = 0,
  href,
  external = false,
}: StayCardProps) {
  void accentColor
  const platform = PLATFORM_STYLES[stay.platform] || PLATFORM_STYLES.Direct
  const tilt = TILTS[index % TILTS.length]
  const shadowX = tilt > 0 ? 3 : -3
  const linkHref = href ?? `/stays/${stay.slug}`
  const heroImage = stay.imageUrl || stay.galleryImages[0] || ''
  const caption = stay.subtitle?.trim() || stay.description?.trim() || ''

  const card = (
    <>
      {/* Polaroid frame */}
      <div
        className="stay-card"
        style={{
          '--card-tilt': `${tilt}deg`,
          padding: '6px 6px 14px 6px',
          borderRadius: '3px',
          background: 'white',
          backgroundImage: MAT_GRAIN,
          boxShadow: `${shadowX}px 5px 14px rgba(44, 30, 20, 0.16), ${shadowX * 1.5}px 18px 44px -6px rgba(44, 30, 20, 0.20)`,
          display: 'flex',
          flexDirection: 'column',
        } as CSSProperties}
      >
        {/* Photo */}
        <div
          className={`relative overflow-hidden ${featured ? 'h-44 sm:h-64' : 'h-36 sm:h-52'}`}
          style={{ borderRadius: '1px' }}
        >
          {heroImage ? (
            <Image
              src={heroImage}
              alt={stay.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center px-4 text-center"
              style={{
                background: 'linear-gradient(145deg, oklch(0.90 0.03 75), oklch(0.78 0.05 55))',
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: '0.85rem',
                color: 'oklch(0.45 0.04 55)',
              }}
            >
              Photo coming soon
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
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
                ✦ Pick
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
          </div>

          {/* Platform badge */}
          <div className="absolute top-3 right-3">
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

          {/* Price */}
          <div className="absolute bottom-3 right-3">
            <span
              className="px-2.5 py-1 text-sm font-bold text-white"
              style={{
                background: 'rgba(15,10,5,0.65)',
                backdropFilter: 'blur(4px)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                borderRadius: '2px',
              }}
            >
              {hasStayPrice(stay.price) ? `$${stay.price}` : 'Price unavailable'}{hasStayPrice(stay.price) && <span className="font-normal text-white/80 text-xs">/night</span>}
            </span>
          </div>
        </div>

        {/* Caption zone */}
        <div className="polaroid-caption relative pt-2 sm:pt-2.5 px-0.5 sm:px-1 flex flex-col">
          <div
            className="absolute bottom-1 right-1 pointer-events-none select-none"
            style={{ opacity: 0.07, color: 'oklch(0.30 0.06 50)' }}
            aria-hidden="true"
          >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2"/>
              <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="1"/>
              <path d="M4 24 Q13 19 22 24 Q31 29 40 24 Q49 19 58 24" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M4 32 Q13 27 22 32 Q31 37 40 32 Q49 27 58 32" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M4 40 Q13 35 22 40 Q31 45 40 40 Q49 35 58 40" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <div className="relative z-[1] flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {stay.category}
              </span>
              {stay.rating != null && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[oklch(0.72_0.10_40)] text-[oklch(0.72_0.10_40)]" />
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'oklch(0.30 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {stay.rating}
                  </span>
                  {stay.reviewCount != null && (
                    <span
                      className="text-xs"
                      style={{ color: 'oklch(0.60 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      ({stay.reviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>

            <h3
              className={`font-bold leading-tight mb-1 group-hover:text-[oklch(0.55_0.14_38)] transition-colors ${
                featured ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
              }`}
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              {stay.title}
            </h3>

            <div className="flex items-center gap-1 mb-1 sm:mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'oklch(0.55 0.14 38)' }} />
              <span
                className="text-xs"
                style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {stay.location}
              </span>
            </div>

            {caption && (
              <p
                className="text-xs leading-snug mb-1.5 sm:mb-2 line-clamp-2"
                style={{ color: 'oklch(0.48 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {caption}
              </p>
            )}

            {stay.tags.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1 mb-2.5">
                {stay.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      border: '1.5px solid oklch(0.70 0.04 60)',
                      borderRadius: '2px',
                      padding: '1px 5px',
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'oklch(0.48 0.04 60)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="hidden sm:flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" style={{ color: 'oklch(0.60 0.03 60)' }} />
                <span
                  className="text-xs"
                  style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {formatCapacitySummary(stay.bedrooms, stay.bathrooms, stay.sleeps)}
                </span>
              </div>
              <span
                className="inline-flex items-center gap-1 text-xs font-bold group-hover:gap-2 transition-all uppercase tracking-wider"
                style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.65rem' }}
              >
                See This Place
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const handleClick = async () => {
    const ph = await getPostHog()
    ph.capture('stay_card_clicked', {
      stay_slug: stay.slug,
      stay_title: stay.title,
      stay_location: stay.location,
      stay_platform: stay.platform,
      stay_price: stay.price,
      stay_category: stay.category,
      is_external: external,
    })
  }

  const linkProps = {
    className: 'group block h-full',
    style,
    'data-cursor': 'view',
    onClick: handleClick,
  }

  if (external) {
    return (
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer sponsored"
        {...linkProps}
      >
        {card}
      </a>
    )
  }

  return (
    <Link href={linkHref} {...linkProps}>
      {card as ReactNode}
    </Link>
  )
}
