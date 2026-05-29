let ph: typeof import('posthog-js').default | null = null

export async function getPostHog() {
  if (!ph) {
    const mod = await import('posthog-js')
    ph = mod.default
  }
  return ph
}
