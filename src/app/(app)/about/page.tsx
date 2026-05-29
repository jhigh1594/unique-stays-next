import type { Metadata } from 'next'
import AboutContent from './_about/AboutContent'

export const metadata: Metadata = {
  title: 'About — This Started With a Treehouse',
  description:
    'How one treehouse in Oregon became a directory of four hundred extraordinary vacation rentals across America. The story behind Unique Stays USA.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <AboutContent />
}
