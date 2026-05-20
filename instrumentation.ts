export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { resourceFromAttributes } = await import('@opentelemetry/resources')
    const { PostHogSpanProcessor } = await import('@posthog/ai/otel')

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        'service.name': 'uniquestaysusa',
      }),
      spanProcessors: [
        new PostHogSpanProcessor({
          apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
          host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        }),
      ],
    })

    sdk.start()
  }
}
