import { CollectionConfig } from 'payload'

export const QuizLeads: CollectionConfig = {
  slug: 'quiz-leads',
  admin: {
    defaultColumns: ['email', 'zipCode', 'occasion', 'vibe', 'createdAt'],
    useAsTitle: 'email',
    description: 'Email leads captured from the vacation quiz',
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
      name: 'zipCode',
      type: 'text',
      required: true,
    },
    {
      name: 'occasion',
      type: 'select',
      options: [
        { label: 'Romantic', value: 'romantic' },
        { label: 'Solo', value: 'solo' },
        { label: 'Friends', value: 'friends' },
        { label: 'Family', value: 'family' },
      ],
    },
    {
      name: 'vibe',
      type: 'select',
      options: [
        { label: 'Woods', value: 'woods' },
        { label: 'Waterfront', value: 'waterfront' },
        { label: 'Desert', value: 'desert' },
        { label: 'Mountains', value: 'mountains' },
        { label: 'Off-grid', value: 'offgrid' },
      ],
    },
    {
      name: 'distance',
      type: 'select',
      options: [
        { label: 'Nearby', value: 'nearby' },
        { label: 'Half-day drive', value: 'halfday' },
        { label: 'Anywhere', value: 'anywhere' },
      ],
    },
    {
      name: 'budget',
      type: 'select',
      options: [
        { label: 'Under $150', value: 'under150' },
        { label: '$150–$300', value: '150to300' },
        { label: '$300–$500', value: '300to500' },
        { label: '$500+', value: '500plus' },
      ],
    },
    {
      name: 'mustHave',
      type: 'select',
      options: [
        { label: 'Views', value: 'views' },
        { label: 'Privacy', value: 'privacy' },
        { label: 'Hot tub', value: 'hottub' },
        { label: 'Hiking', value: 'hiking' },
        { label: 'Pet-friendly', value: 'pets' },
        { label: 'Off-grid / WiFi-free', value: 'offgrid-wifi-free' },
      ],
    },
    {
      name: 'resultSlug',
      type: 'text',
    },
    {
      name: 'matchCount',
      type: 'number',
    },
  ],
  timestamps: true,
}
