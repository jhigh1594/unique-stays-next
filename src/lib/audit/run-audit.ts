import type { Payload } from 'payload'
import type { AuditReport, AuditSummary, Finding } from './types'
import { selectStays } from './select-stays'
import { checkLiveness } from './check-liveness'
import { scrapeListing, scrapeDelay } from './scrape-listing'
import { compareData, overallSeverity } from './compare'

export interface RunAuditOptions {
  limit?: number
}

// Orchestrator: select stays → check liveness → scrape → compare → write reports
export async function runAudit(
  payload: Payload,
  options: RunAuditOptions = {},
): Promise<AuditSummary> {
  const limit = options.limit ?? 10
  const runId = `audit-${Date.now()}`

  const stays = await selectStays(payload, limit)

  const reports: AuditReport[] = []
  let critical = 0
  let warnings = 0
  let info = 0
  let errors = 0

  for (const stay of stays) {
    try {
      // Step 1: Liveness check (cheap HTTP GET)
      const liveness = await checkLiveness(stay.affiliateUrl)

      let scraped = null
      let findings: Finding[] = []

      // Step 2: If live and not Direct platform, scrape for content comparison
      if (liveness.live && stay.platform !== 'Direct') {
        const scrapeResult = await scrapeListing(stay.affiliateUrl, stay.platform)
        if (scrapeResult.success && scrapeResult.data) {
          scraped = scrapeResult.data
        } else if (scrapeResult.error) {
          // Scrape failure is non-fatal — continue with liveness-only
          errors++
        }
        await scrapeDelay()
      }

      // Step 3: Compare stored vs scraped (includes image liveness)
      findings = await compareData(stay, liveness, scraped)

      const severity = overallSeverity(findings)

      if (severity === 'critical') critical++
      else if (severity === 'warning') warnings++
      else if (findings.length > 0) info++

      const report: AuditReport = {
        stayId: stay.id,
        staySlug: stay.slug,
        stayTitle: stay.title,
        platform: stay.platform,
        affiliateUrl: stay.affiliateUrl,
        severity,
        findings,
      }
      reports.push(report)

      // Write report to Payload
      await payload.create({
        collection: 'audit-reports',
        overrideAccess: true,
        data: {
          runId,
          stay: stay.id as unknown as number,
          staySlug: stay.slug,
          stayTitle: stay.title,
          platform: stay.platform as 'Airbnb' | 'VRBO' | 'Wander' | 'Direct',
          affiliateUrl: stay.affiliateUrl,
          severity,
          status: findings.length > 0 ? 'pending' : 'reviewed',
          findings: findings.map((f) => ({
            field: f.field,
            expected: f.expected,
            actual: f.actual,
            severity: f.severity,
          })),
          checkedAt: new Date().toISOString(),
        },
      })
    } catch (err) {
      // Individual stay failure doesn't abort the batch
      const message = err instanceof Error ? err.message : String(err)
      errors++

      const report: AuditReport = {
        stayId: stay.id,
        staySlug: stay.slug,
        stayTitle: stay.title,
        platform: stay.platform,
        affiliateUrl: stay.affiliateUrl,
        severity: 'info',
        findings: [],
        error: message,
      }
      reports.push(report)

      await payload.create({
        collection: 'audit-reports',
        overrideAccess: true,
        data: {
          runId,
          stay: stay.id as unknown as number,
          staySlug: stay.slug,
          stayTitle: stay.title,
          platform: stay.platform as 'Airbnb' | 'VRBO' | 'Wander' | 'Direct',
          affiliateUrl: stay.affiliateUrl,
          severity: 'info',
          status: 'pending',
          findings: [],
          checkedAt: new Date().toISOString(),
        },
      })
    }
  }

  return {
    runId,
    checked: stays.length,
    issues: critical + warnings + info,
    critical,
    warnings,
    info,
    errors,
    reports,
  }
}
