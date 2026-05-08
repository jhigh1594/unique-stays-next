import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-lg">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: 'oklch(0.93 0.025 75)' }}
          >
            <Compass className="w-10 h-10" style={{ color: 'oklch(0.55 0.14 38)' }} />
          </div>
          <h1
            className="text-7xl font-bold mb-4"
            style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.88 0.025 75)' }}
          >
            404
          </h1>
          <h2
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
          >
            Lost in the wilderness
          </h2>
          <p
            className="text-base mb-8 leading-relaxed"
            style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            The page you&apos;re looking for has wandered off the map. But don&apos;t worry — there are hundreds of extraordinary stays waiting to be discovered.
          </p>
          <Link href="/">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:gap-3"
              style={{
                background: 'oklch(0.55 0.14 38)',
                color: 'oklch(0.99 0.005 85)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Back to Home <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
