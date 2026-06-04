/**
 * Pre-build cache warmup.
 *
 * Runs before `next build` to:
 *   1. Boot Payload once (avoid first-SSG-page boot tax repeated ~250x).
 *   2. Open the Postgres pool so Neon compute is already scaled up.
 *   3. Pre-fetch the slug lists that `generateStaticParams` will request.
 *
 * Does NOT write to `.next/cache/fetch-cache` directly — that's `next build`'s
 * job. The win is eliminating the cold-boot penalty on the first SSG page,
 * plus warming Neon so subsequent per-page fetches are fast.
 *
 * Fails open: missing env, DB unreachable, or any other error logs and exits 0
 * so it never blocks a deploy.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local if present (Vercel provides env at build time natively).
const envLocal = resolve(process.cwd(), '.env.local')
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
}

async function warm() {
  if (!process.env.PAYLOAD_SECRET || !process.env.DATABASE_URI) {
    console.log('[warm-cache] skipping (PAYLOAD_SECRET or DATABASE_URI not set)')
    return
  }

  const started = Date.now()
  console.log('[warm-cache] booting Payload...')

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  console.log('[warm-cache] Payload ready, priming DB pool + slug queries...')

  // Slug lists used by generateStaticParams + homepage queries.
  // Run in parallel; each is a tiny depth=0 query.
  const [stays, journal] = await Promise.all([
    payload
      .find({ collection: 'stays', limit: 1, depth: 0, overrideAccess: true })
      .catch(() => null),
    payload
      .find({
        collection: 'blog-posts',
        where: { status: { equals: 'published' } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null),
  ])

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `[warm-cache] done in ${elapsed}s ` +
      `(stays: ${stays?.totalDocs ?? 'err'}, journal: ${journal?.totalDocs ?? 'err'})`
  )
}

warm().catch((err) => {
  console.error('[warm-cache] failed (continuing):', err?.message ?? err)
  // Fail open — never block the build.
  process.exit(0)
})

