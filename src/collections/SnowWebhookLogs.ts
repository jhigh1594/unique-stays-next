import type { CollectionConfig } from 'payload'

export const SnowWebhookLogs: CollectionConfig = {
  slug: 'snow-webhook-logs',
  labels: {
    singular: 'SnowSEO Webhook Log',
    plural: 'SnowSEO Webhook Logs',
  },
  admin: {
    useAsTitle: 'event',
    defaultColumns: ['event', 'slug', 'status', 'receivedAt'],
    description: 'Incoming SnowSEO webhook payloads for debugging and audit',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'event',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: { description: 'Article slug when present in the payload' },
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'SHA-256 hash of the raw request body' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'received',
      options: [
        { label: 'Received', value: 'received' },
        { label: 'Processed', value: 'processed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'rawBody',
      type: 'textarea',
      required: true,
      admin: { description: 'Exact raw JSON body from the webhook request' },
    },
    {
      name: 'payload',
      type: 'json',
      admin: { description: 'Parsed JSON payload' },
    },
    {
      name: 'headers',
      type: 'json',
      admin: { description: 'Selected request headers (authorization redacted)' },
    },
    {
      name: 'receivedAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
