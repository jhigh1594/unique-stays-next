'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import NewsletterModal from '@/components/NewsletterModal'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'

const SPOKES = SPOKE_SLUGS.map((slug) => SPOKES_CONFIG[slug])

const TOOLS = [
  {
    slug: 'listing-generator',
    title: 'Listing Generator',
    tagline: 'AI-crafted descriptions for your unique stay',
    emoji: '✍️',
  },
  {
    slug: 'unique-score',
    title: 'Unique Score',
    tagline: 'AI listing grader with editorial field report',
    emoji: '📊',
  },
  {
    slug: 'vacation-quiz',
    title: 'Vacation Finder',
    tagline: 'Find your perfect unique stay in 5 questions',
    emoji: '🧭',
  },
] as const

/** Pages with a light top section — nav links stay dark before scroll. */
const LIGHT_HERO_PREFIXES = ['/about', '/submit', '/privacy', '/disclosure'] as const

function hasLightHeroPath(pathname: string): boolean {
  return LIGHT_HERO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCollectionsOpen(false)
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isOnSpoke = SPOKE_SLUGS.some((s) => pathname === `/${s}`)
  const isOnTool = TOOLS.some((t) => pathname === `/${t.slug}`)
  const isDetailPage = pathname.startsWith('/stays/')
  const usesLightHeader = scrolled || isDetailPage
  const usesDarkNavText = usesLightHeader || hasLightHeroPath(pathname)

  const navLinks = [
    { href: '/collection', label: 'The Collection' },
    { href: '/journal', label: 'Journal' },
    { href: '/about', label: 'About' },
    { href: '/submit', label: 'Submit a Stay' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          usesLightHeader
            ? 'bg-[oklch(0.975_0.012_85/0.97)] backdrop-blur-md shadow-[0_1px_0_0_oklch(0.88_0.025_75)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/">
              <div className="group transition-transform duration-300 hover:scale-105">
                <LogoMark className="h-16 w-auto" />
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {/* Collections Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                    isOnSpoke
                      ? 'text-[oklch(0.55_0.14_38)]'
                      : usesDarkNavText
                        ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
                        : 'text-[oklch(0.90_0.01_85)] hover:text-white'
                  }`}
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  onClick={() => { setCollectionsOpen(!collectionsOpen); setToolsOpen(false) }}
                >
                  Collections
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {collectionsOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[520px] rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      background: 'oklch(0.99 0.005 85)',
                      border: '1.5px solid oklch(0.88 0.025 75)',
                    }}
                  >
                    <div className="p-4">
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-3 px-2"
                        style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        Browse by Collection
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {SPOKES.map((spoke) => (
                          <Link key={spoke.slug} href={`/${spoke.slug}`}>
                            <div
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[oklch(0.97_0.012_85)] transition-colors group cursor-pointer"
                              onClick={() => setCollectionsOpen(false)}
                            >
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background: spoke.accentColorLight }}
                              >
                                {spoke.heroEmoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-sm font-semibold"
                                  style={{ color: 'oklch(0.22 0.01 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                                >
                                  {spoke.title}
                                </div>
                                <div
                                  className="text-xs truncate"
                                  style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                                >
                                  {spoke.tagline}
                                </div>
                              </div>
                              <div
                                className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: spoke.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                              >
                                Explore →
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div
                      className="px-4 py-3 border-t border-[oklch(0.88_0.025_75)]"
                      style={{ background: 'oklch(0.975 0.012 85)' }}
                    >
                      <Link href="/collection">
                        <div
                          className="flex items-center justify-between text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          onClick={() => setCollectionsOpen(false)}
                        >
                          <span>Browse The Collection</span>
                          <span>→</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {navLinks.filter((l) => l.href === '/journal').map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`text-sm font-medium transition-colors duration-200 relative group ${
                      pathname === link.href
                        ? 'text-[oklch(0.55_0.14_38)]'
                        : usesDarkNavText
                          ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
                          : 'text-[oklch(0.90_0.01_85)] hover:text-white'
                    }`}
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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

              {/* Tools Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                    isOnTool
                      ? 'text-[oklch(0.55_0.14_38)]'
                      : usesDarkNavText
                        ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
                        : 'text-[oklch(0.90_0.01_85)] hover:text-white'
                  }`}
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  onClick={() => { setToolsOpen(!toolsOpen); setCollectionsOpen(false) }}
                >
                  Tools
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {toolsOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[280px] rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      background: 'oklch(0.99 0.005 85)',
                      border: '1.5px solid oklch(0.88 0.025 75)',
                    }}
                  >
                    <div className="p-4">
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-3 px-2"
                        style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        Free Tools
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {TOOLS.map((tool) => (
                          <Link key={tool.slug} href={`/${tool.slug}`}>
                            <div
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[oklch(0.97_0.012_85)] transition-colors group cursor-pointer"
                              onClick={() => setToolsOpen(false)}
                            >
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background: 'oklch(0.97 0.04 75)' }}
                              >
                                {tool.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-sm font-semibold"
                                  style={{ color: 'oklch(0.22 0.01 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                                >
                                  {tool.title}
                                </div>
                                <div
                                  className="text-xs truncate"
                                  style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                                >
                                  {tool.tagline}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {navLinks.filter((l) => l.href !== '/journal').map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`text-sm font-medium transition-colors duration-200 relative group ${
                      pathname === link.href
                        ? 'text-[oklch(0.55_0.14_38)]'
                        : usesDarkNavText
                          ? 'text-[oklch(0.40_0.03_60)] hover:text-[oklch(0.55_0.14_38)]'
                          : 'text-[oklch(0.90_0.01_85)] hover:text-white'
                    }`}
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[oklch(0.55_0.14_38)] text-[oklch(0.99_0.005_85)] hover:bg-[oklch(0.48_0.14_38)] transition-all duration-200 hover:shadow-md cursor-pointer"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Get Weekly Picks
              </a>
              <button
                className={`md:hidden p-2 rounded-lg transition-colors ${
                  usesDarkNavText
                    ? 'text-[oklch(0.40_0.03_60)] hover:bg-[oklch(0.93_0.025_75)]'
                    : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-[oklch(0.22_0.01_60/0.5)]"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute top-0 right-0 bottom-0 w-80 shadow-2xl flex flex-col pt-20 pb-8 overflow-y-auto"
            style={{ background: 'oklch(0.975 0.012 85)' }}
          >
            <div className="px-4 mb-4">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2 px-2"
                style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Collections
              </p>
              {SPOKES.map((spoke) => (
                <Link key={spoke.slug} href={`/${spoke.slug}`}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[oklch(0.93_0.025_75)] transition-colors cursor-pointer"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-xl">{spoke.heroEmoji}</span>
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: 'oklch(0.22 0.01 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {spoke.title}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {spoke.tagline}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-4 mb-4">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2 px-2"
                style={{ color: 'oklch(0.55 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Free Tools
              </p>
              {TOOLS.map((tool) => (
                <Link key={tool.slug} href={`/${tool.slug}`}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[oklch(0.93_0.025_75)] transition-colors cursor-pointer"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-xl">{tool.emoji}</span>
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: 'oklch(0.22 0.01 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {tool.title}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'oklch(0.50 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {tool.tagline}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="h-px mx-4 mb-4" style={{ background: 'oklch(0.88 0.025 75)' }} />

            <nav className="flex flex-col gap-1 px-4">
              {[{ href: '/', label: 'Home' }, ...navLinks].map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className="block py-2.5 px-3 rounded-xl text-sm font-medium text-[oklch(0.30_0.02_60)] hover:bg-[oklch(0.93_0.025_75)] hover:text-[oklch(0.55_0.14_38)] transition-all"
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto px-4">
              <a
                href={isHome ? '#newsletter' : undefined}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full text-sm font-semibold bg-[oklch(0.55_0.14_38)] text-[oklch(0.99_0.005_85)] hover:bg-[oklch(0.48_0.14_38)] transition-all cursor-pointer"
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
    </>
  )
}
