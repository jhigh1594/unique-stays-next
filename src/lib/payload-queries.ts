import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { NormalizedJournalPost, NormalizedStay } from './types'

async function getPayloadInstance() {
  return getPayload({ config })
}

function resolveImageUrl(doc: Record<string, unknown>): string {
  const image = doc.image as Record<string, unknown> | null
  if (image && typeof image === 'object' && image.url) return image.url as string
  return (doc.imageUrl as string) ?? ''
}

function normalizeStay(doc: Record<string, unknown>): NormalizedStay {
  const workFriendly = (doc.workFriendly ?? {}) as Record<string, unknown>
  const petDetails = (doc.petDetails ?? {}) as Record<string, unknown>
  const rvDetails = (doc.rvDetails ?? {}) as Record<string, unknown>
  const evDetails = (doc.evDetails ?? {}) as Record<string, unknown>
  const category = doc.category as Record<string, unknown> | null
  const spokes = (doc.spokes ?? []) as Array<Record<string, unknown>>
  const tags = (doc.tags ?? []) as Array<{ tag: string }>
  const rawGallery = (doc.galleryImages ?? []) as Array<Record<string, unknown>>

  return {
    id: doc.id as number,
    slug: doc.slug as string,
    title: doc.title as string,
    subtitle: (doc.subtitle as string) ?? '',
    location: doc.location as string,
    state: doc.state as string,
    region: doc.region as string,
    category: typeof category === 'object' && category !== null ? (category.slug as string) : '',
    spokes: spokes.map((s) => (typeof s === 'object' && s !== null ? (s.slug as string) : (s as unknown as string))),
    platform: doc.platform as NormalizedStay['platform'],
    affiliateUrl: (doc.affiliateUrl as string) ?? '',
    imageUrl: resolveImageUrl(doc),
    galleryImages: rawGallery.map((item) => {
      const img = item.image as Record<string, unknown> | null
      if (img && typeof img === 'object' && img.url) return img.url as string
      return (item.imageUrl as string) ?? ''
    }).filter(Boolean),
    editorNote: (doc.editorNote as string) ?? '',
    bestFor: (doc.bestFor as string) ?? '',
    bestSeason: (doc.bestSeason as string) ?? '',
    vibe: (doc.vibe as string) ?? '',
    price: doc.price as number,
    rating: (doc.rating as number | null) ?? null,
    reviewCount: (doc.reviewCount as number | null) ?? null,
    sleeps: doc.sleeps as number,
    bedrooms: doc.bedrooms as number,
    description: doc.description as string,
    body: (doc.body as string) ?? undefined,
    areaGuide: (doc.areaGuide as string) ?? undefined,
    faqs: Array.isArray(doc.faqs)
      ? (doc.faqs as Array<{ question: string; answer: string }>)
      : undefined,
    tags: tags.map((t) => t.tag),
    featured: (doc.featured as boolean) ?? false,
    editorsPick: (doc.editorsPick as boolean) ?? false,
    isNew: (doc.isNew as boolean) ?? false,
    wifiSpeed: (workFriendly.wifiSpeed as string) ?? '',
    hasDesk: (workFriendly.hasDesk as boolean) ?? false,
    petFriendly: (petDetails.petFriendly as boolean) ?? false,
    petPolicy: (petDetails.petPolicy as string) ?? '',
    rvHookup: (rvDetails.rvHookup as boolean) ?? false,
    rvDetails: (rvDetails.rvInfo as string) ?? '',
    evCharger: (evDetails.evCharger as boolean) ?? false,
    evDetails: (evDetails.evInfo as string) ?? '',
  }
}

export const getFeaturedStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: { featured: { equals: true } },
      limit: 8,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-featured'],
  { tags: ['stays', 'stays:featured'], revalidate: 3600 }
)

export const getEditorsPickStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: { editorsPick: { equals: true } },
      limit: 8,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-editors-pick'],
  { tags: ['stays', 'stays:editors-pick'], revalidate: 3600 }
)

