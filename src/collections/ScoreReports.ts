import { CollectionConfig } from 'payload'

export const ScoreReports: CollectionConfig = {
  slug: 'score-reports',
  admin: {
    defaultColumns: ['listingUrl', 'platform', 'overallScore', 'paid', 'createdAt'],
    useAsTitle: 'listingUrl',
    description: 'Cached Unique Score analysis results',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'urlHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'listingUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Airbnb', value: 'airbnb' },
        { label: 'VRBO', value: 'vrbo' },
        { label: 'Wander', value: 'wander' },
      ],
    },
    {
      name: 'overallScore',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },
    {
      name: 'dimensions',
      type: 'json',
      required: true,
    },
    {
      name: 'listingData',
      type: 'json',
    },
    {
      name: 'paid',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'sessionId',
      type: 'text',
    },
  ],
  timestamps: true,
}
