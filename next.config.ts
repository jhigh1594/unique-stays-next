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
    remotePatterns: [
      // Our own CDN / storage
      { protocol: 'https', hostname: 'uniquestaysusa.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'media.uniquestaysusa.com' },
      // Platform CDNs
      { protocol: 'https', hostname: '**.muscache.com' },
      { protocol: 'https', hostname: '**.vrboassets.com' },
      { protocol: 'https', hostname: '**.trvl-media.com' },
      { protocol: 'https', hostname: '**.icdbcdn.com' },
      { protocol: 'https', hostname: '**.orez.io' },
      { protocol: 'https', hostname: '**.wander.com' },
      { protocol: 'https', hostname: '**.vacasa.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: '**.streamlinevrs.com' },
      { protocol: 'https', hostname: '**.hospitable.com' },
      // Direct booking / host website CDNs
      { protocol: 'https', hostname: '**.squarespace-cdn.com' },
      { protocol: 'https', hostname: '**.wsimg.com' },
      { protocol: 'https', hostname: '**.wixstatic.com' },
      { protocol: 'https', hostname: '**.wp.com' },
      { protocol: 'https', hostname: '**.homesteadmodern.com' },
      { protocol: 'https', hostname: '**.brokenbow.com' },
      { protocol: 'https', hostname: '**.enjoyuniquestays.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default withPayload(nextConfig)
