import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Fraunces, Plus_Jakarta_Sans, Caveat, Newsreader } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import GlobalShell from '@/components/GlobalShell'
import { buildOrganizationGraph, serializeJsonLd } from '@/lib/jsonld'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  axes: ['opsz'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'UniqueStaysUSA — Curated Unique Vacation Rentals',
    template: '%s | UniqueStaysUSA',
  },
  description:
    'Discover treehouses, geodesic domes, cave dwellings, houseboats, and more extraordinary stays across the USA.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://www.uniquestaysusa.com'
  ),
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
  openGraph: {
    images: [{ url: '/app-icon-512.png', width: 512, height: 512 }],
  },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const orgAndWebSiteJsonLd = buildOrganizationGraph()

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${plusJakartaSans.variable} ${caveat.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://img.uniquestaysusa.com" crossOrigin="" />
        <meta
          name="impact-site-verification"
          content="6aeda553-2b8f-415e-b0fc-cff364c52b61"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgAndWebSiteJsonLd) }}
        />
      </head>
      <body>
        <Navbar />
        <GlobalShell />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
        <Script
          id="emrld-affiliate"
          src="https://emrld.ltd/NTI2OTk1.js?t=526995"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
