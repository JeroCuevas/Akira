import { createOpenRouter } from '@openrouter/ai-sdk-provider'

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export const MODELS = {
  fast: 'google/gemini-2.5-flash-lite',
  balanced: 'google/gemini-2.5-flash',
  powerful: 'google/gemini-2.5-pro',
  codegen: 'google/gemini-2.5-pro',
} as const

export type ModelKey = keyof typeof MODELS
