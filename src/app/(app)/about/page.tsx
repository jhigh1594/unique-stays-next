import type { Metadata } from 'next'
import AboutContent from './_about/AboutContent'

export const metadata: Metadata = {
  title: 'About — This Started With a Treehouse',
  description:
    '352 curated extraordinary vacation rentals across all 50 states. Born from a treehouse in Oregon — because fine is the enemy, and the best places are buried on page six.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <AboutContent />
}
