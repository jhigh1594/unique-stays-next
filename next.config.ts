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
    // Custom loader routes R2 images through img.uniquestaysusa.com ({key}?w=).
    // See src/lib/image-loader.ts and workers/image-cdn/.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    // Match CDN WebP buckets — avoid srcset entries >1600 that fall back to original JPEG.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
  },
}

export default withPayload(nextConfig)
