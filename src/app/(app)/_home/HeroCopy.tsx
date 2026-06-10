import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const headline = ['Stay', 'somewhere', 'extraordinary'] as const

export interface HeroStat {
  value: number
  suffix: string
  label: string
}

interface HeroCopyProps {
  stats: HeroStat[]
}

export default function HeroCopy({ stats }: HeroCopyProps) {
  return (
    <div className="relative z-10 mx-auto flex min-h-[calc(100svh-80px)] w-[min(95%,1280px)] flex-col justify-end pb-10 pt-24 md:pb-16">
      <h1
        className="leading-[0.92] tracking-[-0.02em]"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3.25rem, 9vw, 10.5rem)',
          fontWeight: 300,
          color: 'oklch(0.96 0.02 75)',
        }}
      >
        {headline.map((word, i) => (
          <span key={i} className="mr-[0.25em] inline-block align-bottom">
            <span
              className={word === 'somewhere' ? 'italic' : undefined}
              style={
                word === 'somewhere'
                  ? { fontWeight: 400, color: 'oklch(0.86 0.08 55)' }
                  : undefined
              }
            >
              {word}
            </span>
          </span>
        ))}
      </h1>

      <div className="mt-7 flex max-w-xl flex-col gap-6">
        <p
          className="text-base leading-relaxed md:text-lg"
          style={{ color: 'oklch(0.96 0.02 75 / 0.8)', fontFamily: 'var(--font-body)' }}
        >
          A weekly field guide to the most unforgettable short-term rentals in the country —
          from treetop hideouts to coastal cabins worth the detour.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/collection">
            <span
              className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition hover:brightness-110 cursor-pointer"
              style={{
                background: 'oklch(0.55 0.14 38)',
                color: 'oklch(0.99 0.005 85)',
                boxShadow: '0 15px 40px -12px oklch(0.55 0.14 38 / 0.85)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Browse all stays
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <a href="#newsletter">
            <span
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/10 cursor-pointer"
              style={{
                border: '1px solid oklch(0.96 0.02 75 / 0.15)',
                background: 'oklch(0.96 0.02 75 / 0.05)',
                color: 'oklch(0.96 0.02 75)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Get weekly picks
            </span>
          </a>
        </div>
      </div>

      <div
        className="mt-6 grid grid-cols-3 rounded-2xl px-2 py-5 backdrop-blur-md md:max-w-2xl"
        style={{
          background: 'oklch(0 0 0 / 0.25)',
          border: '1px solid oklch(0.96 0.02 75 / 0.1)',
        }}
      >
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className="px-4 text-center md:text-left"
            style={{
              borderRight:
                idx < stats.length - 1
                  ? '1px solid oklch(0.96 0.02 75 / 0.1)'
                  : 'none',
            }}
          >
            <div
              className="text-3xl md:text-4xl tabular-nums"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                color: 'oklch(0.96 0.02 75)',
              }}
            >
              {s.value.toLocaleString()}
              {s.suffix}
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.2em] md:text-xs"
              style={{ color: 'oklch(0.96 0.02 75 / 0.6)', fontFamily: 'var(--font-body)' }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
