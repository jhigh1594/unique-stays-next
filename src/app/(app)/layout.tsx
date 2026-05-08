import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
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
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plusJakartaSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
