'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  Calculator,
  Compass,
  MapPinned,
  Menu,
  PenLine,
  X,
} from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import NewsletterModal from '@/components/NewsletterModal'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import { TOOLS } from '@/lib/tools-config'

const SPOKES = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

/** Map icon name strings from config to actual Lucide components. */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  PenLine,
  Calculator,
  BadgeCheck,
  Compass,
}

/** Pages with a light top section. Nav links stay dark before scroll. */
const LIGHT_HERO_PREFIXES = ['/about', '/submit', '/privacy', '/disclosure'] as const

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

function hasLightHeroPath(pathname: string): boolean {
  return LIGHT_HERO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Perforation edge with a dashed SVG line. */
function Perforation() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: '8px' }}
      aria-hidden="true"
    >
      <svg width="100%" height="8" preserveAspectRatio="none" aria-hidden="true">
        <line
          x1="0" y1="4" x2="100%" y2="4"
          stroke="oklch(0.72 0.04 75 / 0.35)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
      </svg>
    </div>
  )
}

const TERRACOTTA = 'oklch(0.55 0.14 38)'
const INK = 'oklch(0.25 0.02 60)'
const INK_MID = 'oklch(0.50 0.06 60)'
const PAPER = 'oklch(0.975 0.012 85)'
const FOREST = 'oklch(0.38 0.08 145)'

function isHomePath(pathname: string): boolean {
  return pathname === '/' || pathname === ''
}

