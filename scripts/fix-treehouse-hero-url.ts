// Fixes the treehouse hero image URL to point to Vercel Blob instead of Payload API path
// Run: pnpm exec tsx --env-file=.env.local scripts/fix-treehouse-hero-url.ts

import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })

  const media = await payload.update({
    collection: 'media',
    id: 4,
    data: {
      url: 'https://a7v1qq3bzbgnznqq.public.blob.vercel-storage.com/stays/treehouses-hero-qDJj6pDZQJln0BIVufSiCherA7akJi.jpg',
    } as any,
  })

  console.log('Updated media:', media.id, media.url)

  // Trigger ISR revalidation
  const res = await fetch('https://www.uniquestaysusa.com/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET!,
    },
    body: JSON.stringify({ tag: 'journal:most-extraordinary-treehouses-america' }),
  })
  console.log('Revalidation:', await res.text())

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
