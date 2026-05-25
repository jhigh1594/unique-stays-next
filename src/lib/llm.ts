// Shared LLM module with automatic failover from NVIDIA NIM to OpenRouter on 429.
// All pipelines should use generateWithFailover() instead of calling generateText() directly.

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

type LLMProvider = 'nvidia-nim' | 'openrouter'
type LLMPurpose = 'discover' | 'enrich'

// Model name mapping between providers
const MODEL_MAP: Record<string, string> = {
  'meta/llama-3.3-70b-instruct': 'meta-llama/llama-3.3-70b-instruct',
}

const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct'
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

function cleanKey(envVar: string): string {
  return (process.env[envVar] || '').replace(/^["']|["']$/g, '')
}

function resolveModelId(purpose: LLMPurpose, override?: string): string {
  if (override) return override
  const envVar = purpose === 'discover' ? 'DISCOVER_MODEL_ID' : 'ENRICH_MODEL_ID'
  return process.env[envVar] || DEFAULT_MODEL
}

// Lazy-initialized provider singletons
let nvidiaProvider: ReturnType<typeof createOpenAI> | null = null
let openrouterProvider: ReturnType<typeof createOpenAI> | null = null

function getNvidiaProvider(): ReturnType<typeof createOpenAI> | null {
  const key = cleanKey('NVIDIA_NIM_API_KEY')
  if (!key) return null
  if (!nvidiaProvider) {
    nvidiaProvider = createOpenAI({
      baseURL: NVIDIA_BASE_URL,
      apiKey: key,
    })
  }
  return nvidiaProvider
}

function getOpenrouterProvider(): ReturnType<typeof createOpenAI> | null {
  const key = cleanKey('OPENROUTER_API_KEY')
  if (!key) return null
  if (!openrouterProvider) {
    openrouterProvider = createOpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: key,
    })
  }
  return openrouterProvider
}

function getOpenrouterModelId(nvidiaModelId: string): string {
  return MODEL_MAP[nvidiaModelId] || nvidiaModelId
}

function is429(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('429') || msg.includes('Too Many Requests')
}

export type { LLMProvider, LLMPurpose }

export interface FailoverResult {
  text: string
  provider: LLMProvider
}

export interface FailoverOptions {
  system?: string
  prompt: string
  maxOutputTokens?: number
  temperature?: number
  experimental_telemetry?: Record<string, unknown>
}

async function callProvider(
  provider: ReturnType<typeof createOpenAI>,
  modelId: string,
  options: FailoverOptions,
): Promise<string> {
  const result = await generateText({
    model: provider.chat(modelId),
    system: options.system,
    prompt: options.prompt,
    maxOutputTokens: options.maxOutputTokens,
    temperature: options.temperature,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experimental_telemetry: options.experimental_telemetry as any,
  })
  return result.text
}

export async function generateWithFailover(
  options: FailoverOptions,
  purpose: LLMPurpose = 'discover',
  modelOverride?: string,
): Promise<FailoverResult> {
  const modelId = resolveModelId(purpose, modelOverride)

  // Try NVIDIA NIM first
  const nvidia = getNvidiaProvider()
  if (nvidia) {
    try {
      const text = await callProvider(nvidia, modelId, options)
      return { text, provider: 'nvidia-nim' }
    } catch (err) {
      if (!is429(err)) throw err
      // Fall through to OpenRouter
    }
  }

  // Failover to OpenRouter
  const openrouter = getOpenrouterProvider()
  if (openrouter) {
    const orModelId = getOpenrouterModelId(modelId)
    const text = await callProvider(openrouter, orModelId, options)
    return { text, provider: 'openrouter' }
  }

  // No providers available
  if (!nvidia && !openrouter) {
    throw new Error('No LLM provider configured. Set NVIDIA_NIM_API_KEY or OPENROUTER_API_KEY.')
  }

  // NVIDIA failed with 429 but no OpenRouter available
  throw new Error('NVIDIA NIM rate limited and no OpenRouter fallback configured. Set OPENROUTER_API_KEY.')
}