export const getFilmstripStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      limit: 30,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-filmstrip'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getAllStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      limit: 500,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-all'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getStaysBySpoke = unstable_cache(
  async (spokeSlug: string): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    // Find the spoke by slug first to get its ID
    const spokeResult = await payload.find({
      collection: 'spokes',
      where: { slug: { equals: spokeSlug } },
      limit: 1,
      depth: 0,
    })
    if (spokeResult.totalDocs === 0) return []
    const spokeId = spokeResult.docs[0].id
    const result = await payload.find({
      collection: 'stays',
      where: { spokes: { in: [spokeId] } },
      limit: 500,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-by-spoke'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getStayBySlug = unstable_cache(
  async (slug: string): Promise<NormalizedStay | null> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    if (result.totalDocs === 0) return null
    return normalizeStay(result.docs[0] as unknown as Record<string, unknown>)
  },
  ['stays-by-slug'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getRelatedStays = unstable_cache(
  async (categorySlug: string, excludeSlug: string): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const categoryResult = await payload.find({
      collection: 'categories',
      where: { slug: { equals: categorySlug } },
      limit: 1,
      depth: 0,
    })
    if (categoryResult.totalDocs === 0) return []
    const categoryId = categoryResult.docs[0].id
    const result = await payload.find({
      collection: 'stays',
      where: {
        and: [
          { category: { equals: categoryId } },
          { slug: { not_equals: excludeSlug } },
        ],
      },
      limit: 4,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-related'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getAllStaySlugs = unstable_cache(
  async (): Promise<string[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      limit: 500,
      depth: 0,
    })
    return result.docs.map((doc) => doc.slug as string).filter(Boolean)
  },
  ['stays-all-slugs'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getCategories = unstable_cache(
  async (): Promise<Array<{ id: number; name: string; slug: string; emoji: string }>> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'categories',
      limit: 50,
      depth: 0,
    })
    return result.docs.map((doc) => ({
      id: doc.id as number,
      name: doc.name as string,
      slug: doc.slug as string,
      emoji: (doc.emoji as string) ?? '',
    }))
  },
  ['categories-all'],
  { tags: ['categories'], revalidate: 3600 }
)

function normalizeJournalPost(doc: Record<string, unknown>): NormalizedJournalPost {
  const heroImage = doc.heroImage as Record<string, unknown> | null
  const heroImageUrl =
    heroImage && typeof heroImage === 'object' && typeof heroImage.url === 'string'
      ? heroImage.url
      : ''

  const rawLinkedStays = (doc.linkedStays ?? []) as Array<Record<string, unknown> | number>
  const linkedStays = rawLinkedStays
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => {
      const normalized = normalizeStay(s)
      // Only pass through affiliate URLs that are valid https:// URLs
      const safeAffiliateUrl =
        normalized.affiliateUrl.startsWith('https://') ? normalized.affiliateUrl : ''
      return { ...normalized, affiliateUrl: safeAffiliateUrl }
    })

  return {
    id: doc.id as number,
    slug: doc.slug as string,
    title: doc.title as string,
    subtitle: (doc.subtitle as string) ?? '',
    excerpt: (doc.excerpt as string) ?? '',
    heroImageUrl,
    publishedAt: (doc.publishedAt as string) ?? '',
    city: (doc.city as string) ?? '',
    state: (doc.state as string) ?? '',
    latitude: (doc.latitude as string) ?? '',
    longitude: (doc.longitude as string) ?? '',
    metaTitle: (doc.metaTitle as string) ?? '',
    metaDescription: (doc.metaDescription as string) ?? '',
    linkedStays,
    content: doc.content ?? null,
  }
}

export const getAllJournalPosts = unstable_cache(
  async (): Promise<NormalizedJournalPost[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 50,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeJournalPost(doc as unknown as Record<string, unknown>))
  },
  ['journal-all'],
  { tags: ['journal'], revalidate: 3600 }
)

export function getJournalPostBySlug(slug: string): Promise<NormalizedJournalPost | null> {
  return unstable_cache(
    async (): Promise<NormalizedJournalPost | null> => {
      const payload = await getPayloadInstance()
      const result = await payload.find({
        collection: 'blog-posts',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      })
      if (result.totalDocs === 0) return null
      return normalizeJournalPost(result.docs[0] as unknown as Record<string, unknown>)
    },
    [`journal-post-${slug}`],
    { tags: ['journal', `journal:${slug}`], revalidate: 3600 }
  )()
}

export const getAllJournalSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      limit: 500,
      depth: 0,
    })
    return result.docs.map((doc) => doc.slug as string).filter(Boolean)
  },
  ['journal-all-slugs'],
  { tags: ['journal'], revalidate: 3600 }
)
