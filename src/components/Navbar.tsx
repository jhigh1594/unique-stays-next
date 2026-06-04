'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowUpRight,
  BadgeCheck,
  Calculator,
  ChevronDown,
  Compass,
  MapPinned,
  Menu,
  PenLine,
  X,
} from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import NewsletterModal from '@/components/NewsletterModal'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'

const SPOKES = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

const TOOLS = [
  {
    slug: 'listing-generator',
    title: 'Listing Description Generator',
    description: 'Turn rough notes into a more bookable stay story.',
    stamp: 'WRITE',
    icon: PenLine,
  },
  {
    slug: 'build-cost-calculator',
    title: 'Build Cost Calculator',
    description: 'Estimate the real budget for cabins, domes, and glampsites.',
    stamp: 'COST',
    icon: Calculator,
  },
  {
    slug: 'unique-score',
    title: 'Listing Score Checker',
    description: 'See how distinctive your stay feels to a traveler.',
    stamp: 'SCORE',
    icon: BadgeCheck,
  },
  {
    slug: 'vacation-quiz',
    title: 'Vacation Match Quiz',
    description: 'Find the kind of escape your next trip is asking for.',
    stamp: 'QUIZ',
    icon: Compass,
  },
] as const

/** Pages with a light top section. Nav links stay dark before scroll. */
const LIGHT_HERO_PREFIXES = ['/about', '/submit', '/privacy', '/disclosure'] as const

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

