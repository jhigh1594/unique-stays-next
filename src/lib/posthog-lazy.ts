import { getPostHogClient } from './posthog-server'

export async function getPostHog() {
  return getPostHogClient()
}
