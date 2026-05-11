// Fixes the workcation hero image URL to point to Vercel Blob
// Run: pnpm exec tsx --env-file=.env.local scripts/fix-workcation-hero-url.ts

import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })

  const media = await payload.update({
    collection: 'media',
    id: 3,
    data: {
      url: 'https://a7v1qq3bzbgnznqq.public.blob.vercel-storage.com/stays/workcation-hero-a8rJyAquccZX6wq949RvfFT7VbNeRp.jpeg',
    } as any,
  })

  console.log('Updated media:', media.id, media.url)

  const res = await fetch('https://www.uniquestaysusa.com/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET!,
    },
    body: JSON.stringify({ tag: 'journal:workcation-manifesto-remote-work-treehouse' }),
  })
  console.log('Revalidation:', await res.text())

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
