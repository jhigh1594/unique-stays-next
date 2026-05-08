import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'pg', '@payloadcms/richtext-lexical'],
  images: {
    remotePatterns: [
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
