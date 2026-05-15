import type { LivenessResult } from './types'

// HTTP GET dead-link detection
// Uses GET (not HEAD) because Airbnb/VRBO reject HEAD as anti-bot
export async function checkLiveness(url: string): Promise<LivenessResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    const finalUrl = response.url
    const isRedirectedToSearch =
      finalUrl.includes('/search') || finalUrl.includes('/s?') || finalUrl.includes('/homes')

    if (response.status === 404) {
      return { live: false, statusCode: 404, redirectUrl: finalUrl }
    }

    if (isRedirectedToSearch) {
      return {
        live: false,
        statusCode: response.status,
        redirectUrl: finalUrl,
        error: 'Redirected to search page — listing likely removed',
      }
    }

    if (response.status >= 400) {
      return { live: false, statusCode: response.status, redirectUrl: finalUrl }
    }

    // Check body for "removed" or "no longer available" indicators
    const text = await response.text()
    const removedIndicators = [
      'this listing is no longer available',
      'this listing has been removed',
      'page not found',
      'property is no longer available',
      'this property is no longer',
    ]
    const lowerText = text.toLowerCase()
    for (const indicator of removedIndicators) {
      if (lowerText.includes(indicator)) {
        return {
          live: false,
          statusCode: response.status,
          error: `Page contains: "${indicator}"`,
        }
      }
    }

    return { live: true, statusCode: response.status, redirectUrl: finalUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { live: false, error: message }
  }
}
