import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveStayCapacity } from './stay-capacity'
import type { JournalPostSummary, NormalizedJournalPost, NormalizedStay } from './types'

async function getPayloadInstance() {
  return getPayload({ config })
}

const PUBLIC_STAY_FILTER = {
  and: [
    { price: { greater_than: 0 } },
    { location: { not_equals: '' } },
    { location: { not_equals: 'Unknown' } },
  ] as { price: { greater_than: number } }[] & { location: { not_equals: string } }[],
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
    ...resolveStayCapacity({
      bedrooms: (doc.bedrooms as number) ?? 0,
      bathrooms: (doc.bathrooms as number) ?? 1,
      sleeps: (doc.sleeps as number) ?? 1,
      description: doc.description as string,
      body: (doc.body as string) ?? undefined,
      subtitle: (doc.subtitle as string) ?? undefined,
    }),
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

/**
 * Deterministic 5-day rotation for "This Week's Stays".
 * All visitors see the same set; changes every 5 days automatically.
 * Rotation is keyed by slug so reordering is stable across deploys.
 */
const ROTATION_WINDOW_DAYS = 5
const ROTATION_PICK_COUNT = 8

export const getFeaturedStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: { and: [{ featured: { equals: true } }, ...PUBLIC_STAY_FILTER.and] },
      limit: 100,
      depth: 1,
    })

    const all = result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))

    if (all.length <= ROTATION_PICK_COUNT) return all

    // Stable sort by slug so rotation windows are deterministic
    const sorted = [...all].sort((a, b) => a.slug.localeCompare(b.slug))

    // 5-day epoch index — same for every visitor on the same day
    const epoch = Math.floor(Date.now() / (ROTATION_WINDOW_DAYS * 86_400_000))
    const offset = (epoch * ROTATION_PICK_COUNT) % sorted.length

    // Pick ROTATION_PICK_COUNT stays wrapping around
    const picked: NormalizedStay[] = []
    for (let i = 0; i < ROTATION_PICK_COUNT; i++) {
      picked.push(sorted[(offset + i) % sorted.length])
    }

    return picked
  },
  ['stays-featured'],
  { tags: ['stays', 'stays:featured'], revalidate: 3600 }
)

export const getEditorsPickStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: { and: [{ editorsPick: { equals: true } }, ...PUBLIC_STAY_FILTER.and] },
      limit: 9,
      sort: 'slug',
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-editors-pick'],
  { tags: ['stays', 'stays:editors-pick'], revalidate: 3600 }
)

function hasDisplayImage(stay: NormalizedStay): boolean {
  return Boolean(stay.imageUrl || stay.galleryImages[0])
}

export const getFilmstripStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: PUBLIC_STAY_FILTER,
      limit: 60,
      depth: 1,
    })
    const stays = result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
    const withImages = stays.filter(hasDisplayImage)
    const pool = withImages.length >= 16 ? withImages : stays
    return pool.slice(0, 30)
  },
  ['stays-filmstrip'],
  { tags: ['stays'], revalidate: 3600 }
)

export interface HomepageSpokeStat {
  count: number
  states: number
}

export interface HomepageInventory {
  totalCount: number
  categoryCounts: Record<string, number>
  spokeStats: Record<string, HomepageSpokeStat>
}

function relationId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}

function relationIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map(relationId).filter((id): id is number => id !== null)
}

