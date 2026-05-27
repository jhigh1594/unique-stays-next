import type { Metadata } from 'next'
import AboutContent from './_about/AboutContent'

export const metadata: Metadata = {
  title: 'About — Our Story',
  description:
    'How Unique Stays USA finds and collects extraordinary vacation rentals across America. The story behind the directory.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <AboutContent />
}
