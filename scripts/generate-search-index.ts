// Generate AI semantic search index for /directory
// Run: pnpm index:search
// Requires: DATABASE_URI, PAYLOAD_SECRET, NVIDIA_NIM_API_KEY in .env.local
// Note: runs automatically before next build via vercel.json buildCommand

import { getPayload } from 'payload'
import config from '@payload-config'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { l2Normalize } from '../src/lib/cosine.ts'
import { CATEGORIES_CONFIG } from '../src/lib/categories-config.ts'
import { SPOKES_CONFIG } from '../src/lib/spokes-config.ts'

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/embeddings'
const NIM_MODEL = 'nvidia/nv-embedqa-e5-v5'
const BATCH_SIZE = 50

type SearchEntry = { id: number; vec: number[] }

function getCategoryLabel(slug: string): string {
  return CATEGORIES_CONFIG.find((c) => c.id === slug)?.label ?? slug
}

function getSpokeLabel(slug: string): string {
  return SPOKES_CONFIG[slug]?.title ?? slug
}

function buildSearchText(doc: Record<string, unknown>): string {
  const category = doc.category as Record<string, unknown> | null
  const categorySlug =
    typeof category === 'object' && category !== null ? (category.slug as string) : ''
  const spokes = (doc.spokes ?? []) as Array<Record<string, unknown>>
  const spokeLabels = spokes
    .map((s) => getSpokeLabel(typeof s === 'object' && s !== null ? (s.slug as string) : ''))
    .filter(Boolean)
    .join(', ')
  const tags = ((doc.tags ?? []) as Array<{ tag: string }>).map((t) => t.tag).join(', ')
  const ratingStr =
    doc.rating != null ? `${doc.rating}/5 (${doc.reviewCount ?? 0} reviews).` : 'No rating yet.'

  return [
    `${doc.title} — ${getCategoryLabel(categorySlug)} in ${doc.location} (${doc.region}).`,
    `Sleeps ${doc.sleeps}, ${doc.bedrooms} bedroom(s), $${doc.price}/night.`,
    `Rating: ${ratingStr}`,
    tags ? `Amenities: ${tags}.` : '',
    (doc.description as string) ?? '',
    spokeLabels ? `Spokes: ${spokeLabels}.` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(NIM_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      input: texts,
      input_type: 'passage',
      encoding_format: 'float',
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`NIM API error ${res.status}: ${errText}`)
  }

  const json = (await res.json()) as {
    data: Array<{ embedding: number[]; index: number }>
  }
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

async function main() {
  if (!process.env.NVIDIA_NIM_API_KEY) {
    console.warn('[index:search] NVIDIA_NIM_API_KEY not set — skipping search index generation')
    process.exit(0)
  }

  const apiKey = process.env.NVIDIA_NIM_API_KEY
  const payload = await getPayload({ config })

  const allDocs: Array<Record<string, unknown>> = []
  let page = 1
  const pageSize = 100

  while (true) {
    const { docs, totalDocs } = await payload.find({
      collection: 'stays',
      limit: pageSize,
      page,
      depth: 1,
    })
    for (const doc of docs) allDocs.push(doc as unknown as Record<string, unknown>)
    if (allDocs.length >= totalDocs) break
    page++
  }

  console.log(`[index:search] Found ${allDocs.length} stays — building searchText...`)

  const searchTexts = allDocs.map((doc) => ({
    id: doc.id as number,
    text: buildSearchText(doc),
  }))

  const index: SearchEntry[] = []
  let embedded = 0

  for (let i = 0; i < searchTexts.length; i += BATCH_SIZE) {
    const batch = searchTexts.slice(i, i + BATCH_SIZE)
    const vecs = await embedBatch(batch.map((e) => e.text), apiKey)
    for (let j = 0; j < batch.length; j++) {
      index.push({ id: batch[j].id, vec: l2Normalize(vecs[j]) })
    }
    embedded += batch.length
    process.stdout.write(`  embedded ${embedded}/${searchTexts.length}\r`)
  }

  console.log(`\n[index:search] All embeddings generated`)

  const outDir = join(process.cwd(), 'data')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'search-index.json')
  writeFileSync(outPath, JSON.stringify(index))

  const sizeKB = Math.round(Buffer.byteLength(JSON.stringify(index)) / 1024)
  console.log(`[index:search] Wrote ${outPath} (${sizeKB} KB, ${index.length} entries)`)

  await payload.db.pool.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('[index:search] Failed:', err)
  process.exit(1)
})
