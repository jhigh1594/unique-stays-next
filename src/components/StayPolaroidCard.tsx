'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { NormalizedStay } from '@/lib/types'

interface StayPolaroidCardProps {
  stay: NormalizedStay
  rotation?: number
}

const MAT_GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`

export default function StayPolaroidCard({ stay, rotation = 2 }: StayPolaroidCardProps) {
  const hasImage = Boolean(stay.imageUrl)

  return (
    <div className="polaroid-float not-prose">
      <div
        className="polaroid-card group"
        style={{
          width: 240,
          padding: '9px 9px 36px 9px',
          borderRadius: 2,
          background: 'white',
          backgroundImage: MAT_GRAIN,
          boxShadow: `3px 5px 14px rgba(44,30,20,0.16), 4.5px 18px 44px -6px rgba(44,30,20,0.20)`,
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease',
        } as CSSProperties}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 180, borderRadius: 1, overflow: 'hidden' }}>
          {hasImage ? (
            <Image
              src={stay.imageUrl}
              alt={stay.title}
              fill
              sizes="240px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'oklch(0.88 0.025 75)' }} />
          )}
          {/* Platform badge */}
          <div
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'oklch(0.55 0.14 38)',
              color: 'oklch(0.99 0.005 85)',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: 1,
            }}
          >
            ✦ {stay.platform}
          </div>
        </div>

        {/* Caption */}
        <div style={{ paddingTop: 10, paddingLeft: 2, paddingRight: 2 }}>
          <div
            style={{
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'oklch(0.22 0.01 60)',
              lineHeight: 1.3,
              marginBottom: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {stay.title}
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 10,
              color: 'oklch(0.55 0.03 60)',
              letterSpacing: '0.04em',
              marginBottom: 8,
            }}
          >
            {stay.location}
          </div>
          {stay.affiliateUrl ? (
            <a
              href={stay.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                display: 'block',
                background: 'oklch(0.55 0.14 38)',
                color: 'white',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textAlign: 'center',
                padding: '5px 8px',
                borderRadius: 1,
                textDecoration: 'none',
              }}
            >
              Book It →
            </a>
          ) : (
            <div
              style={{
                height: 22,
                background: 'oklch(0.88 0.025 75)',
                borderRadius: 1,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
