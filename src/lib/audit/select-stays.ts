import type { Payload } from 'payload'
import type { AuditStay } from './types'

// Select stays for audit, prioritizing never-audited then oldest-audited
export async function selectStays(payload: Payload, limit = 10): Promise<AuditStay[]> {
  // Step 1: Find stays recently audited (last 7 days) to exclude
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)

  const recentReports = await payload.find({
    collection: 'audit-reports',
    where: {
      checkedAt: { greater_than: cutoff.toISOString() },
    },
    depth: 0,
    limit: 200,
    select: { stay: true },
  })

  const recentStayIds = new Set(
    recentReports.docs
      .map((r) => r.stay as unknown as string | number | null)
      .filter(Boolean)
      .map(String),
  )

  // Step 2: Fetch published stays, prioritizing those never audited
  const allStays = await payload.find({
    collection: 'stays',
    where: {
      _status: { equals: 'published' },
      affiliateUrl: { exists: true },
    },
    depth: 0,
    limit: 300,
    sort: '-updatedAt',
  })

  const candidates = allStays.docs
    .filter((s) => !recentStayIds.has(String(s.id)))
    .map((s): AuditStay => ({
      id: String(s.id),
      title: (s.title as string) ?? '',
      slug: (s.slug as string) ?? '',
      platform: (s.platform as string) ?? '',
      affiliateUrl: (s.affiliateUrl as string) ?? '',
      imageUrl: (s.imageUrl as string) ?? '',
      price: (s.price as number) ?? 0,
    }))

  // Shuffle then take limit — avoids predictable scraping patterns
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  return candidates.slice(0, limit)
}
