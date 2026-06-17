export function generateSlugFromTitle(title: string, prefix?: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)

  return prefix ? `${prefix}-${baseSlug}` : baseSlug
}

export function resolveArticleSlug(article: { slug?: string; title: string }): string {
  return article.slug?.trim() || generateSlugFromTitle(article.title)
}
