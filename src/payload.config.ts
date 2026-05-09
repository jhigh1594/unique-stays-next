import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { BlogPosts } from './collections/BlogPosts'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Spokes } from './collections/Spokes'
import { Stays } from './collections/Stays'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function normalizeDatabaseUri(value: string): string {
  const url = new URL(value)
  const sslMode = url.searchParams.get('sslmode')

  if (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca') {
    url.searchParams.set('sslmode', 'verify-full')
  }

  return url.toString()
}

function formatEmailRecipients(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatEmailRecipients).filter(Boolean).join(', ')
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'address' in value) {
    const address = (value as { address?: unknown }).address
    return typeof address === 'string' ? address : ''
  }
  return ''
}

const payloadSecret = requireEnv('PAYLOAD_SECRET')
const databaseUri = normalizeDatabaseUri(requireEnv('DATABASE_URI'))
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  plugins: [
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
      collections: {
        media: true,
      },
    }),
  ],
  collections: [Users, Media, Categories, Spokes, Stays, BlogPosts],
  editor: lexicalEditor(),
  secret: payloadSecret,
  serverURL,
  cors: (process.env.ALLOWED_ORIGINS ?? serverURL).split(',').filter(Boolean),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  email: ({ payload }) => ({
    name: 'console',
    defaultFromAddress: 'admin@uniquestaysusa.com',
    defaultFromName: 'Unique Stays USA',
    sendEmail: async (message) => {
      payload.logger.info({
        msg: `Email written to console. To: '${formatEmailRecipients(message.to)}', Subject: '${message.subject ?? ''}'`,
      })
    },
  }),
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
      max: 5,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    push: false,
  }),
  sharp,
})
