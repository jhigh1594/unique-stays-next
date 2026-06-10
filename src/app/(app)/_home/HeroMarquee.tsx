import type { CategoryConfig } from '@/lib/categories-config'

interface HeroMarqueeProps {
  categories: CategoryConfig[]
}

export default function HeroMarquee({ categories }: HeroMarqueeProps) {
  return (
    <div
      className="relative z-10 backdrop-blur-md"
      style={{
        background: 'oklch(0 0 0 / 0.4)',
        borderTop: '1px solid oklch(0.96 0.02 75 / 0.1)',
        borderBottom: '1px solid oklch(0.96 0.02 75 / 0.1)',
      }}
    >
      <div className="group flex overflow-hidden py-3.5">
        <div className="flex shrink-0 animate-marquee gap-10 whitespace-nowrap pr-10 group-hover:[animation-play-state:paused]">
          {[...categories, ...categories].map((c, i) => (
            <span
              key={i}
              className="flex items-center gap-2.5 text-sm"
              style={{ color: 'oklch(0.96 0.02 75 / 0.85)' }}
            >
              <span className="text-base">{c.emoji}</span>
              <span
                className="italic"
                style={{ fontFamily: 'var(--font-display)', color: 'oklch(0.86 0.08 55)' }}
              >
                {c.label}
              </span>
              <span style={{ color: 'oklch(0.96 0.02 75 / 0.4)' }}>— {c.count}</span>
              <span className="ml-10" style={{ color: 'oklch(0.96 0.02 75 / 0.2)' }}>
                &#10022;
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
