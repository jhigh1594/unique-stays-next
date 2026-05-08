import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UniqueStaysUSA — Curated Unique Vacation Rentals',
  description: 'Discover treehouses, geodesic domes, cave dwellings, houseboats, and more extraordinary stays across the USA.',
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