function scrollToNewsletterSection() {
  document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', '#newsletter')
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const pathname = usePathname()
  const isHome = isHomePath(pathname)

  const handleNewsletterNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false)
    if (isHome) {
      e.preventDefault()
      scrollToNewsletterSection()
      return
    }
    e.preventDefault()
    setNewsletterOpen(true)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isOnCollections = pathname === '/collections' || SPOKE_SLUGS.some((s) => pathname === `/${s}`)
  const isOnToolsPage = pathname === '/tools' || TOOLS.some((t) => pathname === `/${t.slug}`)
  const isDetailPage = pathname.startsWith('/stays/')
  const usesLightHeader = scrolled || isDetailPage
  const usesDarkNavText = usesLightHeader || hasLightHeroPath(pathname)

  /** Underlined link — matches the Journal / About pattern. */
  const flatNavLink = (href: string, label: string, isActive: boolean) => (
    <Link href={href}>
      <span
        className={`text-sm font-medium transition-colors duration-200 relative group ${
          isActive
            ? `text-[${TERRACOTTA}]`
            : usesDarkNavText
              ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
              : 'text-[oklch(0.90_0.01_85)] hover:text-white'
        }`}
      >
        {label}
        <span
          className={`absolute -bottom-1 left-0 h-0.5 bg-[oklch(0.55_0.14_38)] transition-all duration-300 ${
            isActive ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
        />
      </span>
    </Link>
  )

  return (
    <>
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:bg-[oklch(0.55_0.14_38)] focus:text-[oklch(0.99_0.005_85)] focus:outline-none"
      >
        Skip to content
      </a>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow] duration-500 ${
          usesLightHeader
            ? 'bg-[oklch(0.975_0.012_85/0.97)] backdrop-blur-md shadow-[0_1px_0_0_oklch(0.88_0.025_75)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="group transition-transform duration-300 hover:scale-105">
              <LogoMark className="h-16 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <nav
              className="hidden md:flex items-center gap-6"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              aria-label="Main navigation"
            >
              {flatNavLink('/collections', 'Collections', isOnCollections)}
              {flatNavLink('/journal', 'Journal', pathname === '/journal')}
              {flatNavLink('/tools', 'Tools', isOnToolsPage)}
              {flatNavLink('/about', 'About', pathname === '/about')}
              {flatNavLink('/submit', 'Submit a Stay', pathname === '/submit')}
            </nav>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <a
                href="/#newsletter"
                onClick={handleNewsletterNavClick}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[oklch(0.55_0.14_38)] text-[oklch(0.99_0.005_85)] hover:bg-[oklch(0.48_0.14_38)] transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.55_0.14_38)]"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Get Weekly Picks
              </a>
              <button
                className={`md:hidden p-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.55_0.14_38)] ${
                  usesDarkNavText
                    ? 'text-[oklch(0.40_0.03_60)] hover:bg-[oklch(0.93_0.025_75)]'
                    : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-label="Navigation menu">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[oklch(0.22_0.01_60/0.5)] animate-[fade-in_0.15s_ease-out]"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            className="absolute top-0 right-0 bottom-0 w-[min(22rem,calc(100vw-2rem))] flex flex-col pt-20 pb-8 overflow-y-auto animate-[slide-in-right_0.2s_ease-out]"
            style={{
              background: `linear-gradient(180deg, ${PAPER}, oklch(0.96 0.016 84))`,
              borderTop: `4px solid ${TERRACOTTA}`,
              boxShadow: '-18px 0 54px rgba(44, 30, 20, 0.18)',
            }}
          >
            {/* Collections */}
            <div className="px-5 mb-4">
              <Link href="/collections" onClick={() => setMobileOpen(false)}>
                <span
                  className="inline-flex items-center gap-1.5 text-[0.6rem] font-black tracking-[0.14em] uppercase border-2 px-2 py-1 mb-3"
                  style={{ borderColor: TERRACOTTA, color: TERRACOTTA }}
                >
                  <MapPinned className="h-3 w-3" aria-hidden="true" />
                  Collections
                </span>
              </Link>
              <p className="mb-3 text-lg leading-5 font-display font-black" style={{ color: INK }}>
                Pick the trip by its texture.
              </p>
              {SPOKES.map((spoke, i) => (
                <Link key={spoke.slug} href={`/${spoke.slug}`} onClick={() => setMobileOpen(false)}>
                  <div
                    className="flex items-center gap-3 px-1 py-2.5 transition-colors cursor-pointer"
                    style={{ color: INK }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center text-[0.62rem] font-display font-black flex-shrink-0 tabular-nums"
                      style={{ color: spoke.accentColor }}
                      aria-hidden="true"
                    >
                      {ROMAN[i]}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{spoke.title}</span>
                      <span className="mt-0.5 block text-[0.68rem] leading-4 font-medium" style={{ color: INK_MID }}>
                        {spoke.tagline}
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Perforation />

            {/* Free Tools */}
            <div className="px-5 mt-4 mb-4">
              <Link href="/tools" onClick={() => setMobileOpen(false)}>
                <span
                  className="inline-flex items-center gap-1.5 text-[0.6rem] font-black tracking-[0.14em] uppercase border-2 px-2 py-1 mb-3"
                  style={{ borderColor: FOREST, color: FOREST }}
                >
                  <Compass className="h-3 w-3" aria-hidden="true" />
                  Free Tools
                </span>
              </Link>
              <div className="grid grid-cols-1 gap-1.5">
                {TOOLS.map((tool) => {
                  const ToolIcon = ICON_MAP[tool.iconName]!

                  return (
                    <Link key={tool.slug} href={`/${tool.slug}`} onClick={() => setMobileOpen(false)}>
                      <div
                        className="flex items-center gap-3 py-2.5 transition-colors cursor-pointer"
                        style={{ color: INK }}
                      >
                        <span
                          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center"
                          style={{ color: INK_MID }}
                          aria-hidden="true"
                        >
                          <ToolIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-black">{tool.title}</span>
                            <span
                              className="text-[0.52rem] font-black tracking-[0.10em] uppercase"
                              style={{ color: 'oklch(0.68 0.04 75)' }}
                            >
                              {tool.stamp}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[0.68rem] leading-4 font-medium" style={{ color: INK_MID }}>
                            {tool.description}
                          </span>
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="h-px mx-5 mb-3" style={{ background: 'oklch(0.88 0.025 75)' }} />

            <nav
              className="flex flex-col px-5"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              aria-label="Page navigation"
            >
              {[
                { href: '/', label: 'Home' },
                { href: '/collection', label: 'The Collection' },
                { href: '/journal', label: 'Journal' },
                { href: '/about', label: 'About' },
                { href: '/submit', label: 'Submit a Stay' },
              ].map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  <span className="block py-2.5 px-2 text-sm font-medium text-[oklch(0.30_0.02_60)] hover:text-[oklch(0.55_0.14_38)] transition-colors rounded-sm">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto px-5 pt-4">
              <a
                href="/#newsletter"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full text-sm font-semibold bg-[oklch(0.55_0.14_38)] text-[oklch(0.99_0.005_85)] hover:bg-[oklch(0.48_0.14_38)] transition-colors cursor-pointer"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                onClick={handleNewsletterNavClick}
              >
                Get Weekly Picks
              </a>
            </div>
          </div>
        </div>
      )}

      <NewsletterModal open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />

      {/* Keyframe animations scoped to nav, with reduced-motion support. */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[slide-in-right_0\\.2s_ease-out\\],
          .animate-\\[fade-in_0\\.15s_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}
