// Custom next/image loader — routes R2 images through
// Cloudflare Worker CDN (img.uniquestaysusa.com) instead of Vercel _next/image.
// Local paths, data URIs, and non-R2 external URLs pass through unchanged.

import type { ImageLoader } from 'next/image'

const CDN_HOST = process.env.NEXT_PUBLIC_IMAGE_CDN_HOST || 'img.uniquestaysusa.com'

function isR2Url(hostname: string): boolean {
  if (hostname === 'media.uniquestaysusa.com') return true
  if (hostname.endsWith('.r2.dev')) return true
  return false
}

const imageLoader: ImageLoader = ({ src, width, quality }) => {
  // Local paths and data URIs — pass through unchanged
  if (src.startsWith('/') || src.startsWith('data:')) return src

  try {
    const url = new URL(src)

    // R2-hosted images: route through Worker CDN
    if (isR2Url(url.hostname)) {
      const key = url.pathname.slice(1) // strip leading /
      const v = url.searchParams.get('v')
      const bust = v ? `&v=${v}` : ''
      return `https://${CDN_HOST}/${key}?w=${width}&q=${quality || 75}${bust}`
    }

    // External images (muscache, unsplash, etc.): pass through as-is
    // These will be migrated to R2 in a separate step
    return src
  } catch {
    return src
  }
}

export default imageLoader
