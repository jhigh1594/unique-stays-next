import posthog from 'posthog-js'

let initialized = false

function init() {
  if (initialized) return
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      persistence: 'localStorage',
    })
  }
  initialized = true
}

export async function getPostHog() {
  init()
  return posthog
}
