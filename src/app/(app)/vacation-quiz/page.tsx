import type { Metadata } from 'next'
import VacationQuizClient from './VacationQuizClient'

export const metadata: Metadata = {
  title: 'Where Should My Next Vacation Be? — Unique Stays Quiz',
  description:
    'Answer 5 questions and get matched to curated unique stays — treehouses, domes, houseboats, and more — across the USA.',
  openGraph: {
    title: 'Where Should My Next Vacation Be?',
    description: 'Take the 60-second quiz and discover your perfect unique stay.',
    images: [{ url: '/app-icon-512.png', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Where Should My Next Vacation Be?',
    description: 'Take the 60-second quiz and discover your perfect unique stay.',
  },
}

export default function VacationQuizPage() {
  return <VacationQuizClient />
}
