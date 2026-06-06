import { generateObject } from 'ai'
import type { LanguageModel } from 'ai'
import type { z } from 'zod'
import { recordGenAiUsage, withGenAiSpan } from '@superlog/otel-helpers'
import { tracer } from '@/lib/telemetry'

export async function runGeminiListingGeneration<T extends z.ZodType>(options: {
  model: LanguageModel
  schema: T
  prompt: string
  callSite: string
}) {
  return withGenAiSpan(
    {
      operation: 'generate_content',
      provider: 'gcp.gemini',
      requestModel: 'gemini-2.5-flash',
      useCase: 'listing.description',
      callSite: options.callSite,
    },
    async (span) => {
      const result = await generateObject({
        model: options.model,
        schema: options.schema,
        messages: [{ role: 'user', content: options.prompt }],
        maxRetries: 2,
      })

      const usage = result.usage
      if (usage) {
        recordGenAiUsage(span, {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        })
      }

      return result
    },
    { tracer },
  )
}
