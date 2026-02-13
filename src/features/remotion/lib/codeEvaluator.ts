import React from 'react'
import * as Remotion from 'remotion'
import * as BaseComponents from '../components/base'

const ALLOWED_SCOPE: Record<string, unknown> = {
  React,
  ...Remotion,
  ...BaseComponents,
}

function stripImports(code: string): string {
  return code
    .split('\n')
    .filter((line) => !line.trim().startsWith('import '))
    .join('\n')
}

function extractExportedComponent(code: string): string {
  // Remove "export default " prefix
  let cleaned = code.replace(/export\s+default\s+/, '')
  // Remove "export " from "export const" / "export function"
  cleaned = cleaned.replace(/^export\s+/gm, '')
  return cleaned
}

function findComponentName(code: string): string | null {
  // Match: const ComponentName = () => {
  const arrowMatch = code.match(/const\s+(\w+)\s*=\s*\(/)
  if (arrowMatch) return arrowMatch[1]

  // Match: function ComponentName(
  const funcMatch = code.match(/function\s+(\w+)\s*\(/)
  if (funcMatch) return funcMatch[1]

  return null
}

/**
 * Fix common AI mistake: destructuring frame from useVideoConfig() instead of useCurrentFrame().
 * useVideoConfig() returns { fps, width, height, durationInFrames } — NOT frame.
 */
function fixFrameSource(code: string): string {
  // Pattern: const { frame, fps } = useVideoConfig() → split into two calls
  return code.replace(
    /const\s*\{\s*frame\s*,\s*fps\s*\}\s*=\s*useVideoConfig\s*\(\s*\)/g,
    'const frame = useCurrentFrame();\n  const { fps } = useVideoConfig()'
  ).replace(
    /const\s*\{\s*fps\s*,\s*frame\s*\}\s*=\s*useVideoConfig\s*\(\s*\)/g,
    'const frame = useCurrentFrame();\n  const { fps } = useVideoConfig()'
  ).replace(
    // Also catch: const { frame } = useVideoConfig()
    /const\s*\{\s*frame\s*\}\s*=\s*useVideoConfig\s*\(\s*\)/g,
    'const frame = useCurrentFrame()'
  )
}

/**
 * Sanitize frame numbers in interpolate() calls.
 * AI sometimes generates huge frame numbers (video timestamps instead of local frames).
 * This detects and rescales them to start from 0.
 */
function sanitizeFrameNumbers(code: string): string {
  // Find all interpolate(frame, [X, Y], ...) patterns and collect frame numbers
  const interpolateRegex = /interpolate\s*\(\s*frame\s*,\s*\[([^\]]+)\]/g
  const allFrameNumbers: number[] = []

  let match
  while ((match = interpolateRegex.exec(code)) !== null) {
    const nums = match[1].split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n))
    allFrameNumbers.push(...nums)
  }

  if (allFrameNumbers.length === 0) return code

  const maxFrame = Math.max(...allFrameNumbers)
  const minFrame = Math.min(...allFrameNumbers)

  // If frame numbers are reasonable (< 1000), no fix needed
  if (maxFrame < 1000) return code

  // Rescale: shift all frame numbers so the minimum starts near 0, and compress to fit in ~300 frames
  const range = maxFrame - minFrame || 1
  const targetRange = Math.min(300, range)
  const scale = targetRange / range

  return code.replace(interpolateRegex, (_fullMatch, numbersStr: string) => {
    const fixed = numbersStr.split(',').map((s) => {
      const n = parseFloat(s.trim())
      if (isNaN(n)) return s
      return String(Math.round((n - minFrame) * scale))
    }).join(', ')
    return `interpolate(frame, [${fixed}]`
  })
}

export interface EvalResult {
  component: React.ComponentType | null
  error: string | null
}

export function evaluateRemotionCode(code: string): EvalResult {
  try {
    const stripped = stripImports(code)
    const exported = extractExportedComponent(stripped)
    const frameFixed = fixFrameSource(exported)
    const sanitized = sanitizeFrameNumbers(frameFixed)
    const componentName = findComponentName(sanitized)

    if (!componentName) {
      return { component: null, error: 'No se encontro el nombre del componente en el codigo generado' }
    }

    const scopeKeys = Object.keys(ALLOWED_SCOPE)
    const scopeValues = Object.values(ALLOWED_SCOPE)

    const wrappedCode = `${sanitized}\nreturn ${componentName};`

    const factory = new Function(...scopeKeys, wrappedCode)
    const result = factory(...scopeValues)

    if (typeof result === 'function') {
      return { component: result as React.ComponentType, error: null }
    }

    return { component: null, error: 'El codigo no retorno un componente React valido' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Code evaluation error:', err)
    return { component: null, error: message }
  }
}
