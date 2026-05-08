import type { CollectionConfig } from 'payload'

export const Spokes: CollectionConfig = {
  slug: 'spokes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'tagline'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe identifier: unique | work-friendly | pet-friendly | rv-ready | ev-ready',
      },
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Emoji or icon name for the spoke (e.g. 🌲)',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
