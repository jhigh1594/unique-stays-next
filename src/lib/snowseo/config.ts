import type { SnowSEOUnpublishAction } from './types'

const TRAILING_SLASH_REGEX = /\/+$/

function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL?.trim().replace(TRAILING_SLASH_REGEX, '') ||
    'http://localhost:3000'
  )
}

export const snowseoConfig = {
  get secret() {
    return process.env.SNOWSEO_WEBHOOK_SECRET?.trim() || null
  },
  get debug() {
    return process.env.SNOWSEO_WEBHOOK_DEBUG === 'true'
  },
  get siteBaseUrl() {
    return siteBaseUrl()
  },
  get unpublishAction() {
    return parseUnpublishAction(process.env.SNOWSEO_UNPUBLISH_ACTION)
  },
} as const

function parseUnpublishAction(value: string | undefined): SnowSEOUnpublishAction {
  switch (value?.trim().toLowerCase()) {
    case 'delete':
      return 'delete'
    case 'archive':
      return 'archive'
    case 'draft':
      return 'draft'
    default:
      return 'draft'
  }
}

export function journalUrl(slug: string): string {
  return `${snowseoConfig.siteBaseUrl}/journal/${slug}`
}
