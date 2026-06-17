import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getJournalPostBySlug, getAllJournalSlugs, getAllJournalPosts } from '@/lib/payload-queries'
import { toCdnUrlOrRaw } from '@/lib/image-loader'
import { buildJournalPostJsonLd, serializeJsonLd } from '@/lib/jsonld'
import JournalPostContent from './_post/JournalPostContent'

export const dynamicParams = true
export const revalidate = 86400

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
  // Relative path resolves against layout.metadataBase (www) → self-referential.
  const canonical = `/journal/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      images: post.heroImageUrl ? [{ url: toCdnUrlOrRaw(post.heroImageUrl, { width: 1200 }) as string, width: 1200, height: 630 }] : [],
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

  const blogPostingJsonLd = buildJournalPostJsonLd(post)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostingJsonLd) }}
      />
      <JournalPostContent post={post} relatedPosts={relatedPosts} />
    </>
  )
}
