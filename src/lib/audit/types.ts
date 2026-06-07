export type Severity = 'info' | 'warning' | 'critical'

export interface Finding {
  field: string
  expected: string
  actual: string
  severity: Severity
}

export interface LivenessResult {
  live: boolean
  statusCode?: number
  redirectUrl?: string
  error?: string
}

export interface ScrapedListing {
  title: string | null
  price: number | null
  imageUrl: string | null
  available: boolean
  listingActive: boolean
}

export interface ScrapeResult {
  success: boolean
  data?: ScrapedListing
  error?: string
}

export interface AuditStay {
  id: string
  title: string
  slug: string
  platform: string
  affiliateUrl: string
  imageUrl: string
  galleryImages: string[]
  price: number
}

export interface AuditReport {
  stayId: string
  staySlug: string
  stayTitle: string
  platform: string
  affiliateUrl: string
  severity: Severity
  findings: Finding[]
  error?: string
}

export interface AuditSummary {
  runId: string
  checked: number
  issues: number
  critical: number
  warnings: number
  info: number
  errors: number
  reports: AuditReport[]
}
