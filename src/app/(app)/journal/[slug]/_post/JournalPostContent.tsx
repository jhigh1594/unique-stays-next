'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import RichTextRenderer from '@/components/RichTextRenderer'
import FilmstripSection from '@/components/FilmstripSection'
import type { NormalizedJournalPost } from '@/lib/types'

// ─── ReadingCompass ────────────────────────────────────────────────────────────

function ReadingCompass() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      setProgress(pct)
      setVisible(scrollTop > 80)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const r = 18
  const circumference = 2 * Math.PI * r
  const dashoffset = circumference * (1 - progress)
  const needleAngle = progress * 360

  return (
    <svg
      className={`reading-compass${visible ? ' visible' : ''}`}
      viewBox="0 0 52 52"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="26" cy="26" r="24" className="compass-ring" />
      <circle cx="26" cy="26" r={r} className="compass-track" />
      <circle
        cx="26"
        cy="26"
        r={r}
        className="compass-progress"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform="rotate(-90 26 26)"
      />
      <g className="compass-needle" style={{ transform: `rotate(${needleAngle}deg)` }}>
        {/* North point — terracotta */}
        <polygon points="26,10 24.2,26 27.8,26" fill="#A84626" />
        {/* South point — muted */}
        <polygon points="26,42 24.2,26 27.8,26" fill="rgba(168,70,38,0.3)" />
      </g>
      <circle cx="26" cy="26" r="2.5" fill="#A84626" />
      <text x="26" y="49" className="compass-label">
        {Math.round(progress * 100)}%
      </text>
    </svg>
  )
}

// ─── PostmarkSVG ───────────────────────────────────────────────────────────────

function PostmarkSVG({
  city,
  state,
  date,
  size = 72,
}: {
  city: string
  state: string
  date: string
  size?: number
}) {
  const cityUpper = (city || 'DISPATCH').toUpperCase()
  const stateUpper = (state || '').toUpperCase()
  const cityFontSize = cityUpper.length > 8 ? 5.5 : cityUpper.length > 6 ? 6 : 7
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="37" fill="rgba(250,248,243,0.92)" />
      <circle
        cx="40"
        cy="40"
        r="37"
        fill="none"
        stroke="#A84626"
        strokeWidth="1.5"
        strokeDasharray="3 2.5"
      />
      <circle cx="40" cy="40" r="27" fill="none" stroke="#A84626" strokeWidth="0.75" />
      <defs>
        <path id={`pt-post-${city}`} d="M 10,40 A 30,30 0 0,1 70,40" />
        <path id={`pb-post-${city}`} d="M 10,40 A 30,30 0 0,0 70,40" />
      </defs>
      <text
        fill="#A84626"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="600"
        fontSize={cityFontSize}
        letterSpacing="2.5"
      >
        <textPath href={`#pt-post-${city}`} startOffset="50%" textAnchor="middle">
          {cityUpper}
        </textPath>
      </text>
      {stateUpper && (
        <text
          fill="#A84626"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="600"
          fontSize="6"
          letterSpacing="1.5"
        >
          <textPath href={`#pb-post-${city}`} startOffset="50%" textAnchor="middle">
            {stateUpper}
          </textPath>
        </text>
      )}
      <text
        fill="#A84626"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="600"
        letterSpacing="0.5"
        x="40"
        y="43"
        textAnchor="middle"
        fontSize="7"
      >
        {date}
      </text>
      <text fill="#A84626" x="26" y="52" textAnchor="middle" fontSize="6">
        ✦
      </text>
      <text fill="#A84626" x="54" y="52" textAnchor="middle" fontSize="6">
        ✦
      </text>
    </svg>
  )
}

function formatPostmarkDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

// ─── JournalPostContent ────────────────────────────────────────────────────────

interface JournalPostContentProps {
  post: NormalizedJournalPost
  relatedPosts: NormalizedJournalPost[]
}

