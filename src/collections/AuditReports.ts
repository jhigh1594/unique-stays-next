import type { CollectionConfig } from 'payload'

export const AuditReports: CollectionConfig = {
  slug: 'audit-reports',
  labels: {
    singular: 'Audit Report',
    plural: 'Audit Reports',
  },
  admin: {
    useAsTitle: 'stayTitle',
    defaultColumns: ['stayTitle', 'severity', 'status', 'checkedAt'],
    listSearchableFields: ['stayTitle', 'staySlug', 'runId'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'runId',
      type: 'text',
      required: true,
      admin: {
        description: 'Groups reports from the same cron run',
        position: 'sidebar',
      },
    },
    {
      name: 'stay',
      type: 'relationship',
      relationTo: 'stays',
      admin: { position: 'sidebar' },
    },
    {
      name: 'staySlug',
      type: 'text',
      required: true,
      admin: {
        description: 'Denormalized for list view performance',
        position: 'sidebar',
      },
    },
    {
      name: 'stayTitle',
      type: 'text',
      required: true,
    },
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
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Critical', value: 'critical' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Resolved', value: 'resolved' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'findings',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'field',
          type: 'text',
          required: true,
          admin: { description: 'Which field was checked (e.g. title, price, imageUrl)' },
        },
        {
          name: 'expected',
          type: 'text',
          admin: { description: 'Value stored in Payload' },
        },
        {
          name: 'actual',
          type: 'text',
          admin: { description: 'Value found on live listing page' },
        },
        {
          name: 'severity',
          type: 'select',
          required: true,
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Critical', value: 'critical' },
          ],
        },
      ],
    },
    {
      name: 'checkedAt',
      type: 'date',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'resolvedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'resolvedBy',
      type: 'text',
      admin: {
        description: 'Who resolved this finding',
        position: 'sidebar',
      },
    },
  ],
}
