'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2400&q=88&auto=format&fit=crop'

const EYEBROW = 'The Wayfinder Journal · Vol. 2 · 2026'
const LINE1 = 'Slow mornings.'
const LINE2 = 'Wild places.'
const SUB =
  'Stories from the extraordinary places we find — and the people brave enough to stay in them.'

const ACCENT = 'oklch(0.75 0.12 40)'

const POLAROIDS = [
  {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    alt: 'A green valley under soft mountain light',
    title: 'Where the road forgets itself',
    tag: 'Blue Ridge · Open file',
  },
  {
    src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    alt: 'Sunlit forest with a narrow path',
    title: 'Notes from the moss line',
    tag: 'Cascade route · Field desk',
  },
  {
    src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
    alt: 'A desert road stretching into warm evening light',
    title: 'The long way is the point',
    tag: 'Southwest · Latest dispatch',
  },
]

export default function JournalHero() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className={`journal-hero${visible ? ' is-visible' : ''}`} aria-label="Journal hero">
      {/* Ken Burns background */}
      <div className="journal-hero__bg">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={88}
          className="journal-hero__img"
        />
      </div>

      {/* Overlay gradient — warm cinematic */}
      <div className="journal-hero__overlay" />
      <div className="journal-hero__tint" />

      {/* Text — absolutely positioned on left */}
      <div className="journal-hero__text">
          {/* Eyebrow */}
          <div className="journal-hero__eyebrow">{EYEBROW}</div>

          {/* Headline */}
          <h1 className="journal-hero__headline">
            <span className="journal-hero__word">{LINE1}</span>
            <span className="journal-hero__word journal-hero__word--accent" style={{ color: ACCENT }}>
              {LINE2}
            </span>
          </h1>

          {/* Subline */}
          <p className="journal-hero__sub">{SUB}</p>

          {/* CTAs */}
          <div className="journal-hero__ctas">
            <Link href="#board" className="journal-hero__btn journal-hero__btn--primary">
              Browse All Stories &rarr;
            </Link>
            <Link href="#board" className="journal-hero__btn journal-hero__btn--ghost">
              This week&rsquo;s pick
            </Link>
          </div>
        </div>

        {/* Polaroid stage — full viewport overlay */}
        <div className="journal-hero__stage" aria-hidden="true">
          {/* SVG route lines */}
          <svg
            className="journal-hero__route-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Route lines — white dashed, connecting card positions */}
            <path
              className="journal-hero__route-path journal-hero__route-path--base"
              d="M 15 30 Q 30 55, 48 60"
            />
            <path
              className="journal-hero__route-path journal-hero__route-path--base"
              d="M 48 60 Q 65 35, 78 22"
            />
            {/* Animated draw paths */}
            <path
              className="journal-hero__route-path journal-hero__route-path--draw"
              d="M 15 30 Q 30 55, 48 60"
              style={{ '--path-len': 100, '--draw-delay': '1.8s' } as React.CSSProperties}
            />
            <path
              className="journal-hero__route-path journal-hero__route-path--draw"
              d="M 48 60 Q 65 35, 78 22"
              style={{ '--path-len': 80, '--draw-delay': '3.2s' } as React.CSSProperties}
            />
          </svg>

          {/* Polaroid 1 — left, mid-height */}
          <div className="journal-hero__polaroid journal-hero__polaroid--1">
            <div className="journal-hero__polaroid-frame">
              <Image
                src={POLAROIDS[0].src}
                alt={POLAROIDS[0].alt}
                fill
                sizes="280px"
                className="journal-hero__polaroid-img"
              />
            </div>
            <div className="journal-hero__polaroid-caption">
              <strong>{POLAROIDS[0].title}</strong>
              <span>{POLAROIDS[0].tag}</span>
            </div>
          </div>

          {/* Polaroid 2 — center, below midpoint */}
          <div className="journal-hero__polaroid journal-hero__polaroid--2">
            <div className="journal-hero__polaroid-frame">
              <Image
                src={POLAROIDS[1].src}
                alt={POLAROIDS[1].alt}
                fill
                sizes="280px"
                className="journal-hero__polaroid-img"
              />
            </div>
            <div className="journal-hero__polaroid-caption">
              <strong>{POLAROIDS[1].title}</strong>
              <span>{POLAROIDS[1].tag}</span>
            </div>
          </div>

          {/* Polaroid 3 — right, upper */}
          <div className="journal-hero__polaroid journal-hero__polaroid--3">
            <div className="journal-hero__polaroid-frame">
              <Image
                src={POLAROIDS[2].src}
                alt={POLAROIDS[2].alt}
                fill
                sizes="280px"
                className="journal-hero__polaroid-img"
              />
            </div>
            <div className="journal-hero__polaroid-caption">
              <strong>{POLAROIDS[2].title}</strong>
              <span>{POLAROIDS[2].tag}</span>
            </div>
          </div>
        </div>
    </section>
  )
}
