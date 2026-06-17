import type { CollectionConfig } from 'payload'

async function revalidateTag(tag: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const secret = process.env.REVALIDATE_SECRET
  try {
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret ?? '',
      },
      body: JSON.stringify({ tag }),
    })
  } catch {
    // revalidation failure must never block the save
  }
}

function validateHttpsUrl(val: string | null | undefined): string | true {
  if (!val) return true
  try {
    const url = new URL(val)
    if (url.protocol !== 'https:') return 'URL must use https://'
  } catch {
    return 'Must be a valid URL'
  }
  return true
}

export const Stays: CollectionConfig = {
  slug: 'stays',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'platform', 'state', 'price', 'featured', 'needsReview'],
    listSearchableFields: ['title', 'location', 'state'],
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Flag stays with non-R2 hero image URLs for review
        // R2 URLs are durable; external CDN URLs (muscache.com, etc.) can expire
        if (operation === 'create' || operation === 'update') {
          const url = data.imageUrl as string | undefined
          if (url && !url.includes('.r2.dev') && !url.includes('media.uniquestaysusa.com')) {
            data.needsReview = true
            data.reviewReason = `Hero image not on R2: ${url.slice(0, 80)}`
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc }) => {
        await revalidateTag('stays')
        if (doc.slug) await revalidateTag(`stays:${doc.slug}`)
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidateTag('stays')
        if (doc.slug) await revalidateTag(`stays:${doc.slug}`)
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Kebab-case URL identifier (e.g. wander-joshua-tree-starfall)',
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
    },

    // ── Location ──────────────────────────────────────────────
    {
      name: 'location',
      type: 'text',
      required: true,
      admin: { description: 'Display string (e.g. Joshua Tree, California)' },
    },
    {
      name: 'city',
      type: 'text',
      admin: { description: 'Parsed city name (e.g. Joshua Tree)', position: 'sidebar' },
    },
    {
      name: 'state',
      type: 'text',
      required: true,
      admin: { description: 'Full state name (e.g. California)', position: 'sidebar' },
    },
    {
      name: 'stateCode',
      type: 'text',
      admin: { description: '2-letter state code (e.g. CA)', position: 'sidebar' },
    },
    {
      name: 'region',
      type: 'select',
      required: true,
      options: [
        { label: 'West', value: 'West' },
        { label: 'Southwest', value: 'Southwest' },
        { label: 'South', value: 'South' },
        { label: 'Midwest', value: 'Midwest' },
        { label: 'Northeast', value: 'Northeast' },
        { label: 'Southeast', value: 'Southeast' },
      ],
    },
    {
      name: 'coordinates',
      type: 'point',
      admin: {
        description: 'Latitude/longitude for distance queries',
        position: 'sidebar',
      },
    },

    // ── Classification ────────────────────────────────────────
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'spokes',
      type: 'relationship',
      relationTo: 'spokes',
      hasMany: true,
      required: true,
      admin: {
        description: 'Which spoke sections this listing appears in',
      },
    },

    // ── Booking ───────────────────────────────────────────────
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Airbnb', value: 'Airbnb' },
        { label: 'VRBO', value: 'VRBO' },
        { label: 'Wander', value: 'Wander' },
        { label: 'Direct', value: 'Direct' },
      ],
    },
    {
      name: 'affiliateUrl',
      type: 'text',
      required: true,
      validate: validateHttpsUrl,
      admin: { description: 'Full booking URL with affiliate tracking (must be https://)' },
    },

    // ── Media ─────────────────────────────────────────────────
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Primary listing image — use Media upload for hosted images' },
    },
    {
      name: 'imageUrl',
      type: 'text',
      validate: validateHttpsUrl,
      admin: {
        description: 'Fallback: direct image URL (used during migration from legacy data) — must be https://',
      },
    },

    // ── Gallery ───────────────────────────────────────────────
    {
      name: 'galleryImages',
      type: 'array',
      admin: { description: 'Additional photos for the gallery (up to 5 recommended)' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'imageUrl',
          type: 'text',
          validate: validateHttpsUrl,
          admin: { description: 'Fallback external URL (must be https://)' },
        },
      ],
    },

    // ── Editorial Content ─────────────────────────────────────
    {
      name: 'editorNote',
      type: 'textarea',
      admin: {
        description: 'One-sentence pull-quote: why we love this stay (shows in Editor\'s Note section)',
      },
    },
    {
      name: 'bestFor',
      type: 'text',
      admin: { description: 'Who this stay is made for (e.g. "Couples seeking solitude")' },
    },
    {
      name: 'bestSeason',
      type: 'text',
      admin: { description: 'Best time to visit (e.g. "Fall — October & November")' },
    },
    {
      name: 'vibe',
      type: 'text',
      admin: { description: 'The atmosphere in a few words (e.g. "Deep woods, deliberately offline")' },
    },

    // ── Pricing & Stats ───────────────────────────────────────
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: { description: 'Nightly rate in USD' },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
    },
    {
      name: 'reviewCount',
      type: 'number',
      min: 0,
    },

    // ── Capacity ──────────────────────────────────────────────
    {
      name: 'sleeps',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'bedrooms',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'bathrooms',
      type: 'number',
      required: true,
      min: 0,
    },

    // ── Content ───────────────────────────────────────────────
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      maxLength: 5000,
      admin: {
        description: 'Rich editorial description (2-3 paragraphs for Tier 1, 1-2 for Tier 2)',
      },
    },
    {
      name: 'areaGuide',
      type: 'textarea',
      maxLength: 2000,
      admin: {
        description: 'Neighborhood/area guide (Tier 1 only)',
      },
    },
    {
      name: 'faqs',
      type: 'array',
      maxRows: 10,
      admin: {
        description: 'FAQ pairs for AEO (Tier 1 only)',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
      admin: { description: 'Amenity tags (e.g. Stargazing Deck, Heated Pool)' },
    },

    // ── Editorial Flags ───────────────────────────────────────
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'editorsPick',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isNew',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'needsReview',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'reviewReason',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Why this stay needs review (e.g. dead listing, wrong image)',
      },
    },
    {
      name: 'hidden',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Hides this stay from the public site, sitemap, and static route params. Use for out-of-scope or broken listings instead of relying on the price/location heuristics.',
      },
    },

    // ── Work-Friendly ─────────────────────────────────────────
    {
      name: 'workFriendly',
      type: 'group',
      admin: {
        description: 'Attributes for the Work-Friendly spoke',
        condition: (data) => Array.isArray(data?.spokes),
      },
      fields: [
        {
          name: 'wifiSpeed',
          type: 'text',
          admin: { description: 'e.g. 200 Mbps Starlink' },
        },
        {
          name: 'hasDesk',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // ── Pet-Friendly ──────────────────────────────────────────
    {
      name: 'petDetails',
      type: 'group',
      admin: { description: 'Attributes for the Pet-Friendly spoke' },
      fields: [
        {
          name: 'petFriendly',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'petPolicy',
          type: 'text',
          admin: { description: 'e.g. Dogs welcome, 2 max, $50 fee' },
        },
      ],
    },

    // ── RV-Ready ──────────────────────────────────────────────
    {
      name: 'rvDetails',
      type: 'group',
      admin: { description: 'Attributes for the RV-Ready spoke' },
      fields: [
        {
          name: 'rvHookup',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'rvInfo',
          type: 'text',
          admin: { description: 'e.g. 30-amp hookup, pull-through site' },
        },
      ],
    },

    // ── EV-Ready ──────────────────────────────────────────────
    {
      name: 'evDetails',
      type: 'group',
      admin: { description: 'Attributes for the EV-Ready spoke' },
      fields: [
        {
          name: 'evCharger',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'evInfo',
          type: 'text',
          admin: { description: 'e.g. Level 2 Tesla adapter, 48A' },
        },
      ],
    },
  ],
}
