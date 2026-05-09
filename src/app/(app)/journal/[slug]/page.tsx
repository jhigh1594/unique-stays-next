import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getJournalPostBySlug, getAllJournalSlugs, getAllJournalPosts } from '@/lib/payload-queries'
import JournalPostContent from './_post/JournalPostContent'

export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllJournalSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getJournalPostBySlug(slug)
  if (!post) return {}

  const title = post.metaTitle || `${post.title} | UniqueStaysUSA`
  const description = post.metaDescription || post.excerpt
  const canonical = `${process.env.NEXT_PUBLIC_SERVER_URL}/journal/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: post.heroImageUrl ? [{ url: post.heroImageUrl, width: 1200, height: 630 }] : [],
    },
  }
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getJournalPostBySlug(slug)
  if (!post) notFound()

  const allPosts = await getAllJournalPosts()
  const relatedPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 2)

  return <JournalPostContent post={post} relatedPosts={relatedPosts} />
}
