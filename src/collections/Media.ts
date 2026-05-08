import type { CollectionConfig } from 'payload'
import { put, del } from '@vercel/blob'

const isBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  upload: {
    disableLocalStorage: isBlobConfigured,
    staticDir: isBlobConfigured ? '/tmp/uploads' : undefined,
    imageSizes: [
      {
        name: 'card',
        width: 800,
        height: 600,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'centre',
      },
      {
        name: 'thumb',
        width: 400,
        height: 300,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumb',
    mimeTypes: ['image/*'],
    handlers: isBlobConfigured
      ? [
          async (_req, { doc }) => {
            const d = doc as Record<string, unknown>
            const url = d.url as string | undefined
            if (!url) return new Response('Not found', { status: 404 })
            const res = await fetch(url)
            return new Response(res.body, {
              headers: {
                'Content-Type': (d.mimeType as string) ?? 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
              },
            })
          },
        ]
      : undefined,
  },
  hooks: isBlobConfigured
    ? {
        beforeChange: [
          async ({ data, req }) => {
            const file = req.file
            if (!file) return data

            const fileAny = file as unknown as { data: Buffer; name?: string; type?: string }
            const prefix = `media/${data.slug ?? 'untitled'}`
            const filename = fileAny.name ?? `${Date.now()}.jpg`

            const blob = await put(`${prefix}/${filename}`, fileAny.data, {
              access: 'public',
              contentType: fileAny.type ?? 'image/jpeg',
            })

            data.url = blob.url
            data.filename = filename

            return data
          },
        ],
        afterDelete: [
          async ({ doc }) => {
            const d = doc as Record<string, unknown>
            const url = d.url as string | undefined
            if (url?.includes('blob.vercel-storage.com')) {
              await del(url).catch(() => {})
            }
          },
        ],
      }
    : undefined,
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
