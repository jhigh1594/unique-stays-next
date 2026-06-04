'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import NewsletterModal from '@/components/NewsletterModal'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'

const SPOKES = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

const TOOLS = [
  { slug: 'listing-generator', title: 'The Copy Desk', stamp: 'COPY' },
  { slug: 'build-cost-calculator', title: 'Build Cost Ledger', stamp: 'COST' },
  { slug: 'unique-score', title: 'Stamp of Approval', stamp: 'GRADE' },
  { slug: 'vacation-quiz', title: 'The Compass', stamp: 'FIND' },
] as const

/** Pages with a light top section — nav links stay dark before scroll. */
const LIGHT_HERO_PREFIXES = ['/about', '/submit', '/privacy', '/disclosure'] as const

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

function hasLightHeroPath(pathname: string): boolean {
  return LIGHT_HERO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Postmark watermark SVG — positioned behind dropdown content */
function PostmarkWatermark({ rotation = -12 }: { rotation?: number }) {
  return (
    <svg
      className="absolute pointer-events-none select-none"
      style={{
        right: '-12px',
        top: '-8px',
        width: '140px',
        height: '140px',
        transform: `rotate(${rotation}deg)`,
        opacity: 0.045,
      }}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="1" />
      <circle cx="60" cy="60" r="38" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
      <text x="60" y="36" textAnchor="middle" fontSize="7" fontWeight="700" letterSpacing="0.15em" fill="currentColor">DISPATCH</text>
      <text x="60" y="88" textAnchor="middle" fontSize="6" letterSpacing="0.1em" fill="currentColor">U.S.A.</text>
      <line x1="16" y1="60" x2="104" y2="60" stroke="currentColor" strokeWidth="0.75" />
    </svg>
  )
}

/** Perforation edge — dashed SVG line */
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

const DROPDOWN_SHADOW = '0 12px 40px -8px rgba(44, 30, 20, 0.18), 0 2px 8px rgba(44, 30, 20, 0.06)'
const TERRACOTTA = 'oklch(0.55 0.14 38)'
const INK = 'oklch(0.25 0.02 60)'
const INK_MID = 'oklch(0.50 0.06 60)'
const PAPER = 'oklch(0.975 0.012 85)'
const PAPER_ALT = 'oklch(0.96 0.015 85)'
const RULE = 'oklch(0.72 0.04 75)'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const collectionsRef = useRef<HTMLDivElement>(null)
  const toolsRef = useRef<HTMLDivElement>(null)
  const collectionsButtonRef = useRef<HTMLButtonElement>(null)
  const toolsButtonRef = useRef<HTMLButtonElement>(null)

  // Track focus position inside dropdown for arrow-key navigation
  const [focusIndex, setFocusIndex] = useState(-1)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Click-outside closes dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        collectionsRef.current && !collectionsRef.current.contains(target) &&
        toolsRef.current && !toolsRef.current.contains(target)
      ) {
        setCollectionsOpen(false)
        setToolsOpen(false)
        setFocusIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeAll = useCallback(() => {
    setCollectionsOpen(false)
    setToolsOpen(false)
    setFocusIndex(-1)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    closeAll()
    setMobileOpen(false)
  }, [pathname, closeAll])

  const isOnSpoke = SPOKE_SLUGS.some((s) => pathname === `/${s}`)
  const isOnTool = TOOLS.some((t) => pathname === `/${t.slug}`)
  const isDetailPage = pathname.startsWith('/stays/')
  const usesLightHeader = scrolled || isDetailPage
  const usesDarkNavText = usesLightHeader || hasLightHeroPath(pathname)

  const navTextClass = (isActive: boolean) =>
    `flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? `text-[${TERRACOTTA}]`
        : usesDarkNavText
          ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
          : 'text-[oklch(0.90_0.01_85)] hover:text-white'
    }`

  // Keyboard handler for dropdown triggers
  const handleTriggerKeyDown = (
    e: React.KeyboardEvent,
    type: 'collections' | 'tools',
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (type === 'collections') {
        setCollectionsOpen((prev) => !prev)
        setToolsOpen(false)
      } else {
        setToolsOpen((prev) => !prev)
        setCollectionsOpen(false)
      }
      setFocusIndex(0)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (type === 'collections') {
        if (!collectionsOpen) setCollectionsOpen(true)
        setToolsOpen(false)
      } else {
        if (!toolsOpen) setToolsOpen(true)
        setCollectionsOpen(false)
      }
      setFocusIndex(0)
    } else if (e.key === 'Escape') {
      closeAll()
      if (type === 'collections') collectionsButtonRef.current?.focus()
      else toolsButtonRef.current?.focus()
    }
  }

  // Keyboard handler for items inside dropdown
  const handleItemKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    total: number,
    triggerRef: React.RefObject<HTMLButtonElement | null>,
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (index + 1) % total
      setFocusIndex(next)
      ;(e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = index === 0 ? total - 1 : index - 1
      setFocusIndex(prev)
      ;(e.currentTarget.parentElement?.children[prev] as HTMLElement)?.focus()
    } else if (e.key === 'Escape') {
      closeAll()
      triggerRef.current?.focus()
    } else if (e.key === 'Tab') {
      closeAll()
    }
  }

  return (
    <>
      {/* Skip to content — a11y */}
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
              {/* ── Collections Dropdown ── */}
              <div ref={collectionsRef} className="relative">
                <button
                  ref={collectionsButtonRef}
                  className={navTextClass(isOnSpoke)}
                  onClick={() => {
                    setCollectionsOpen((prev) => !prev)
                    setToolsOpen(false)
                    setFocusIndex(-1)
                  }}
                  onKeyDown={(e) => handleTriggerKeyDown(e, 'collections')}
                  aria-expanded={collectionsOpen}
                  aria-haspopup="menu"
                >
                  Collections
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {collectionsOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[380px] overflow-hidden animate-[dropdown-in_0.15s_ease-out]"
                    style={{
                      background: PAPER,
                      borderTop: `2.5px solid ${TERRACOTTA}`,
                      boxShadow: DROPDOWN_SHADOW,
                    }}
                    role="menu"
                    aria-label="Collections"
                  >
                    <div className="relative" style={{ color: 'oklch(0.40 0.06 38)' }}>
                      <PostmarkWatermark rotation={-15} />

                      <div className="relative z-10 px-5 pt-4 pb-2">
                        <span
                          className="inline-block text-[0.6rem] font-bold tracking-[0.16em] uppercase border-2 px-2 py-0.5 mb-3"
                          style={{ borderColor: TERRACOTTA, color: TERRACOTTA }}
                          role="presentation"
                        >
                          Destinations
                        </span>

                        <div className="flex flex-col" role="group">
                          {SPOKES.map((spoke, i) => (
                            <Link
                              key={spoke.slug}
                              href={`/${spoke.slug}`}
                              role="menuitem"
                              onKeyDown={(e) => handleItemKeyDown(e, i, SPOKES.length, collectionsButtonRef)}
                              onClick={closeAll}
                            >
                              <div
                                className="flex items-center gap-3 px-2 py-2.5 transition-colors group cursor-pointer rounded-sm outline-none focus-visible:bg-[oklch(0.96_0.015_85)]"
                                style={{ color: INK }}
                              >
                                <span
                                  className="text-lg font-display font-black opacity-[0.08] group-hover:opacity-[0.15] transition-opacity w-5 text-right flex-shrink-0 tabular-nums"
                                  aria-hidden="true"
                                >
                                  {ROMAN[i]}
                                </span>
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                  style={{ background: spoke.accentColor }}
                                  aria-hidden="true"
                                />
                                <span className="text-sm font-semibold flex-1 group-hover:text-[oklch(0.55_0.14_38)] transition-colors">
                                  {spoke.title}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Perforation />
                  </div>
                )}
              </div>

              {/* Journal link */}
              <Link href="/journal">
                <span
                  className={`text-sm font-medium transition-colors duration-200 relative group ${
                    pathname === '/journal'
                      ? `text-[${TERRACOTTA}]`
                      : usesDarkNavText
                        ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
                        : 'text-[oklch(0.90_0.01_85)] hover:text-white'
                  }`}
                >
                  Journal
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[oklch(0.55_0.14_38)] transition-all duration-300 ${
                      pathname === '/journal' ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </span>
              </Link>

              {/* ── Field Kit Dropdown ── */}
              <div ref={toolsRef} className="relative">
                <button
                  ref={toolsButtonRef}
                  className={navTextClass(isOnTool)}
                  onClick={() => {
                    setToolsOpen((prev) => !prev)
                    setCollectionsOpen(false)
                    setFocusIndex(-1)
                  }}
                  onKeyDown={(e) => handleTriggerKeyDown(e, 'tools')}
                  aria-expanded={toolsOpen}
                  aria-haspopup="menu"
                >
                  Field Kit
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {toolsOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[240px] overflow-hidden animate-[dropdown-in_0.15s_ease-out]"
                    style={{
                      background: PAPER,
                      borderTop: `2.5px solid ${TERRACOTTA}`,
                      boxShadow: DROPDOWN_SHADOW,
                    }}
                    role="menu"
                    aria-label="Field Kit"
                  >
                    <div className="px-5 pt-4 pb-2">
                      <span
                        className="inline-block text-[0.6rem] font-bold tracking-[0.14em] uppercase border-2 px-2 py-0.5 mb-3"
                        style={{ borderColor: INK_MID, color: INK_MID }}
                        role="presentation"
                      >
                        Supplies
                      </span>

                      <div className="flex flex-col" role="group">
                        {TOOLS.map((tool, i) => (
                          <Link
                            key={tool.slug}
                            href={`/${tool.slug}`}
                            role="menuitem"
                            onKeyDown={(e) => handleItemKeyDown(e, i, TOOLS.length, toolsButtonRef)}
                            onClick={closeAll}
                          >
                            <div
                              className="flex items-center gap-3 px-2 py-2.5 transition-colors group cursor-pointer rounded-sm outline-none focus-visible:bg-[oklch(0.96_0.015_85)]"
                              style={{ color: INK }}
                            >
                              <span
                                className="text-[0.55rem] font-bold tracking-[0.08em] uppercase border px-1.5 py-1 flex-shrink-0 opacity-50 group-hover:opacity-80 transition-opacity"
                                style={{ borderColor: RULE, color: INK_MID }}
                              >
                                {tool.stamp}
                              </span>
                              <span className="text-sm font-semibold flex-1 group-hover:text-[oklch(0.55_0.14_38)] transition-colors">
                                {tool.title}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Perforation />
                  </div>
                )}
              </div>

              {/* Remaining flat links */}
              {[
                { href: '/about', label: 'About' },
                { href: '/submit', label: 'Submit a Stay' },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`text-sm font-medium transition-colors duration-200 relative group ${
                      pathname === link.href
                        ? `text-[${TERRACOTTA}]`
                        : usesDarkNavText
                          ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
                          : 'text-[oklch(0.90_0.01_85)] hover:text-white'
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-[oklch(0.55_0.14_38)] transition-all duration-300 ${
                        pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </span>
                </Link>
              ))}
            </nav>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <a
                href={isHome ? '#newsletter' : undefined}
                onClick={isHome ? undefined : (e) => { e.preventDefault(); setNewsletterOpen(true) }}
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

      {/* ── Mobile Menu ── */}
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
            className="absolute top-0 right-0 bottom-0 w-80 flex flex-col pt-20 pb-8 overflow-y-auto animate-[slide-in-right_0.2s_ease-out]"
            style={{
              background: PAPER,
              borderTop: `3px solid ${TERRACOTTA}`,
              boxShadow: '-8px 0 32px rgba(44, 30, 20, 0.12)',
            }}
          >
            {/* Destinations */}
            <div className="px-5 mb-3">
              <span
                className="inline-block text-[0.6rem] font-bold tracking-[0.16em] uppercase border-2 px-2 py-0.5 mb-3"
                style={{ borderColor: TERRACOTTA, color: TERRACOTTA }}
              >
                Destinations
              </span>
              {SPOKES.map((spoke, i) => (
                <Link key={spoke.slug} href={`/${spoke.slug}`} onClick={() => setMobileOpen(false)}>
                  <div
                    className="flex items-center gap-3 px-2 py-2.5 transition-colors cursor-pointer rounded-sm"
                    style={{ color: INK }}
                  >
                    <span
                      className="text-base font-display font-black opacity-[0.08] w-5 text-right flex-shrink-0 tabular-nums"
                      aria-hidden="true"
                    >
                      {ROMAN[i]}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 opacity-60"
                      style={{ background: spoke.accentColor }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold">{spoke.title}</span>
                  </div>
                </Link>
              ))}
            </div>

            <Perforation />

            {/* Supplies */}
            <div className="px-5 mt-3 mb-3">
              <span
                className="inline-block text-[0.6rem] font-bold tracking-[0.14em] uppercase border-2 px-2 py-0.5 mb-3"
                style={{ borderColor: INK_MID, color: INK_MID }}
              >
                Supplies
              </span>
              {TOOLS.map((tool) => (
                <Link key={tool.slug} href={`/${tool.slug}`} onClick={() => setMobileOpen(false)}>
                  <div
                    className="flex items-center gap-3 px-2 py-2.5 transition-colors cursor-pointer rounded-sm"
                    style={{ color: INK }}
                  >
                    <span
                      className="text-[0.55rem] font-bold tracking-[0.08em] uppercase border px-1.5 py-1 flex-shrink-0 opacity-50"
                      style={{ borderColor: RULE, color: INK_MID }}
                    >
                      {tool.stamp}
                    </span>
                    <span className="text-sm font-semibold">{tool.title}</span>
                  </div>
                </Link>
              ))}
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
                href={isHome ? '#newsletter' : undefined}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full text-sm font-semibold bg-[oklch(0.55_0.14_38)] text-[oklch(0.99_0.005_85)] hover:bg-[oklch(0.48_0.14_38)] transition-colors cursor-pointer"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                onClick={() => {
                  setMobileOpen(false)
                  if (!isHome) setNewsletterOpen(true)
                }}
              >
                Get Weekly Picks
              </a>
            </div>
          </div>
        </div>
      )}

      <NewsletterModal open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />

      {/* Keyframe animations — scoped to nav, respect reduced-motion */}
      <style jsx global>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[dropdown-in_0\\.15s_ease-out\\],
          .animate-\\[slide-in-right_0\\.2s_ease-out\\],
          .animate-\\[fade-in_0\\.15s_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}
