// Version-on-write for R2-backed image URLs.
//
// The image-cdn worker serves images with `Cache-Control: immutable` and the CDN
// edge + browsers cache them for a year by URL. Re-uploading bytes to the same R2
// key therefore never reaches viewers — the cached old bytes win until expiry.
//
// Attaching a content-derived version param (`?v=<hash>`) to the stored imageUrl
// changes the URL the site requests whenever the bytes actually change. The
// next/image loader forwards `?v=` to the worker (see src/lib/image-loader.ts),
// so a new version = a cache miss at the edge + in the browser.
//
// Same bytes ⇒ same version ⇒ still a cache hit (no needless churn).

import { createHash } from 'node:crypto'

/** Short, deterministic content fingerprint (same bytes ⇒ same value). */
export function imageVersion(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 10)
}

/** Append `?v=<hash>` to a public image URL based on the uploaded bytes. */
export function withVersion(url: string, buffer: Buffer): string {
  const u = new URL(url)
  u.searchParams.set('v', imageVersion(buffer))
  return u.toString()
}
