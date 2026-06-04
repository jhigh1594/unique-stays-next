import type { Metadata } from 'next'
import { getAllJournalPosts } from '@/lib/payload-queries'
import JournalContent from './_journal/JournalContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'The Journal | UniqueStaysUSA',
  description: 'Field dispatches from extraordinary places across America.',
  openGraph: {
    title: 'The Journal | UniqueStaysUSA',
    description: 'Field dispatches from extraordinary places across America.',
  },
}

export default async function JournalPage() {
  const posts = await getAllJournalPosts()
  return <JournalContent posts={posts} />
}
