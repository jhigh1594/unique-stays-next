import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/directory', destination: '/collection', permanent: true }]
  },
  serverExternalPackages: ['sharp', 'pg'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uniquestaysusa.com' },
      { protocol: 'https', hostname: '**.muscache.com' },
      { protocol: 'https', hostname: '**.vrboassets.com' },
      { protocol: 'https', hostname: '**.vacasa.com' },
      { protocol: 'https', hostname: '**.wander.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '**.vercel-storage.com' },
    ],
  },
}

export default withPayload(nextConfig)
