import 'server-only'
import path from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { mkdir } from 'fs/promises'

interface RenderClipOptions {
  code: string
  durationInFrames: number
  outputDir: string
  clipIndex: number
  bundleLocation: string
}

interface RenderedClip {
  path: string
  durationInFrames: number
  index: number
}

/**
 * Bundle the Remotion entry point once. Reuse for all clips.
 */
export async function createRemotionBundle(): Promise<string> {
  const { bundle } = await import('@remotion/bundler')

  const entryPoint = path.resolve(
    process.cwd(),
    'src/features/remotion/compositions/Root.tsx'
  )

  console.log('[Remotion] Bundling entry point:', entryPoint)

  const bundleLocation = await bundle({
    entryPoint,
    onProgress: (progress: number) => {
      if (progress % 25 === 0) {
        console.log(`[Remotion] Bundling: ${progress}%`)
      }
    },
  })

  console.log('[Remotion] Bundle ready at:', bundleLocation)
  return bundleLocation
}

export async function renderAnimationClip({
  code,
  durationInFrames,
  outputDir,
  clipIndex,
  bundleLocation,
}: RenderClipOptions): Promise<RenderedClip> {
  const { renderMedia, selectComposition } = await import('@remotion/renderer')

  console.log(`[Remotion] Rendering clip ${clipIndex}, ${durationInFrames} frames`)

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'DynamicAnimation',
    inputProps: { code },
  })

  const outputPath = path.join(outputDir, `clip-${clipIndex}.webm`)

  const totalFrames = Math.max(durationInFrames, 30)
  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
    },
    serveUrl: bundleLocation,
    codec: 'vp8',
    outputLocation: outputPath,
    inputProps: { code },
    imageFormat: 'png',
    pixelFormat: 'yuva420p',
    concurrency: 4,
    onProgress: ({ renderedFrames }: { renderedFrames: number }) => {
      if (renderedFrames % 30 === 0) {
        console.log(`[Remotion] Clip ${clipIndex}: ${renderedFrames}/${totalFrames} frames`)
      }
    },
  })

  console.log(`[Remotion] Clip ${clipIndex} rendered to:`, outputPath)

  return {
    path: outputPath,
    durationInFrames,
    index: clipIndex,
  }
}

export async function createTempDir(): Promise<string> {
  const dir = path.join(tmpdir(), `akira-render-${randomUUID()}`)
  await mkdir(dir, { recursive: true })
  return dir
}
