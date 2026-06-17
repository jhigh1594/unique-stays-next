import type { Payload } from 'payload'
import type { BlogPost } from '@/payload-types'
import type { SnowSEOArticle } from './types'
import { htmlToLexicalContent, fallbackLexicalFromText } from './html-to-lexical'
import { resolveArticleSlug } from './slug'

interface UpsertArticleInput {
  article: SnowSEOArticle
  published: boolean
}

interface UpsertArticleResult {
  id: string
  slug: string
}

export async function upsertSnowseoArticle(
  payload: Payload,
  config: Parameters<typeof htmlToLexicalContent>[0],
  input: UpsertArticleInput,
): Promise<UpsertArticleResult> {
  const { article, published } = input
  const slug = resolveArticleSlug(article)
  const meta = article.metaData
  const excerpt =
    meta?.metaDescription?.trim() ||
    article.markdown?.split('\n\n').find((block) => block.trim() && !block.startsWith('#'))?.trim() ||
    article.title

  let content: BlogPost['content']
  try {
    content = (await htmlToLexicalContent(config, article.html)) as BlogPost['content']
  } catch {
    content = fallbackLexicalFromText(article.markdown || article.title) as BlogPost['content']
  }

  const data = {
    slug,
    title: article.title,
    excerpt,
    content,
    status: published ? ('published' as const) : ('draft' as const),
    publishedAt: published ? new Date().toISOString() : undefined,
    metaTitle: meta?.metaTitle,
    metaDescription: meta?.metaDescription,
    snowseoArticleId: article.id,
  }

  const existing = await findExistingPost(payload, slug, article.id)

  if (existing) {
    const updated = await payload.update({
      collection: 'blog-posts',
      id: existing.id,
      data,
      overrideAccess: true,
    })

    return {
      id: String(updated.id),
      slug: updated.slug as string,
    }
  }

  const created = await payload.create({
    collection: 'blog-posts',
    data,
    overrideAccess: true,
  })

  return {
    id: String(created.id),
    slug: created.slug as string,
  }
}

async function findExistingPost(
  payload: Payload,
  slug: string,
  snowseoArticleId?: string,
): Promise<{ id: number | string } | null> {
  if (snowseoArticleId) {
    const bySnowId = await payload.find({
      collection: 'blog-posts',
      where: { snowseoArticleId: { equals: snowseoArticleId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (bySnowId.docs[0]) {
      return { id: bySnowId.docs[0].id }
    }
  }

  const bySlug = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return bySlug.docs[0] ? { id: bySlug.docs[0].id } : null
}
