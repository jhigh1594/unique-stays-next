import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
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
        description: 'URL-safe slug: treehouses | geodesic-domes | houseboats | etc.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'emoji',
      type: 'text',
      admin: {
        description: 'Display emoji (e.g. 🌲)',
      },
    },
    // NOTE: no `count` field — stays per category is computed via aggregation at query time
  ],
}
