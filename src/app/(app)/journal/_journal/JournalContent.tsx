'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin, Newspaper } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { NormalizedJournalPost } from '@/lib/types'

function formatPostmarkDate(dateStr: string): string {
  if (!dateStr) return 'OPEN FILE'
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

function formatTelegramDate(dateStr: string): string {
  if (!dateStr) return 'Date pending'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function locationLabel(post: NormalizedJournalPost) {
  return [post.city, post.state].filter(Boolean).join(', ') || 'Undisclosed location'
}

function coordinateLabel(post: NormalizedJournalPost) {
  if (post.latitude && post.longitude) return `${post.latitude} N / ${post.longitude} W`
  return locationLabel(post)
}

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

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
  const stateUpper = (state || 'FIELD NOTES').toUpperCase()
  const id = slugId(`${cityUpper}-${stateUpper}-${date}-${size}`)
  const cityFontSize = cityUpper.length > 10 ? 5 : cityUpper.length > 7 ? 5.75 : 6.5

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
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
        <path id={`pt-${id}`} d="M 10,40 A 30,30 0 0,1 70,40" />
        <path id={`pb-${id}`} d="M 10,40 A 30,30 0 0,0 70,40" />
      </defs>
      <text
        fill="oklch(0.55 0.14 38)"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize={cityFontSize}
        letterSpacing="2.5"
      >
        <textPath href={`#pt-${id}`} startOffset="50%" textAnchor="middle">
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
        <textPath href={`#pb-${id}`} startOffset="50%" textAnchor="middle">
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

function DispatchCard({
  post,
  index,
}: {
  post: NormalizedJournalPost
  index: number
}) {
  const hasImage = Boolean(post.heroImageUrl)
  const cardVariant = index === 0 && hasImage ? 'dispatch-dossier--lead' : 'dispatch-dossier--compact'
  const paperVariant = hasImage ? '' : ' dispatch-dossier--paper'
  const tilt = index % 4 === 0 ? '-0.55deg' : index % 4 === 1 ? '0.45deg' : index % 4 === 2 ? '-0.25deg' : '0.35deg'

  return (
    <Link href={`/journal/${post.slug}`} className="dispatch-dossier-link">
      <article
        className={`dispatch-dossier ${cardVariant}${paperVariant}`}
        style={{ '--tilt': tilt } as CSSProperties}
      >
        <div className="dispatch-dossier__pin" aria-hidden="true" />
        {hasImage ? (
          <div className="dispatch-dossier__image">
            <Image
              src={post.heroImageUrl}
              alt={post.title}
              fill
              sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className="dispatch-dossier__paper-map" aria-hidden="true">
            <MapPin size={22} aria-hidden="true" />
            <span>{coordinateLabel(post)}</span>
          </div>
        )}

        <div className="dispatch-dossier__body">
          <div className="dispatch-dossier__heading">
            <p className="journal-kicker">File {String(index + 2).padStart(3, '0')}</p>
            <div className="dispatch-dossier__postmark">
              <PostmarkSVG
                city={post.city}
                state={post.state}
                date={formatPostmarkDate(post.publishedAt)}
                size={hasImage ? 64 : 72}
              />
            </div>
          </div>
          <h2>{post.title}</h2>
          {post.excerpt && <p>{post.excerpt}</p>}
          <div className="dispatch-dossier__meta">
            <span>{locationLabel(post)}</span>
            <span>Open file</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function JournalContent({ posts }: { posts: NormalizedJournalPost[] }) {
  const featured = posts[0] ?? null
  const rest = posts.slice(1)
  const states = Array.from(new Set(posts.map((post) => post.state).filter(Boolean)))

  return (
    <main className="journal-index">
      <section className="journal-index-hero" aria-labelledby="journal-title">
        <div className="journal-ticker" aria-hidden="true">
          <span>Field notes</span>
          <span>Postmarked routes</span>
          <span>Vetted stays</span>
          <span>Slow travel</span>
        </div>

        <div className="journal-index-hero__grid">
          <div className="journal-index-hero__copy">
            <p className="journal-kicker">UniqueStaysUSA dispatch desk</p>
            <h1 id="journal-title">
              <span>The Journal</span>
              <span>is an archive</span>
              <span>of places</span>
              <span>with a pulse.</span>
            </h1>
            <p>
              Field reports, route notes, and stay-side observations from the stranger
              corners of the American map.
            </p>
          </div>

          <aside className="journal-manifest" aria-label="Journal archive manifest">
            <div>
              <span className="journal-manifest__label">Open files</span>
              <strong>{String(posts.length).padStart(2, '0')}</strong>
            </div>
            <div>
              <span className="journal-manifest__label">States logged</span>
              <strong>{String(states.length || 1).padStart(2, '0')}</strong>
            </div>
            <div>
              <span className="journal-manifest__label">Current brief</span>
              <strong>Go where the story is</strong>
            </div>
          </aside>
        </div>
      </section>

      {posts.length === 0 ? (
        <section className="journal-empty">
          <Newspaper size={34} aria-hidden="true" />
          <h2>The dispatch desk is still being assembled.</h2>
          <p>Check back soon for the first field report.</p>
        </section>
      ) : (
        <section className="journal-board" aria-label="Published dispatches">
          <div className="journal-board__header">
            <p className="journal-kicker">Pinned now</p>
            <h2>Latest from the board</h2>
          </div>

          {featured && (
            <Link href={`/journal/${featured.slug}`} className="featured-dispatch">
              <article>
                <div className="featured-dispatch__image">
                  {featured.heroImageUrl ? (
                    <Image
                      src={featured.heroImageUrl}
                      alt={featured.title}
                      fill
                      priority
                      sizes="(max-width: 900px) 100vw, 58vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="featured-dispatch__fallback">
                      <MapPin size={32} aria-hidden="true" />
                    </div>
                  )}
                  <div className="featured-dispatch__stamp">
                    <PostmarkSVG
                      city={featured.city}
                      state={featured.state}
                      date={formatPostmarkDate(featured.publishedAt)}
                      size={92}
                    />
                  </div>
                </div>

                <div className="featured-dispatch__copy">
                  <div className="featured-dispatch__telegram">
                    <span>Latest dispatch</span>
                    <span>{formatTelegramDate(featured.publishedAt)}</span>
                  </div>
                  <p className="journal-kicker">{coordinateLabel(featured)}</p>
                  <h2>{featured.title}</h2>
                  {featured.excerpt && <p>{featured.excerpt}</p>}
                  <span className="featured-dispatch__cta">
                    Read the field report <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </div>
              </article>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="journal-archive-board" aria-label="Filed dispatches">
              <div className="journal-archive-board__header">
                <p className="journal-kicker">Filed dispatches</p>
                <h2>Routes from the desk</h2>
              </div>
              <div className="journal-archive-board__grid">
                {rest.map((post, index) => (
                  <DispatchCard key={post.id} post={post} index={index} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
