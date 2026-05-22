import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Fraunces, Plus_Jakarta_Sans, Caveat, Newsreader } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import GlobalShell from '@/components/GlobalShell'

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
    process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com'
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
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com'

  const orgAndWebSiteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'UniqueStaysUSA',
        url: baseUrl,
        logo: `${baseUrl}/logo-illustrated.png`,
        description: 'Curated directory of unique vacation rentals across the USA — treehouses, domes, cabins, houseboats, and more.',
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@uniquestaysusa.com',
          contactType: 'customer service',
        },
      },
      {
        '@type': 'WebSite',
        name: 'UniqueStaysUSA',
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/collection?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${plusJakartaSans.variable} ${caveat.variable}`}
    >
      <head>
        <meta
          name="impact-site-verification"
          content="6aeda553-2b8f-415e-b0fc-cff364c52b61"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgAndWebSiteJsonLd) }}
        />
        <script
          {...{
            nowprocket: '',
            'data-noptimize': '1',
            'data-cfasync': 'false',
            'data-wpfc-render': 'false',
            'seraph-accel-crit': '1',
            'data-no-defer': '1',
          }}
          dangerouslySetInnerHTML={{
            __html: `
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.src = 'https://emrld.ltd/NTI2OTk1.js?t=526995';
      document.head.appendChild(script);
  })();
`,
          }}
        />
      </head>
      <body>
        <Navbar />
        <GlobalShell />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
