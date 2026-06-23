import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import type { SpokeConfig } from '@/lib/types'

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

const STAMPS: Record<string, string> = {
  unique: 'SIGNATURE',
  'work-friendly': 'NOMAD DESK',
  'pet-friendly': 'WHOLE PACK',
  'rv-ready': 'FULL HOOKUP',
  'ev-ready': 'ON-SITE L2',
}

type LayoutSpec = {
  width: string
  offset?: string
  layout?: 'polaroid' | 'standard' | 'horizontal'
}

const LAYOUT: LayoutSpec[] = [
  { width: 'md:w-[57%]', layout: 'polaroid' },
  { width: 'md:w-[39%]', offset: 'md:mt-16', layout: 'standard' },
  { width: 'md:w-[40%]', layout: 'standard' },
  { width: 'md:w-[56%]', layout: 'standard' },
  { width: 'md:w-full', layout: 'horizontal' },
]

function Perforation() {
  return (
    <div className="container">
      <div className="border-t-2 border-dashed border-sand" />
    </div>
  )
}

function CollectionCard({
  spoke,
  index,
  spec,
}: {
  spoke: SpokeConfig
  index: number
  spec: LayoutSpec
}) {
  const stamp = STAMPS[spoke.slug] ?? 'COLLECTION'
  const isPolaroid = spec.layout === 'polaroid'
  const isHorizontal = spec.layout === 'horizontal'

  const cardInner = (
    <div
      className={`relative h-full transition-transform duration-300 group-hover:-translate-y-0.5 ${
        isPolaroid ? 'p-6 md:p-8' : 'p-7 md:p-9'
      }`}
      style={{
        background: 'oklch(0.99 0.005 85)',
        border: `1px solid oklch(0.88 0.02 75)`,
        boxShadow: '0 1px 4px oklch(0.22 0.01 60 / 0.05)',
      }}
    >
      <span
        className="absolute top-2 right-5 text-7xl font-black opacity-[0.04] select-none pointer-events-none font-display"
        style={{ color: spoke.accentColor }}
        aria-hidden="true"
      >
        {ROMAN[index]}
      </span>

      {isHorizontal ? (
        <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-10">
          <div
            className="relative shrink-0 overflow-hidden md:w-[42%]"
            style={{ aspectRatio: '16 / 10' }}
          >
            <Image
              src={spoke.heroImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <StampLabel emoji={spoke.heroEmoji} label={stamp} color={spoke.accentColor} />
            <CardCopy spoke={spoke} large />
          </div>
        </div>
      ) : (
        <>
          {isPolaroid && (
            <div
              className="relative mb-6 mx-auto max-w-md -rotate-2 transition-transform duration-300 group-hover:rotate-0 group-hover:-translate-y-1"
              style={{
                background: 'white',
                padding: '10px 10px 36px',
                boxShadow: '0 4px 20px rgba(44, 30, 20, 0.12), 0 1px 4px rgba(44, 30, 20, 0.08)',
              }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                <Image
                  src={spoke.heroImage}
                  alt={spoke.title}
                  fill
                  sizes="(max-width: 768px) 90vw, 480px"
                  className="object-cover"
                />
              </div>
              <p
                className="mt-2 text-center text-sm italic font-display"
                style={{ color: 'oklch(0.40 0.03 60)' }}
              >
                {spoke.tagline}
              </p>
            </div>
          )}

          {!isPolaroid && (
            <div
              className="relative mb-5 overflow-hidden"
              style={{ aspectRatio: '16 / 9', maxHeight: '180px' }}
            >
              <Image
                src={spoke.heroImage}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, oklch(0.99 0.005 85 / 0.15) 0%, transparent 55%)`,
                }}
              />
            </div>
          )}

          <StampLabel emoji={spoke.heroEmoji} label={stamp} color={spoke.accentColor} />
          <CardCopy spoke={spoke} large={isPolaroid} />
        </>
      )}
    </div>
  )

  return (
    <Link
      href={`/${spoke.slug}`}
      className={`group block ${spec.width} ${spec.offset ?? ''}`}
    >
      {cardInner}
    </Link>
  )
}

function StampLabel({
  emoji,
  label,
  color,
}: {
  emoji: string
  label: string
  color: string
}) {
  return (
    <div
      className="inline-flex items-center gap-2 px-2 py-0.5 mb-5"
      style={{ border: `1.5px solid ${color}`, borderRadius: '1px' }}
    >
      <span style={{ color, fontSize: '0.65rem' }}>{emoji}</span>
      <span
        className="text-[0.55rem] font-black tracking-[0.14em] uppercase font-body"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  )
}

function CardCopy({ spoke, large }: { spoke: SpokeConfig; large?: boolean }) {
  return (
    <>
      <h2
        className={`font-bold mb-2 max-w-lg group-hover:opacity-90 transition-opacity duration-200 font-display text-charcoal ${
          large ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
        }`}
        style={{ textWrap: 'balance' }}
      >
        {spoke.title}
      </h2>

      {!large && (
        <p
          className="mb-2 text-[0.95rem]"
          style={{ fontFamily: 'var(--font-caveat), Caveat, cursive', color: 'oklch(0.50 0.06 60)' }}
        >
          {spoke.tagline}
        </p>
      )}

      <p className="text-sm leading-relaxed max-w-lg mb-5 font-body text-[oklch(0.40_0.03_60)]">
        {spoke.description}
      </p>

      <p
        className="text-xs mb-6 font-body"
        style={{ color: 'oklch(0.55 0.03 60)' }}
      >
        {spoke.stats.slice(0, 2).map((stat, i) => (
          <span key={stat.label}>
            {i > 0 && <span className="mx-2 opacity-40">·</span>}
            <strong className="font-display" style={{ color: spoke.accentColor }}>
              {stat.value}
            </strong>{' '}
            {stat.label.toLowerCase()}
          </span>
        ))}
      </p>

      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all duration-200 font-body"
        style={{ color: spoke.accentColor }}
      >
        Explore collection <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </span>
    </>
  )
}

export default function CollectionsContent() {
  const spokes = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

  return (
    <div
      className="min-h-screen bg-cream"
      style={{
        backgroundImage:
          'radial-gradient(circle at 88% 4%, oklch(0.83 0.07 45 / 0.14), transparent 22rem)',
      }}
    >
      {/* Hero */}
      <section className="container pt-24 pb-14 md:pb-20">
        <div
          className="stamp-badge text-terracotta mb-8"
          style={{ borderRadius: '2px' }}
        >
          <span className="mr-1.5">✦</span>
          THE CATALOG
        </div>

        <h1
          className="text-4xl md:text-5xl lg:text-[clamp(2.75rem,5vw,3.75rem)] font-bold leading-[1.08] max-w-2xl font-display text-charcoal"
          style={{ letterSpacing: '-0.03em', textWrap: 'balance' }}
        >
          Pick the trip by its{' '}
          <span className="italic text-terracotta">texture</span>
        </h1>

        <p
          className="mt-4 text-[1.15rem]"
          style={{ fontFamily: 'var(--font-caveat), Caveat, cursive', color: 'oklch(0.50 0.04 60)' }}
        >
          five curated lenses on the same map
        </p>

        <p className="mt-6 text-base leading-relaxed max-w-xl font-body text-[oklch(0.40_0.03_60)]">
          Every collection is a different way into extraordinary — treehouses and domes,
          desks with a view, yards that welcome dogs, RV hookups, EV chargers. Browse by
          what actually matters for your trip.
        </p>
      </section>

      <Perforation />

      {/* Collection board */}
      <section className="container py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-5 md:gap-6">
          {spokes.map((spoke, i) => (
            <CollectionCard
              key={spoke.slug}
              spoke={spoke}
              index={i}
              spec={LAYOUT[i] ?? { width: 'md:w-full' }}
            />
          ))}
        </div>
      </section>

      <Perforation />

      {/* Postscript */}
      <section className="container py-14 md:py-16">
        <p
          className="mb-3 text-[1.25rem]"
          style={{ fontFamily: 'var(--font-caveat), Caveat, cursive', color: 'oklch(0.45 0.06 60)' }}
        >
          P.S.
        </p>
        <p className="text-sm leading-relaxed font-body text-[oklch(0.40_0.03_60)]">
          Want every stay in one place?{' '}
          <Link
            href="/collection"
            className="underline underline-offset-2 transition-colors duration-200 text-terracotta"
            style={{ textDecorationColor: 'oklch(0.55 0.14 38 / 0.3)' }}
          >
            Browse the full directory
          </Link>{' '}
          — or read field notes in the{' '}
          <Link
            href="/journal"
            className="underline underline-offset-2 transition-colors duration-200 text-terracotta"
            style={{ textDecorationColor: 'oklch(0.55 0.14 38 / 0.3)' }}
          >
            Journal
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
