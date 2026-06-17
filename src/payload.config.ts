import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { AuditReports } from './collections/AuditReports'
import { BlogPosts } from './collections/BlogPosts'
import { CandidateStays } from './collections/CandidateStays'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Spokes } from './collections/Spokes'
import { Stays } from './collections/Stays'
import { Users } from './collections/Users'
import { QuizLeads } from './collections/QuizLeads'
import { ScoreReports } from './collections/ScoreReports'
import { HostLeads } from './collections/HostLeads'
import { SnowWebhookLogs } from './collections/SnowWebhookLogs'

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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || serverURL).split(',').filter(Boolean)
const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  plugins: [
    s3Storage({
      enabled: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
      collections: {
        media: {
          disablePayloadAccessControl: true,
          // New uploads store under `media/` (collectionPrefix) so the image-cdn
          // worker can serve them — it only accepts keys under allowed prefixes
          // (stays/ hero/ spokes/ media/). Existing bare objects were copied
          // under media/ by scripts/migrate-media-to-prefix.ts. Custom
          // generateFileURL hardcodes `media/` because the plugin only passes
          // the *document* prefix here, not the collection prefix.
          prefix: 'media',
          generateFileURL: ({ filename }) => `${r2PublicUrl}/media/${filename}`,
        },
      },
      config: {
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        },
      },
      bucket: process.env.R2_BUCKET_NAME || 'uniquestays-media',
    }),
  ],
  collections: [Users, Media, Categories, Spokes, Stays, BlogPosts, CandidateStays, AuditReports, QuizLeads, ScoreReports, HostLeads, SnowWebhookLogs],
  editor: lexicalEditor(),
  secret: payloadSecret,
  serverURL,
  cors: allowedOrigins,
  csrf: allowedOrigins,
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