export default function JournalPostContent({ post, relatedPosts }: JournalPostContentProps) {
  const postmarkDate = formatPostmarkDate(post.publishedAt)
  const hasCoords =
    post.latitude && post.longitude && post.latitude !== '' && post.longitude !== ''

  return (
    <main
      style={{ backgroundColor: '#F6F1E8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <ReadingCompass />
      {/* ── Dispatch Header ── */}
      <header
        style={{
          position: 'relative',
          maxWidth: 720,
          margin: '0 auto',
          padding: '64px 24px 40px',
        }}
      >
        {/* Postmark — absolute top-right */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 24,
            transform: 'rotate(-3deg)',
            opacity: 0.9,
          }}
        >
          <PostmarkSVG
            city={post.city}
            state={post.state}
            date={postmarkDate}
            size={72}
          />
        </div>

        {/* DISPATCH label */}
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#A84626',
            marginBottom: 8,
          }}
        >
          DISPATCH №001
        </p>

        {/* City / State */}
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#8A7D6E',
            marginBottom: hasCoords ? 4 : 0,
          }}
        >
          {post.city ? `${post.city.toUpperCase()}` : ''}
          {post.city && post.state ? ' · ' : ''}
          {post.state ? post.state.toUpperCase() : ''}
        </p>

        {/* Coordinates */}
        {hasCoords && (
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10,
              color: '#8A7D6E',
              letterSpacing: '0.05em',
              marginBottom: 0,
            }}
          >
            {post.latitude}° N · {post.longitude}° W
          </p>
        )}
      </header>

      {/* ── Polaroid Hero ── */}
      <section
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '10px 10px 44px',
            transform: 'rotate(1.5deg)',
            boxShadow:
              '0 4px 20px rgba(44,30,20,0.14), 0 16px 56px rgba(44,30,20,0.12), 4px 8px 32px rgba(44,30,20,0.10)',
            maxWidth: 640,
            width: '100%',
          }}
        >
          {/* Image container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              overflow: 'hidden',
            }}
          >
            {post.heroImageUrl && (
              <Image
                src={post.heroImageUrl}
                alt={post.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 720px) 100vw, 640px"
                priority
              />
            )}
          </div>

          {/* Polaroid caption */}
          {post.subtitle && (
            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: 'italic',
                fontSize: 13,
                color: '#2C2825',
                textAlign: 'center',
                marginTop: 12,
                marginBottom: 0,
                lineHeight: 1.4,
              }}
            >
              {post.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* ── Article ── */}
      <article
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Subtitle kicker */}
        {post.subtitle && (
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              fontVariant: 'small-caps',
              color: '#A84626',
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            ✦ {post.subtitle}
          </p>
        )}

        {/* H1 */}
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 'clamp(36px, 5vw, 56px)',
            color: '#2C2825',
            lineHeight: 1.15,
            maxWidth: 720,
            marginBottom: 40,
          }}
        >
          {post.title}
        </h1>

        {/* Body prose */}
        <div className="journal-body">
          <RichTextRenderer content={post.content} />
        </div>
      </article>

      {/* ── Filmstrip Divider ── */}
      {post.linkedStays.length > 0 && (
        <div style={{ marginTop: 56, marginBottom: 24 }}>
          <FilmstripSection stays={post.linkedStays} />
        </div>
      )}

      {/* ── Post Close — Wax Seal Area ── */}
      <div
        style={{
          maxWidth: 720,
          margin: '48px auto 0',
          padding: '0 24px 64px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: '#A84626',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          ✦
        </p>
        <hr
          style={{
            border: 'none',
            borderTop: '1.5px solid rgba(168,70,38,0.35)',
            marginBottom: 16,
          }}
        />
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#A84626',
          }}
        >
          VETTED ✦ UNIQUESTAYSUSA
        </p>
      </div>

      {/* ── More Dispatches ── */}
      {relatedPosts.length > 0 && (
        <section
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '0 24px 80px',
          }}
        >
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 28,
              color: '#2C2825',
              marginBottom: 32,
            }}
          >
            More Dispatches
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 24,
            }}
          >
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/journal/${related.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  style={{
                    background: 'white',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(44,30,20,0.10)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  {/* Related image */}
                  {related.heroImageUrl && (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                      <Image
                        src={related.heroImageUrl}
                        alt={related.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="300px"
                      />
                    </div>
                  )}

                  {/* Related card body */}
                  <div style={{ padding: '16px 20px' }}>
                    {(related.city || related.state) && (
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: '#8A7D6E',
                          marginBottom: 6,
                        }}
                      >
                        {[related.city, related.state].filter(Boolean).join(' · ').toUpperCase()}
                      </p>
                    )}
                    <h3
                      style={{
                        fontFamily: "'Fraunces', serif",
                        fontWeight: 400,
                        fontSize: 18,
                        color: '#2C2825',
                        lineHeight: 1.25,
                        marginBottom: 12,
                      }}
                    >
                      {related.title}
                    </h3>
                    <span
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#A84626',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Read →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
