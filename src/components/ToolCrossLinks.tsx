import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TOOLS } from '@/lib/tools-config'

/**
 * Cross-link section displayed at the bottom of each tool page.
 * Links to the /tools hub and sibling tools — improves internal linking
 * and keeps users exploring the tool suite.
 */
export default function ToolCrossLinks({ currentSlug }: { currentSlug: string }) {
  const siblings = TOOLS.filter((t) => t.slug !== currentSlug)

  return (
    <section
      className="border-t border-[oklch(0.88_0.025_75)] py-12"
      style={{ background: 'oklch(0.96 0.015 85)' }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'oklch(0.38 0.08 145)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            More free tools
          </p>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
          >
            Explore other tools
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {siblings.map((tool) => (
            <Link key={tool.slug} href={`/${tool.slug}`}>
              <div
                className="group border rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background: 'oklch(0.99 0.005 85)',
                  borderColor: 'oklch(0.88 0.03 75)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[0.52rem] font-black tracking-[0.10em] uppercase"
                    style={{ color: 'oklch(0.38 0.08 145)' }}
                  >
                    {tool.stamp}
                  </span>
                </div>
                <h3
                  className="text-sm font-bold mb-1 group-hover:text-[oklch(0.55_0.14_38)] transition-colors"
                  style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                >
                  {tool.title}
                </h3>
                <p
                  className="text-xs leading-snug"
                  style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/tools">
            <span
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors hover:bg-[oklch(0.22_0.01_60)] hover:text-[oklch(0.99_0.005_85)]"
              style={{
                background: 'oklch(0.22 0.01 60)',
                color: 'oklch(0.99 0.005 85)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              View all tools <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
