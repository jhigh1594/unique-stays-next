import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/directory', destination: '/collection', permanent: true }]
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['sharp', 'pg'],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'uniquestaysusa.com' },
      { protocol: 'https', hostname: '**.muscache.com' },
      { protocol: 'https', hostname: '**.vrboassets.com' },
      { protocol: 'https', hostname: '**.vacasa.com' },
      { protocol: 'https', hostname: '**.wander.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'media.uniquestaysusa.com' },
    ],
  },
}

export default withPayload(nextConfig)
