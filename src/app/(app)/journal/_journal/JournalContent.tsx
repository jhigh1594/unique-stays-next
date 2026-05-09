'use client'
import Link from 'next/link'
import Image from 'next/image'
import type { NormalizedJournalPost } from '@/lib/types'

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatPostmarkDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

// ─── PostmarkSVG ────────────────────────────────────────────────────────────

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
      <circle cx="40" cy="40" r="37" fill="none" stroke="#A84626" strokeWidth="1.5" strokeDasharray="3 2.5" />
      <circle cx="40" cy="40" r="27" fill="none" stroke="#A84626" strokeWidth="0.75" />
      <defs>
        <path id={`pt-${city}`} d="M 10,40 A 30,30 0 0,1 70,40" />
        <path id={`pb-${city}`} d="M 10,40 A 30,30 0 0,0 70,40" />
      </defs>
      <text
        fill="#A84626"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="600"
        fontSize={cityFontSize}
        letterSpacing="2.5"
      >
        <textPath href={`#pt-${city}`} startOffset="50%" textAnchor="middle">
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
          <textPath href={`#pb-${city}`} startOffset="50%" textAnchor="middle">
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

// ─── JournalContent ─────────────────────────────────────────────────────────

export default function JournalContent({ posts }: { posts: NormalizedJournalPost[] }) {
  const featured = posts[0] ?? null
  const rest = posts.slice(1)

  return (
    <main
      style={{
        background: '#F6F1E8',
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: 'clamp(72px, 12vw, 140px) clamp(24px, 5vw, 64px) clamp(48px, 7vw, 96px)',
          overflow: 'hidden',
        }}
      >
        {/* Ghost watermark */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 600,
            fontSize: 'clamp(64px, 13vw, 168px)',
            color: '#A84626',
            opacity: 0.032,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: '0.05em',
          }}
        >
          DISPATCHES
        </span>

        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              flex: 1,
              maxWidth: '80px',
              height: '1px',
              background: '#A84626',
              opacity: 0.4,
            }}
          />
          <span
            style={{
              color: '#A84626',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            ✦ UniqueStaysUSA ✦
          </span>
          <span
            style={{
              flex: 1,
              maxWidth: '80px',
              height: '1px',
              background: '#A84626',
              opacity: 0.4,
            }}
          />
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            lineHeight: 1.0,
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0',
          }}
        >
          <span
            style={{
              fontStyle: 'italic',
              color: '#8A7D6E',
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 400,
              display: 'block',
            }}
          >
            The
          </span>
          <span
            style={{
              fontStyle: 'normal',
              color: '#A84626',
              fontSize: 'clamp(72px, 12vw, 144px)',
              fontWeight: 300,
              lineHeight: 0.9,
              display: 'block',
            }}
          >
            Journal
          </span>
        </h1>

        {/* Subhead */}
        <p
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '16px',
            color: '#8A7D6E',
            marginBottom: '12px',
            maxWidth: '420px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Field dispatches from extraordinary places across America.
        </p>

        {/* Meta line */}
        <p
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '11px',
            color: '#8A7D6E',
            letterSpacing: '0.08em',
          }}
        >
          {posts.length} dispatch{posts.length !== 1 ? 'es' : ''} on record
        </p>
      </header>

      {/* ── Board ── */}
      <section
        style={{
          borderTop: '5px solid #D4C4A0',
          borderBottom: '5px solid #D4C4A0',
          backgroundColor: '#EDE7D9',
          backgroundImage:
            'radial-gradient(circle, rgba(44,40,37,0.09) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          boxShadow: 'inset 0 2px 20px rgba(44,40,37,0.09)',
          padding: '52px clamp(24px, 5vw, 64px) 80px',
        }}
      >
        {/* Board label */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#8A7D6E',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: '48px',
          }}
        >
          ✦ Latest Dispatches ✦
        </p>

        {posts.length === 0 ? (
          /* ── Empty state ── */
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '60px 24px',
            }}
          >
            <div
              className="dispatch-card"
              style={{
                padding: '48px 40px',
                maxWidth: '380px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '18px',
                  color: '#8A7D6E',
                  lineHeight: 1.6,
                }}
              >
                The first dispatch is coming soon. ✦
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Featured dispatch ── */}
            {featured && (
              <Link
                href={`/journal/${featured.slug}`}
                style={{ display: 'block', marginBottom: '40px', textDecoration: 'none' }}
              >
                <article className="dispatch-card dispatch-card--featured">
                  {/* Image */}
                  <div className="card-img-wrap">
                    {featured.heroImageUrl && (
                      <Image
                        src={featured.heroImageUrl}
                        alt={featured.title}
                        fill
                        sizes="(max-width: 760px) 100vw, 58vw"
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    {/* Latest stamp */}
                    <div className="latest-stamp">
                      Latest
                      <br />
                      Dispatch
                    </div>
                    {/* Postmark */}
                    <div className="card-postmark">
                      <PostmarkSVG
                        city={featured.city}
                        state={featured.state}
                        date={formatPostmarkDate(featured.publishedAt)}
                        size={84}
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="card-body-inner" style={{ padding: '32px 28px 28px' }}>
                    {/* Coordinates */}
                    <p
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: '10px',
                        color: '#8A7D6E',
                        letterSpacing: '0.08em',
                        marginBottom: '8px',
                      }}
                    >
                      {featured.latitude && featured.longitude
                        ? `${featured.latitude}°N · ${featured.longitude}°W`
                        : `${featured.city}, ${featured.state}`}
                    </p>

                    {/* Dispatch number */}
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#A84626',
                        marginBottom: '10px',
                      }}
                    >
                      №{String(1).padStart(3, '0')}
                    </p>

                    {/* Title */}
                    <h2
                      style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontSize: 'clamp(22px, 3vw, 32px)',
                        fontWeight: 400,
                        color: '#2C2825',
                        lineHeight: 1.2,
                        marginBottom: '12px',
                      }}
                    >
                      {featured.title}
                    </h2>

                    {/* Excerpt */}
                    {featured.excerpt && (
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '14px',
                          color: '#8A7D6E',
                          lineHeight: 1.65,
                          marginBottom: '24px',
                        }}
                      >
                        {featured.excerpt}
                      </p>
                    )}

                    {/* Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(212,196,160,0.5)',
                        paddingTop: '16px',
                        marginTop: 'auto',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '11px',
                          color: '#8A7D6E',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {featured.city}, {featured.state}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#A84626',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Read Dispatch →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* ── Masonry grid ── */}
            {rest.length > 0 && (
              <div className="cards-grid" style={{ marginTop: '16px' }}>
                {rest.map((post, i) => {
                  const dispatchNum = i + 2
                  return (
                    <Link
                      key={post.id}
                      href={`/journal/${post.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <article className="dispatch-card">
                        {/* Image */}
                        <div className="card-img-wrap">
                          {post.heroImageUrl && (
                            <Image
                              src={post.heroImageUrl}
                              alt={post.title}
                              fill
                              sizes="(max-width: 600px) 100vw, (max-width: 1020px) 50vw, 33vw"
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                          {/* Postmark */}
                          <div className="card-postmark">
                            <PostmarkSVG
                              city={post.city}
                              state={post.state}
                              date={formatPostmarkDate(post.publishedAt)}
                              size={72}
                            />
                          </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '28px 20px 20px' }}>
                          {/* Coordinates */}
                          <p
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                              fontSize: '10px',
                              color: '#8A7D6E',
                              letterSpacing: '0.08em',
                              marginBottom: '6px',
                            }}
                          >
                            {post.latitude && post.longitude
                              ? `${post.latitude}°N · ${post.longitude}°W`
                              : `${post.city}, ${post.state}`}
                          </p>

                          {/* Dispatch number */}
                          <p
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              color: '#A84626',
                              marginBottom: '8px',
                            }}
                          >
                            №{String(dispatchNum).padStart(3, '0')}
                          </p>

                          {/* Title */}
                          <h2
                            style={{
                              fontFamily: "'Fraunces', Georgia, serif",
                              fontSize: 'clamp(18px, 2.2vw, 22px)',
                              fontWeight: 400,
                              color: '#2C2825',
                              lineHeight: 1.25,
                              marginBottom: '10px',
                            }}
                          >
                            {post.title}
                          </h2>

                          {/* Excerpt */}
                          {post.excerpt && (
                            <p
                              style={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: '13px',
                                color: '#8A7D6E',
                                lineHeight: 1.6,
                                marginBottom: '18px',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {post.excerpt}
                            </p>
                          )}

                          {/* Footer */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderTop: '1px solid rgba(212,196,160,0.5)',
                              paddingTop: '12px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: '10px',
                                color: '#8A7D6E',
                                letterSpacing: '0.06em',
                              }}
                            >
                              {post.city}, {post.state}
                            </span>
                            <span
                              style={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#A84626',
                                letterSpacing: '0.04em',
                              }}
                            >
                              Read Dispatch →
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
