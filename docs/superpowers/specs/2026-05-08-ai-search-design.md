# AI Search Design

**Date:** 2026-05-08  
**Status:** Approved  
**Scope:** v1 — augment directory search bar with semantic vector search

---

## Problem

The existing `/directory` search is client-side keyword matching against title, location, state, category, tags, and description. It fails on natural-language queries like "Treehouses near the California redwoods with a hot tub" — it has no concept of geographic semantics, synonyms, or vibe.

---

## Approach

Pre-computed vector embeddings + server-side cosine similarity. No per-query LLM call in v1. Near-zero running cost.

**Not chosen:**
- LLM intent extraction → structured filters: works for category/state but breaks on vibe queries and geographic semantics
- Sending all listings to an LLM per query: $0.05–0.10/search, 3–5s latency, unacceptable at scale
- Client-side vector search: exposes a 2.5MB embeddings file to the browser on every session

---

## Architecture

### Build time (manual, run after adding listings)

```
Payload CMS (all stays)
  → scripts/generate-search-index.ts
      1. Fetch all stays via getAllStays()
      2. Template searchText per listing (see Data Layer)
      3. Batch embed via NVIDIA NIM baai/bge-m3 (taskType: RETRIEVAL_DOCUMENT)
      4. L2-normalize each vector
      5. Write data/search-index.json [{id, vec: number[1024]}]
```

Invoked via: `pnpm index:search`  
Not wired into `next build` — listings change weekly, not on every deploy.

### Runtime (per NL search query)

```
User types query in /directory search bar
  → isNaturalLanguage(q)?
      NO  (≤2 words or exact category/region match)
          → existing client-side text filter, instant
      YES
          → debounce 400ms
          → GET /api/search?q=...
              1. Embed query via NVIDIA NIM bge-m3 (taskType: RETRIEVAL_QUERY)
              2. L2-normalize query vector
              3. Load search-index.json (module-scope cache)
              4. Cosine similarity × 250 listings (<1ms)
              5. Filter: score > 0.3
              6. Return { ids: number[] } ordered by score
          → DirectoryContent re-sorts pre-loaded card grid by ID order
```

### v2 Extension Point: HyDE

Between step 1 and 2 in `/api/search`: call Groq Llama 3.3 70B (free tier) to generate a synthetic listing description matching the query. Embed the synthetic description instead of the raw query. Improves geographic and vibe resolution ("near the redwoods" → listing-vocabulary prose before embedding).

No scaffolding needed — the embedding step is already extracted, HyDE is a one-function addition.

---

## Data Layer

### searchText template

```
{title} — {categoryLabel} in {location} ({region}).
Sleeps {sleeps}, {bedrooms} bedroom(s), ${price}/night.
Rating: {rating}/5 ({reviewCount} reviews).
Amenities: {tags.join(', ')}.
{description}
Spokes: {spokesLabels.join(', ')}.
```

Uses `CATEGORIES_CONFIG` and `SPOKES_CONFIG` to convert slugs to human-readable labels. No Claude call required in v1 — `bge-m3`'s training data is rich enough that "Guerneville, California" + "redwoods" in the description bridges the semantic gap.

### search-index.json schema

```ts
type SearchIndex = Array<{
  id: number       // Payload stay ID
  vec: number[]    // 1024-dim L2-normalized float32
}>
```

searchText is not stored in the runtime index — only needed during generation. Keeps the file at ~2.5MB instead of ~5MB.

**Location:** `data/search-index.json` — outside `/public`, never served to browsers.

### Embedding model

- Provider: NVIDIA NIM (`integrate.api.nvidia.com/v1`)
- Model: `baai/bge-m3` — 1024 dims, 8192-token context, MTEB-competitive
- API: OpenAI-compatible `/v1/embeddings`
- Auth: `NVIDIA_NIM_API_KEY` env var
- L2 normalization: required when using non-default dimensionality; applied after embedding, before writing index and before cosine computation at query time

---

## Search API Route

**File:** `src/app/api/search/route.ts`  
**Method:** GET  
**Params:** `q` (string)

### Module-scope cache

```ts
let cachedIndex: Array<{ id: number; vec: Float32Array }> | null = null
```

