import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { l2Normalize, cosineSimilarity } from '@/lib/cosine'

export const maxDuration = 30

type IndexEntry = { id: number; vec: Float32Array }

let cachedIndex: IndexEntry[] | null = null

function getIndex(): IndexEntry[] {
  if (cachedIndex) return cachedIndex
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'search-index.json'), 'utf-8'),
  ) as Array<{ id: number; vec: number[] }>
  cachedIndex = raw.map((entry) => ({ id: entry.id, vec: Float32Array.from(entry.vec) }))
  return cachedIndex
}

async function embedQuery(q: string): Promise<number[]> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey) throw new Error('NVIDIA_NIM_API_KEY not set')

  const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'baai/bge-m3',
      input: q,
      input_type: 'query',
      encoding_format: 'float',
    }),
  })

  if (!res.ok) throw new Error(`NIM API error ${res.status}`)
  const json = (await res.json()) as { data: Array<{ embedding: number[] }> }
  return json.data[0].embedding
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length < 3 || q.length > 500) {
    return NextResponse.json({ ids: null })
  }

  try {
    const rawVec = await embedQuery(q.trim())
    const queryVec = Float32Array.from(l2Normalize(rawVec))
    const index = getIndex()

    const scored = index.map((entry) => ({
      id: entry.id,
      score: cosineSimilarity(queryVec, entry.vec),
    }))

    scored.sort((a, b) => b.score - a.score)

    const ids = scored.filter((e) => e.score > 0.3).map((e) => e.id)

    if (ids.length === 0) return NextResponse.json({ ids: null })

    return NextResponse.json({ ids })
  } catch {
    return NextResponse.json({ ids: null })
  }
}
