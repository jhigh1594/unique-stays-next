// Migrate external hero/spoke images to R2
// Downloads Unsplash and muscache URLs, uploads to R2, prints new URLs.
//
// Run: pnpm migrate-external-images
// Requires: R2 env vars in .env.local

import { uploadToR2 } from './lib/r2-upload'
import sharp from 'sharp'

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { 'User-Agent': 'UniqueStaysUSA/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function migrateImage(url: string, r2Key: string): Promise<string> {
  console.log(`  Downloading ${url.slice(0, 80)}...`)
  const buffer = await fetchImage(url)

  // Validate it's an image
  const meta = await sharp(buffer).metadata()
  if (!meta.format) throw new Error('Not a valid image')

  const ext = meta.format === 'jpeg' ? 'jpg' : meta.format
  const key = r2Key.replace(/\.[^.]+$/, `.${ext}`)

  const result = await uploadToR2(key, buffer, `image/${meta.format === 'jpeg' ? 'jpeg' : meta.format}`)
  console.log(`  ✓ Uploaded to ${result.url}`)
  return result.url
}

// Hero images from Hero.tsx (Unsplash URLs)
const HERO_IMAGES: Array<{ url: string; key: string }> = [
  { url: 'https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?w=1200&q=80&auto=format&fit=crop', key: 'hero/dome-water.jpeg' },
  { url: 'https://images.unsplash.com/photo-1723663561534-9b129f182785?w=1200&q=80&auto=format&fit=crop', key: 'hero/aframe-pnw.jpeg' },
  { url: 'https://images.unsplash.com/photo-1486944936280-f152c82ac151?w=1200&q=80&auto=format&fit=crop', key: 'hero/lighthouse-rocky.jpeg' },
  { url: 'https://images.unsplash.com/photo-1623390003550-7af401e1f9c7?w=1200&q=80&auto=format&fit=crop', key: 'hero/houseboat-calm.jpeg' },
  { url: 'https://images.unsplash.com/photo-1605272058466-5988743ff1db?w=1200&q=80&auto=format&fit=crop', key: 'hero/tiny-house-mountains.jpeg' },
  { url: 'https://images.unsplash.com/photo-1532460089048-7b14bf14cb65?w=1200&q=80&auto=format&fit=crop', key: 'hero/tiny-house-countryside.jpeg' },
  { url: 'https://images.unsplash.com/photo-1632367294096-4e77d53c4ae9?w=1200&q=80&auto=format&fit=crop', key: 'hero/glamping-mountain.jpeg' },
  { url: 'https://images.unsplash.com/photo-1714326029322-fcc1464df757?w=1200&q=80&auto=format&fit=crop', key: 'hero/safari-sunset.jpeg' },
  { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80&auto=format&fit=crop', key: 'hero/castle-fog.jpeg' },
]

// Spoke hero images from spokes-config.ts (muscache URLs)
const SPOKE_IMAGES: Array<{ url: string; key: string }> = [
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM2NDA2MDI3NzM3ODA5OTYxNA==/original/75d84473-a0a1-413f-a370-0d7081565e17.jpeg?im_w=720&width=720&quality=70&auto=webp', key: 'spokes/unique.jpeg' },
  { url: 'https://a0.muscache.com/im/pictures/56dd4335-57f0-4e32-a823-f00cc2a73589.jpg', key: 'spokes/work-friendly.jpg' },
  { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-686663596322266612/original/2ead3374-5b5b-4e37-b480-17007c78a1af.jpeg', key: 'spokes/pet-friendly.jpeg' },
  { url: 'https://a0.muscache.com/im/pictures/640b457f-57c8-446e-acaf-0dca0296c63f.jpg', key: 'spokes/rv-ready.jpg' },
  { url: 'https://a0.muscache.com/im/pictures/prohost-api/Hosting-1019552852537000331/original/bce544ba-9a68-4e68-801d-0b4297d78d8f.jpeg', key: 'spokes/ev-ready.jpeg' },
]

async function main() {
  console.log('🖼️  Migrating external images to R2\n')

  // Derive the R2 public URL base for constructing new URLs
  const r2Base = (process.env.R2_PUBLIC_URL || 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev').replace(/\/$/, '')

  console.log('=== Hero Images ===')
  const heroResults: Array<{ oldUrl: string; newUrl: string }> = []
  for (const img of HERO_IMAGES) {
    try {
      const newUrl = await migrateImage(img.url, img.key)
      heroResults.push({ oldUrl: img.url, newUrl })
    } catch (err) {
      console.error(`  ✗ Failed: ${(err as Error).message}`)
    }
  }

  console.log('\n=== Spoke Images ===')
  const spokeResults: Array<{ oldUrl: string; newUrl: string }> = []
  for (const img of SPOKE_IMAGES) {
    try {
      const newUrl = await migrateImage(img.url, img.key)
      spokeResults.push({ oldUrl: img.url, newUrl })
    } catch (err) {
      console.error(`  ✗ Failed: ${(err as Error).message}`)
    }
  }

  console.log('\n─'.repeat(50))
  console.log('Hero URLs for Hero.tsx:')
  for (const r of heroResults) {
    console.log(`  ${r.newUrl}`)
  }

  console.log('\nSpoke URLs for spokes-config.ts:')
  for (const r of spokeResults) {
    console.log(`  ${r.newUrl}`)
  }
}

main().catch(console.error)