export const getHomepageInventory = unstable_cache(
  async (): Promise<HomepageInventory> => {
    const payload = await getPayloadInstance()

    const [categoryResult, spokeResult, stayResult] = await Promise.all([
      payload.find({ collection: 'categories', limit: 50, depth: 0 }),
      payload.find({ collection: 'spokes', limit: 10, depth: 0 }),
      payload.find({
        collection: 'stays',
        where: PUBLIC_STAY_FILTER,
        limit: 500,
        depth: 0,
      }),
    ])

    const categoryIdToSlug = new Map<number, string>()
    for (const doc of categoryResult.docs) {
      const record = doc as unknown as Record<string, unknown>
      categoryIdToSlug.set(record.id as number, record.slug as string)
    }

    const spokeIdToSlug = new Map<number, string>()
    for (const doc of spokeResult.docs) {
      const record = doc as unknown as Record<string, unknown>
      spokeIdToSlug.set(record.id as number, record.slug as string)
    }

    const categoryCounts: Record<string, number> = {}
    const spokeStates: Record<string, Set<string>> = {
      unique: new Set(),
      'work-friendly': new Set(),
      'pet-friendly': new Set(),
      'rv-ready': new Set(),
      'ev-ready': new Set(),
    }
    const spokeCounts: Record<string, number> = {
      unique: 0,
      'work-friendly': 0,
      'pet-friendly': 0,
      'rv-ready': 0,
      'ev-ready': 0,
    }

    for (const doc of stayResult.docs) {
      const record = doc as unknown as Record<string, unknown>
      const categorySlug = categoryIdToSlug.get(relationId(record.category) ?? -1) ?? ''
      if (categorySlug) {
        categoryCounts[categorySlug] = (categoryCounts[categorySlug] ?? 0) + 1
      }

      const state = record.state as string
      const spokeSlugs = relationIds(record.spokes)
        .map((id) => spokeIdToSlug.get(id))
        .filter((slug): slug is string => Boolean(slug))

      spokeCounts.unique += 1
      if (state) spokeStates.unique.add(state)

      for (const slug of ['work-friendly', 'pet-friendly', 'rv-ready', 'ev-ready'] as const) {
        if (spokeSlugs.includes(slug)) {
          spokeCounts[slug] += 1
          if (state) spokeStates[slug].add(state)
        }
      }
    }

    return {
      totalCount: stayResult.totalDocs,
      categoryCounts,
      spokeStats: Object.fromEntries(
        Object.keys(spokeCounts).map((slug) => [
          slug,
          { count: spokeCounts[slug], states: spokeStates[slug].size },
        ]),
      ),
    }
  },
  ['homepage-inventory-v2'],
  { tags: ['stays'], revalidate: 3600 },
)

export const getAllStays = unstable_cache(
  async (): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: PUBLIC_STAY_FILTER,
      limit: 500,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-all'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getPseoSitemapInventory = unstable_cache(
  async (): Promise<Array<Pick<NormalizedStay, 'state' | 'spokes'>>> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'stays',
      where: PUBLIC_STAY_FILTER,
      limit: 10000,
      depth: 1,
    })

    return result.docs.map((doc) => {
      const record = doc as unknown as Record<string, unknown>
      const spokes = (record.spokes ?? []) as Array<Record<string, unknown> | string>

      return {
        state: record.state as string,
        spokes: spokes.map((spoke) => (
          typeof spoke === 'object' && spoke !== null ? (spoke.slug as string) : spoke
        )).filter(Boolean),
      }
    })
  },
  ['stays-pseo-sitemap-inventory'],
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
      where: { and: [{ spokes: { in: [spokeId] } }, ...PUBLIC_STAY_FILTER.and] },
      limit: 500,
      depth: 1,
    })
    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-by-spoke'],
  { tags: ['stays'], revalidate: 3600 }
)

export const getStaysBySpokeAndState = unstable_cache(
  async (spokeSlug: string, stateName: string): Promise<NormalizedStay[]> => {
    const payload = await getPayloadInstance()
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
      where: {
        and: [
          { spokes: { in: [spokeId] } },
          { state: { equals: stateName } },
          ...PUBLIC_STAY_FILTER.and,
        ],
      },
      limit: 100,
      depth: 1,
    })

    return result.docs.map((doc) => normalizeStay(doc as unknown as Record<string, unknown>))
  },
  ['stays-by-spoke-and-state'],
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
          ...PUBLIC_STAY_FILTER.and,
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
      where: PUBLIC_STAY_FILTER,
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

/**
 * List-view normalizer. Reuses the full normalizer then drops the Lexical
 * `content` body and populated `linkedStays`, which list/index pages never
 * render but would otherwise serialize into the RSC payload and client data.
 */
function normalizeJournalPostSummary(doc: Record<string, unknown>): JournalPostSummary {
  const { content: _content, linkedStays: _linkedStays, ...summary } = normalizeJournalPost(doc)
  return summary
}

export const getAllJournalPosts = unstable_cache(
  async (): Promise<JournalPostSummary[]> => {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 50,
      // depth 1 populates heroImage (needed for the URL). linkedStays and the
      // Lexical content body come along for the ride but are stripped by the
      // summary normalizer so they never reach the client.
      depth: 1,
    })
    return result.docs.map((doc) =>
      normalizeJournalPostSummary(doc as unknown as Record<string, unknown>)
    )
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
        where: {
          slug: { equals: slug },
          status: { equals: 'published' },
        },
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
