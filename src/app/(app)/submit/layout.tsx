import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit a Stay',
  description: 'Know a hidden gem? Submit an extraordinary vacation rental for review by our editorial team.',
  alternates: { canonical: '/submit' },
}

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children
}
