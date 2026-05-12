'use client'

import Image from 'next/image'

const ASSET_BASE = '/prototypes/journal-hero-pixel-match'
const HERO_IMAGE = `${ASSET_BASE}/background.png`

const EYEBROW = 'The Wayfinder Journal · Vol. 2 · 2026'
const LINE1 = 'Slow mornings.'
const LINE2 = 'Wild places.'
const SUB =
  'Stories from the extraordinary places we find — and the people brave enough to stay in them.'

const POLAROIDS = [
  {
    className: 'journal-hero__polaroid--lighthouse',
    pinClassName: 'journal-hero__pin--lighthouse',
    src: `${ASSET_BASE}/polaroid-lighthouse.png`,
    alt: 'A lighthouse on a rocky coast at sunset',
    caption: (
      <>
        where the wild
        <br />
        meets the sea
      </>
    ),
    mark: '♡',
  },
  {
    className: 'journal-hero__polaroid--treehouse',
    pinClassName: 'journal-hero__pin--treehouse',
    src: `${ASSET_BASE}/polaroid-treehouse.png`,
    alt: 'A warm treehouse tucked into a forest',
    caption: (
      <>
        rooted in nature,
        <br />
        reaching for magic
      </>
    ),
    mark: '❧',
  },
  {
    className: 'journal-hero__polaroid--dome',
    pinClassName: 'journal-hero__pin--dome',
    src: `${ASSET_BASE}/polaroid-dome.png`,
    alt: 'A glowing geodesic dome beneath mountains',
    caption: (
      <>
        wake up to
        <br />
        wonder
      </>
    ),
    mark: '♡',
  },
]

export default function JournalHero() {
  return (
    <section className="journal-hero" aria-label="Journal hero">
      <div className="journal-hero__wrap">
        <div className="journal-hero__artboard">
          <div className="journal-hero__bg" aria-hidden="true">
            <Image
              src={HERO_IMAGE}
              alt=""
              fill
              priority
              sizes="100vw"
              className="journal-hero__img"
            />
          </div>
          <div className="journal-hero__forest" aria-hidden="true" />

          <svg className="journal-hero__routes" viewBox="0 0 1606 979" aria-hidden="true">
            <path
              className="journal-hero__route-path journal-hero__route-path--light"
              d="M 428 831 C 448 740, 504 706, 579 735 C 642 762, 705 778, 781 744 C 842 717, 870 651, 893 607"
            />
            <path
              className="journal-hero__route-path journal-hero__route-path--dark"
              d="M 786 479 C 815 426, 863 431, 889 452 C 926 481, 900 532, 944 542 C 1009 556, 1044 492, 1056 452"
            />
            <path
              className="journal-hero__route-path journal-hero__route-path--dark"
              d="M 1142 397 C 1114 330, 1139 245, 1191 223 C 1232 206, 1268 224, 1273 256"
            />
          </svg>

          <div className="journal-hero__text">
            <div className="journal-hero__eyebrow">{EYEBROW}</div>

            <h1 className="journal-hero__headline">
              <span>{LINE1}</span>
              <span className="journal-hero__headline-accent">{LINE2}</span>
            </h1>

            <p className="journal-hero__sub">{SUB}</p>
          </div>

          {POLAROIDS.map((polaroid) => (
            <article
              className={`journal-hero__polaroid ${polaroid.className}`}
              key={polaroid.className}
              aria-hidden="true"
            >
              <div className="journal-hero__photo">
                <Image
                  src={polaroid.src}
                  alt={polaroid.alt}
                  fill
                  sizes="(max-width: 700px) 22vw, 320px"
                  className="journal-hero__photo-img"
                />
              </div>
              <div className="journal-hero__caption">{polaroid.caption}</div>
              <div className="journal-hero__mark">{polaroid.mark}</div>
            </article>
          ))}

          {POLAROIDS.map((polaroid) => (
            <span
              className={`journal-hero__pin ${polaroid.pinClassName}`}
              key={polaroid.pinClassName}
              aria-hidden="true"
            />
          ))}
          <span className="journal-hero__pin journal-hero__pin--route-a" aria-hidden="true" />
          <span className="journal-hero__pin journal-hero__pin--route-b" aria-hidden="true" />

          <div className="journal-hero__grain" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
