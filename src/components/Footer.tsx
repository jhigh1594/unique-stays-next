import Link from 'next/link'
import { Share2, Mail } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'

const SPOKES = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

export default function Footer() {
  return (
    <footer className="bg-[oklch(0.22_0.01_60)] text-[oklch(0.88_0.025_75)]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <div className="mb-5">
              <LogoMark src="/logo-illustrated.png" className="h-20 w-auto" />
            </div>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: 'oklch(0.65 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              We scour Airbnb, VRBO, Wander, and beyond to find the stays that make you say &ldquo;I can&apos;t believe this is a real place.&rdquo; No hotels. No ordinary. Just extraordinary.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-[oklch(0.55_0.14_38)]"
                style={{ background: 'oklch(0.30 0.01 60)' }}
                aria-label="Instagram"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@uniquestaysusa.com"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-[oklch(0.55_0.14_38)]"
                style={{ background: 'oklch(0.30 0.01 60)' }}
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Collections Column */}
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-widest mb-5"
              style={{ color: 'oklch(0.72_0.10_40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Collections
            </h4>
            <ul className="space-y-3">
              {SPOKES.map((spoke) => (
                <li key={spoke.slug}>
                  <Link href={`/${spoke.slug}`}>
                    <span
                      className="flex items-center gap-2 text-sm transition-colors hover:text-[oklch(0.72_0.10_40)]"
                      style={{ color: 'oklch(0.60 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      <span>{spoke.heroEmoji}</span>
                      <span>{spoke.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore Column */}
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-widest mb-5"
              style={{ color: 'oklch(0.72_0.10_40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'All Stays', href: '/collection' },
                { label: 'Journal', href: '/journal' },
                { label: 'Treehouses', href: '/collection?category=treehouses' },
                { label: 'Geodesic Domes', href: '/collection?category=geodesic-domes' },
                { label: 'Houseboats', href: '/collection?category=houseboats' },
                { label: 'Lighthouses', href: '/collection?category=lighthouses' },
                { label: 'Converted Barns', href: '/collection?category=converted-barns' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span
                      className="text-sm transition-colors hover:text-[oklch(0.72_0.10_40)]"
                      style={{ color: 'oklch(0.60 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-widest mb-5"
              style={{ color: 'oklch(0.72_0.10_40)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Info
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'How It Works', href: '/about#how-it-works' },
                { label: 'Submit a Stay', href: '/submit' },
                { label: 'Affiliate Disclosure', href: '/disclosure' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span
                      className="text-sm transition-colors hover:text-[oklch(0.72_0.10_40)]"
                      style={{ color: 'oklch(0.60 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[oklch(0.30_0.01_60)]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-xs text-center sm:text-left"
            style={{ color: 'oklch(0.45 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            © 2024–2026 Unique Stays USA. All rights reserved.
          </p>
          <p
            className="text-xs text-center sm:text-right max-w-md"
            style={{ color: 'oklch(0.40 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            <span className="text-[oklch(0.55_0.14_38)] font-semibold">Affiliate Disclosure:</span> We earn a small commission when you book through our links, at no extra cost to you. This helps us keep the lights on.
          </p>
        </div>
      </div>
    </footer>
  )
}
