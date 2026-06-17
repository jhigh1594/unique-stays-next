import type { Payload } from 'payload'
import { snowseoConfig } from './config'
import type { SnowSEOArticle, SnowSEOUnpublishAction } from './types'

interface UnpublishResult {
  action: SnowSEOUnpublishAction
  found: boolean
  slug?: string
  message: string
}

export async function unpublishSnowseoArticle(
  payload: Payload,
  article: SnowSEOArticle,
): Promise<UnpublishResult> {
  const action = snowseoConfig.unpublishAction
  const post = await findPostForUnpublish(payload, article)

  if (!post) {
    return {
      action,
      found: false,
      message: `Post "${article.title}" not found (may already be removed)`,
    }
  }

  const slug = post.slug as string

  switch (action) {
    case 'delete':
      await payload.delete({
        collection: 'blog-posts',
        id: post.id,
        overrideAccess: true,
      })
      return {
        action,
        found: true,
        slug,
        message: `Post "${article.title}" deleted`,
      }

    case 'archive':
      await payload.update({
        collection: 'blog-posts',
        id: post.id,
        data: {
          status: 'draft',
          archivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      return {
        action,
        found: true,
        slug,
        message: `Post "${article.title}" archived (status draft, archivedAt set)`,
      }

    case 'draft':
    default:
      await payload.update({
        collection: 'blog-posts',
        id: post.id,
        data: {
          status: 'draft',
        },
        overrideAccess: true,
      })
      return {
        action,
        found: true,
        slug,
        message: `Post "${article.title}" marked as draft`,
      }
  }
}

async function findPostForUnpublish(payload: Payload, article: SnowSEOArticle) {
  const cmsArticleId = article.id

  if (cmsArticleId) {
    const numericId = Number(cmsArticleId)
    if (!Number.isNaN(numericId)) {
      try {
        const byId = await payload.findByID({
          collection: 'blog-posts',
          id: numericId,
          depth: 0,
          overrideAccess: true,
        })
        if (byId) return byId
      } catch {
        // fall through to other lookups
      }
    }

    const bySnowId = await payload.find({
      collection: 'blog-posts',
      where: { snowseoArticleId: { equals: cmsArticleId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (bySnowId.docs[0]) return bySnowId.docs[0]
  }

  if (article.slug) {
    const bySlug = await payload.find({
      collection: 'blog-posts',
      where: { slug: { equals: article.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (bySlug.docs[0]) return bySlug.docs[0]
  }

  return null
}

export function unpublishActionLabel(action: SnowSEOUnpublishAction): string {
  switch (action) {
    case 'delete':
      return 'hard delete'
    case 'archive':
      return 'archive (draft + archivedAt)'
    case 'draft':
      return 'mark as draft'
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
