import type { Metadata } from 'next'
import './globals.css'

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
  return <>{children}</>
}