function hasLightHeroPath(pathname: string): boolean {
  return LIGHT_HERO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Postmark watermark SVG, positioned behind dropdown content. */
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

const DROPDOWN_SHADOW = '0 16px 48px -12px rgba(52, 34, 20, 0.16)'
const TERRACOTTA = 'oklch(0.55 0.14 38)'
const INK = 'oklch(0.25 0.02 60)'
const INK_MID = 'oklch(0.50 0.06 60)'
const PAPER = 'oklch(0.975 0.012 85)'
const PAPER_ALT = 'oklch(0.96 0.015 85)'
const RULE = 'oklch(0.72 0.04 75)'
const FOREST = 'oklch(0.38 0.08 145)'

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
              {/* Collections Dropdown */}
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
                    className="absolute top-full left-[calc(50%-260px)] mt-4 w-[520px] overflow-hidden animate-[dropdown-in_0.18s_cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      background: PAPER,
                      border: '1px solid oklch(0.87 0.03 75)',
                      boxShadow: DROPDOWN_SHADOW,
                    }}
                    role="menu"
                    aria-label="Collections"
                  >
                    <div className="grid grid-cols-[160px_1fr]" style={{ color: 'oklch(0.40 0.06 38)' }}>
                        <div
                          className="min-h-full px-5 py-5"
                          style={{
                            background: 'oklch(0.96 0.02 80)',
                            borderRight: '1px solid oklch(0.91 0.025 80)',
                          }}
                        >
                          <span
                            className="inline-flex items-center gap-1.5 text-[0.58rem] font-black tracking-[0.14em] uppercase border-2 px-2 py-1"
                            style={{ borderColor: TERRACOTTA, color: TERRACOTTA }}
                            role="presentation"
                          >
                            <MapPinned className="h-3 w-3" aria-hidden="true" />
                            Collections
                          </span>
                          <p
                            className="mt-4 text-[1.55rem] leading-[1.02] font-display font-black"
                            style={{ color: INK }}
                          >
                            Pick the trip by its texture.
                          </p>
                          <p className="mt-3 text-[0.72rem] leading-5 font-semibold" style={{ color: INK_MID }}>
                            Five curated ways into the map.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 p-3" role="group">
                          {SPOKES.map((spoke, i) => (
                            <Link
                              key={spoke.slug}
                              href={`/${spoke.slug}`}
                              role="menuitem"
                              onKeyDown={(e) => handleItemKeyDown(e, i, SPOKES.length, collectionsButtonRef)}
                              onClick={closeAll}
                            >
                              <div
                                className="flex items-center gap-3 px-3 py-3 transition-[background-color,color] duration-200 group cursor-pointer outline-none focus-visible:bg-[oklch(0.94_0.022_80)]"
                                style={{ color: INK }}
                              >
                                <span
                                  className="flex h-8 w-8 items-center justify-center flex-shrink-0 text-[0.64rem] font-display font-black tabular-nums"
                                  style={{ color: spoke.accentColor }}
                                  aria-hidden="true"
                                >
                                  {ROMAN[i]}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-black group-hover:text-[oklch(0.55_0.14_38)] transition-colors">
                                    {spoke.title}
                                  </span>
                                  <span className="mt-0.5 block text-[0.68rem] leading-4 font-medium" style={{ color: INK_MID }}>
                                    {spoke.tagline}
                                  </span>
                                </span>
                                <ArrowUpRight
                                  className="h-3 w-3 shrink-0 opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                  aria-hidden="true"
                                />
                              </div>
                            </Link>
                          ))}
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

              {/* Tools Dropdown */}
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
                  Tools
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {toolsOpen && (
                  <div
                    className="absolute top-full left-[calc(50%-215px)] mt-4 w-[430px] overflow-hidden animate-[dropdown-in_0.18s_cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      background: PAPER,
                      border: '1px solid oklch(0.87 0.03 75)',
                      boxShadow: DROPDOWN_SHADOW,
                    }}
                    role="menu"
                    aria-label="Tools"
                  >
                    <div className="px-6 pt-5 pb-3">
                        <div className="mb-4">
                          <span
                            className="inline-flex items-center gap-1.5 text-[0.58rem] font-black tracking-[0.14em] uppercase border-2 px-2 py-1"
                            style={{ borderColor: FOREST, color: FOREST }}
                            role="presentation"
                          >
                            <Compass className="h-3 w-3" aria-hidden="true" />
                            Free Tools
                          </span>
                          <p className="mt-2 max-w-[28ch] text-[0.72rem] leading-5 font-semibold" style={{ color: INK_MID }}>
                            Quick field instruments for guests and hosts.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2" role="group">
                          {TOOLS.map((tool, i) => {
                            const ToolIcon = tool.icon

                            return (
                              <Link
                                key={tool.slug}
                                href={`/${tool.slug}`}
                                role="menuitem"
                                onKeyDown={(e) => handleItemKeyDown(e, i, TOOLS.length, toolsButtonRef)}
                                onClick={closeAll}
                              >
                                <div
                                  className="group border p-3.5 transition-[background-color,transform,border-color] duration-200 hover:-translate-y-0.5 outline-none focus-visible:bg-[oklch(0.94_0.022_80)]"
                                  style={{
                                    color: INK,
                                    borderColor: 'oklch(0.88 0.03 75)',
                                  }}
                                >
                                  <div className="mb-2.5 flex items-center justify-between gap-2">
                                    <span
                                      className="inline-flex h-7 w-7 items-center justify-center transition-colors duration-200 group-hover:text-[oklch(0.55_0.14_38)]"
                                      style={{ color: INK_MID }}
                                      aria-hidden="true"
                                    >
                                      <ToolIcon className="h-4 w-4" />
                                    </span>
                                    <span
                                      className="text-[0.52rem] font-black tracking-[0.10em] uppercase"
                                      style={{ color: 'oklch(0.68 0.04 75)' }}
                                    >
                                      {tool.stamp}
                                    </span>
                                  </div>
                                  <span className="block text-sm leading-5 font-black group-hover:text-[oklch(0.55_0.14_38)] transition-colors">
                                    {tool.title}
                                  </span>
                                  <span className="mt-1.5 block text-[0.68rem] leading-4 font-medium" style={{ color: INK_MID }}>
                                    {tool.description}
                                  </span>
                                </div>
                              </Link>
                            )
                          })}
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
            {/* Destinations */}
            <div className="px-5 mb-4">
              <span
                className="inline-flex items-center gap-1.5 text-[0.6rem] font-black tracking-[0.14em] uppercase border-2 px-2 py-1 mb-3"
                style={{ borderColor: TERRACOTTA, color: TERRACOTTA }}
              >
                <MapPinned className="h-3 w-3" aria-hidden="true" />
                Collections
              </span>
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
              <span
                className="inline-flex items-center gap-1.5 text-[0.6rem] font-black tracking-[0.14em] uppercase border-2 px-2 py-1 mb-3"
                style={{ borderColor: FOREST, color: FOREST }}
              >
                <Compass className="h-3 w-3" aria-hidden="true" />
                Free Tools
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {TOOLS.map((tool) => {
                  const ToolIcon = tool.icon

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

      {/* Keyframe animations scoped to nav, with reduced-motion support. */}
      <style jsx global>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
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
