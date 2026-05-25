'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, MapPinned, Navigation } from 'lucide-react'
import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import FilmstripSection from '@/components/FilmstripSection'
import RichTextRenderer from '@/components/RichTextRenderer'
import type { NormalizedJournalPost } from '@/lib/types'

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
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const radius = 18
  const circumference = 2 * Math.PI * radius
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
      <circle cx="26" cy="26" r={radius} className="compass-track" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        className="compass-progress"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform="rotate(-90 26 26)"
      />
      <g className="compass-needle" style={{ transform: `rotate(${needleAngle}deg)` }}>
        <polygon points="26,10 24.2,26 27.8,26" fill="oklch(0.55 0.14 38)" />
        <polygon points="26,42 24.2,26 27.8,26" fill="oklch(0.55 0.14 38 / 0.28)" />
      </g>
      <circle cx="26" cy="26" r="2.5" fill="oklch(0.55 0.14 38)" />
      <text x="26" y="49" className="compass-label">
        {Math.round(progress * 100)}%
      </text>
    </svg>
  )
}

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function PostmarkSVG({
  city,
  state,
  date,
  size = 78,
}: {
  city: string
  state: string
  date: string
  size?: number
}) {
  const cityUpper = (city || 'DISPATCH').toUpperCase()
  const stateUpper = (state || 'FIELD NOTES').toUpperCase()
  const id = slugId(`${cityUpper}-${stateUpper}-${date}-${size}`)
  const cityFontSize = cityUpper.length > 10 ? 5 : cityUpper.length > 7 ? 5.75 : 6.5

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="40" cy="40" r="37" fill="oklch(0.985 0.008 82)" />
      <circle
        cx="40"
        cy="40"
        r="37"
        fill="none"
        stroke="oklch(0.55 0.14 38)"
        strokeWidth="1.5"
        strokeDasharray="3 2.5"
      />
      <circle cx="40" cy="40" r="27" fill="none" stroke="oklch(0.55 0.14 38)" strokeWidth="0.75" />
      <defs>
        <path id={`pt-post-${id}`} d="M 10,40 A 30,30 0 0,1 70,40" />
        <path id={`pb-post-${id}`} d="M 10,40 A 30,30 0 0,0 70,40" />
      </defs>
      <text
        fill="oklch(0.55 0.14 38)"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize={cityFontSize}
        letterSpacing="2.5"
      >
        <textPath href={`#pt-post-${id}`} startOffset="50%" textAnchor="middle">
          {cityUpper}
        </textPath>
      </text>
      <text
        fill="oklch(0.55 0.14 38)"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="5.5"
        letterSpacing="1.6"
      >
        <textPath href={`#pb-post-${id}`} startOffset="50%" textAnchor="middle">
          {stateUpper}
        </textPath>
      </text>
      <text
        fill="oklch(0.55 0.14 38)"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        letterSpacing="0.6"
        x="40"
        y="43"
        textAnchor="middle"
        fontSize="6.5"
      >
        {date}
      </text>
      <text fill="oklch(0.55 0.14 38)" x="26" y="53" textAnchor="middle" fontSize="6">
        *
      </text>
      <text fill="oklch(0.55 0.14 38)" x="54" y="53" textAnchor="middle" fontSize="6">
        *
      </text>
    </svg>
  )
}

function formatPostmarkDate(dateStr: string): string {
  if (!dateStr) return 'OPEN FILE'
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return 'Date pending'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function locationLabel(post: NormalizedJournalPost) {
  return [post.city, post.state].filter(Boolean).join(', ') || 'Undisclosed location'
}

function coordinateLabel(post: NormalizedJournalPost) {
  if (post.latitude && post.longitude) return `${post.latitude} N / ${post.longitude} W`
  return 'Coordinates withheld'
}

interface JournalPostContentProps {
  post: NormalizedJournalPost
  relatedPosts: NormalizedJournalPost[]
}

export default function JournalPostContent({ post, relatedPosts }: JournalPostContentProps) {
  const postmarkDate = formatPostmarkDate(post.publishedAt)
  const hasLinkedStays = post.linkedStays.length > 0

  useEffect(() => {
    posthog.capture('journal_post_viewed', {
      post_slug: post.slug,
      post_title: post.title,
      post_location: [post.city, post.state].filter(Boolean).join(', ') || undefined,
      linked_stays_count: post.linkedStays.length,
    })
  }, [post.slug, post.title, post.city, post.state, post.linkedStays.length])

  return (
    <main className="journal-post-shell">
      <ReadingCompass />

      <header className="journal-post-hero">
        <Link href="/journal" className="journal-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to the dispatch board
        </Link>

        <div className="journal-post-hero__grid">
          <div className="journal-post-hero__copy">
            <p className="journal-kicker">Field packet</p>
            <div className="journal-post-hero__route">
              <span>{formatLongDate(post.publishedAt)}</span>
              <span>{locationLabel(post)}</span>
            </div>
            <h1>{post.title}</h1>
            {post.excerpt && <p className="journal-post-hero__dek">{post.excerpt}</p>}
          </div>

          <aside className="journal-post-telegram" aria-label="Dispatch metadata">
            <div className="journal-post-telegram__stamp">
              <PostmarkSVG city={post.city} state={post.state} date={postmarkDate} size={88} />
            </div>
            <dl>
              <div>
                <dt>Route</dt>
                <dd>{locationLabel(post)}</dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>{coordinateLabel(post)}</dd>
              </div>
              <div>
                <dt>Filed</dt>
                <dd>{formatLongDate(post.publishedAt)}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <figure className="journal-evidence-photo">
          <div className="journal-evidence-photo__image">
            {post.heroImageUrl ? (
              <Image
                src={post.heroImageUrl}
                alt={post.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 900px) 100vw, 980px"
                priority
              />
            ) : (
              <div className="journal-evidence-photo__fallback">
                <MapPinned size={36} aria-hidden="true" />
              </div>
            )}
          </div>
          <figcaption>
            {post.subtitle || 'Photographic note from the route.'}
          </figcaption>
        </figure>
      </header>

      <div className="journal-post-layout">
        <aside className="journal-post-instrument" aria-label="Reading instrument">
          <Navigation size={18} aria-hidden="true" />
          <p className="journal-kicker">Reader instrument</p>
          <p>Follow the packet from evidence to field notes, then out to related stays.</p>
          {hasLinkedStays && <span>{post.linkedStays.length} stay artifact{post.linkedStays.length === 1 ? '' : 's'} inside</span>}
        </aside>

        <article className="journal-article">
          {post.subtitle && <p className="journal-article__subtitle">{post.subtitle}</p>}
          <div className="journal-body">
            <RichTextRenderer content={post.content} />
          </div>
        </article>
      </div>

      {hasLinkedStays && (
        <div className="journal-stay-strip">
          <FilmstripSection stays={post.linkedStays} />
        </div>
      )}

      <section className="journal-seal" aria-label="End of dispatch">
        <div className="journal-seal__mark" aria-hidden="true">
          US
        </div>
        <p>Filed, checked, and sealed by UniqueStaysUSA.</p>
      </section>

      {relatedPosts.length > 0 && (
        <section className="journal-related" aria-labelledby="journal-related-title">
          <p className="journal-kicker">Next files</p>
          <h2 id="journal-related-title">Continue the route</h2>
          <div className="journal-related__grid">
            {relatedPosts.map((related, index) => (
              <Link key={related.slug} href={`/journal/${related.slug}`} className="journal-related-card">
                <span>File {String(index + 1).padStart(3, '0')}</span>
                <h3>{related.title}</h3>
                <p>{locationLabel(related)}</p>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
