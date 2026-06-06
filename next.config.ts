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
  serverExternalPackages: ['sharp', 'pg', '@aws-sdk/client-s3'],
  images: {
    // Custom loader routes all R2 images through Cloudflare Worker CDN
    // (img.uniquestaysusa.com) instead of Vercel _next/image optimizer.
    // See src/lib/image-loader.ts for routing logic.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
}

export default withPayload(nextConfig)
