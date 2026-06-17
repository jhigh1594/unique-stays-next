import type { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { StayEmbedBlock } from '../blocks/StayEmbed'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'city', 'state', 'publishedAt'],
    listSearchableFields: ['title', 'city', 'state', 'excerpt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        const isPublish = doc.status === 'published'
        const isUnpublish = previousDoc?.status === 'published' && doc.status === 'draft'
        if (!isPublish && !isUnpublish) return

        const baseUrl = process.env.REVALIDATE_BASE_URL ?? process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const secret = process.env.REVALIDATE_SECRET

        const revalidate = async (tag: string) => {
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

        await revalidate('journal')
        await revalidate(`journal:${doc.slug as string}`)
      },
    ],
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-safe slug (e.g. best-unique-stays-in-joshua-tree-california)',
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

    // ── Editorial ─────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },

    // ── Content ───────────────────────────────────────────────
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: {
        description: '1–2 sentence summary used in meta description and index cards',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [StayEmbedBlock] }),
        ],
      }),
    },
    {
      name: 'linkedStays',
      type: 'relationship',
      relationTo: 'stays',
      hasMany: true,
    },

    // ── Location ──────────────────────────────────────────────
    {
      name: 'city',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'state',
      type: 'text',
      admin: { position: 'sidebar' },
    },

    // ── Coordinates ───────────────────────────────────────────
    {
      name: 'latitude',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'e.g. 34.1347',
      },
    },
    {
      name: 'longitude',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'e.g. -116.3116',
      },
    },

    // ── SEO ───────────────────────────────────────────────────
    {
      name: 'metaTitle',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Falls back to title if empty',
      },
    },
    {
      name: 'metaDescription',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Falls back to excerpt if empty',
      },
    },

    // ── SnowSEO sync ──────────────────────────────────────────
    {
      name: 'snowseoArticleId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'SnowSEO article ID — used to link webhook updates',
        readOnly: true,
      },
    },
    {
      name: 'archivedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Set when SnowSEO unpublish action is archive',
        readOnly: true,
      },
    },
  ],
}
