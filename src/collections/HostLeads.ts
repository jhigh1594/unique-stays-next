import { CollectionConfig } from 'payload'

export const HostLeads: CollectionConfig = {
  slug: 'host-leads',
  admin: {
    defaultColumns: ['email', 'listingUrl', 'source', 'createdAt'],
    useAsTitle: 'email',
    description: 'Host emails captured from Unique Score tool',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'listingUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'scoreId',
      type: 'number',
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'free',
      options: [
        { label: 'Free Score', value: 'free' },
        { label: 'Paid Report', value: 'paid' },
      ],
    },
  ],
  timestamps: true,
}