Populated on first request, reused across warm Vercel Fluid Compute instances. Converts `number[]` → `Float32Array` once for ~4× faster cosine math.

### Handler logic

1. Read `q` from searchParams
2. If `!q || q.trim().length < 3` → return `{ ids: null }`
3. Embed `q` via NVIDIA NIM, taskType `RETRIEVAL_QUERY`
4. L2-normalize query vector
5. Load index via `getIndex()` (cached)
6. Cosine similarity against all 250 entries
7. Sort descending, filter `score > 0.3`
8. Return `{ ids: number[] }` — ordered IDs, no scores

### Response contract

```ts
{ ids: number[] }   // AI-ranked results — re-sort the card grid
{ ids: null }       // Signal: fall back to client-side text filter
```

`null` vs `[]` distinction is intentional: `[]` would show an empty grid; `null` shows the text-filtered grid instead, which is always better than nothing.

### Error handling

- NVIDIA NIM unavailable → catch → return `{ ids: null }`
- `data/search-index.json` missing → catch, log warning → return `{ ids: null }`
- No entries above score threshold → return `{ ids: null }`

Graceful degradation: AI search failure is invisible to the user.

---

## Client Integration

**File:** `src/app/(app)/directory/_directory/DirectoryContent.tsx`

### New state

```ts
const [aiIds, setAiIds] = useState<number[] | null>(null)
const [aiLoading, setAiLoading] = useState(false)
```

### NL detection

```ts
function isNaturalLanguage(q: string): boolean {
  if (q.trim().length <= 2) return false
  const knownTerms = [
    ...CATEGORIES_CONFIG.map(c => c.id),
    ...REGIONS.map(r => r.toLowerCase()),
    'airbnb', 'vrbo', 'wander',
  ]
  return !knownTerms.some(term => q.toLowerCase() === term)
}
```

### Debounced search effect

Fires 400ms after the user stops typing. Calls `/api/search`, sets `aiIds`. Resets `aiIds` to `null` when query becomes non-NL (reverts to text filter).

### Updated filtered memo

AI path added as the first branch:

```ts
if (aiIds !== null) {
  const ranked = aiIds
    .map(id => allStays.find(s => s.id === id))
    .filter(Boolean) as NormalizedStay[]
  return applyFilters(ranked, activeCategory, activeRegion, activePlatform)
}
// existing text filter path unchanged below
```

Dropdown filters (category, region, platform) remain composable on top of AI results.

### Loading indicator

Search icon gets `animate-pulse` while `aiLoading` is true. No AI badge, no skeleton, no chat UI — silent intelligence.

---

## New files

| File | Purpose |
|---|---|
| `scripts/generate-search-index.ts` | Build-time: fetch stays, template searchText, embed, write index |
| `src/app/api/search/route.ts` | Runtime: embed query, cosine similarity, return ordered IDs |
| `data/search-index.json` | Generated artifact — gitignored, regenerated manually |
| `src/lib/cosine.ts` | L2-normalize + cosine similarity utilities (15 lines) |

## Modified files

| File | Change |
|---|---|
| `src/app/(app)/directory/_directory/DirectoryContent.tsx` | 2 new state vars, 1 new effect, 1 new memo branch, search icon pulse |
| `package.json` | Add `"index:search": "tsx scripts/generate-search-index.ts"` |
| `.env.local.example` | Add `NVIDIA_NIM_API_KEY=` |
| `.gitignore` | Add `data/search-index.json` |

---

## Environment variables

| Var | Purpose |
|---|---|
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM API access for both build-time and runtime embedding |

---

## Cost model

| Operation | Cost |
|---|---|
| Index generation (250 listings, one-time) | ~1,000 NIM free credits — negligible |
| Per NL query (embedding only) | ~$0.000004 (NIM paid tier, after free credits) |
| Per NL query at 10K/month | ~$0.04/month |
| HyDE addition (v2) | +$0.0003/query via Groq free tier |

---

## Out of scope (v1)

- HyDE query expansion (extension point documented above)
- Homepage "describe your dream stay" hero search
- Re-ranking step (RRF BM25 + vector merge)
- Claude-enriched searchText with geographic context
- Streaming results
- Search analytics
