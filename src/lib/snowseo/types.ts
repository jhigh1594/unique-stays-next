export type SnowSEOEvent =
  | 'article.published'
  | 'article.drafted'
  | 'article.unpublished'
  | 'webhook.connected'
  | 'webhook.disconnected'

export interface SnowSEOArticleMetaData {
  metaTitle?: string
  metaDescription?: string
  ogTitle?: string
  ogDescription?: string
  canonicalUrl?: string
  twitterTitle?: string
  twitterDescription?: string
}

export interface SnowSEOArticle {
  id?: string
  slug?: string
  title: string
  markdown?: string
  html: string
  status?: 'publish' | 'draft'
  featuredImage?: {
    url: string
    caption: string | null
  }
  metaData?: SnowSEOArticleMetaData
}

export interface SnowSEOWebhookPayload {
  event: SnowSEOEvent | string
  timestamp?: string
  article?: SnowSEOArticle
  message?: string
}

export type SnowSEOUnpublishAction = 'draft' | 'delete' | 'archive'

export interface SnowSEOWebhookResult {
  success: boolean
  slug?: string
  action?: string
  message?: string
  cmsArticleId?: string
  cmsUrl?: string
}

export interface SavedBlogPostRef {
  id: string
  slug: string
}
