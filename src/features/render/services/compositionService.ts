import 'server-only'
import { execFile } from 'child_process'
import { join } from 'path'
import { unlink, readdir } from 'fs/promises'
import { existsSync } from 'fs'

function findBinary(name: string): string {
  const paths = [`/opt/homebrew/bin/${name}`, `/usr/local/bin/${name}`, `/usr/bin/${name}`]
  for (const p of paths) {
    if (existsSync(p)) return p
  }
  return name
}

function findFfmpeg(): string {
  return findBinary('ffmpeg')
}

function findFfprobe(): string {
  return findBinary('ffprobe')
}

async function getVideoDimensions(videoPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    execFile(
      findFfprobe(),
      [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'json',
        videoPath,
      ],
      { timeout: 30000 },
      (error, stdout) => {
        if (error) {
          reject(new Error(`ffprobe failed: ${error.message}`))
          return
        }
        try {
          const data = JSON.parse(stdout)
          const stream = data.streams?.[0]
          if (!stream?.width || !stream?.height) {
            reject(new Error('Could not read video dimensions'))
            return
          }
          resolve({ width: stream.width, height: stream.height })
        } catch {
          reject(new Error('Failed to parse ffprobe output'))
        }
      }
    )
  })
}

interface OverlayClip {
  clipPath: string
  timestampStart: number
  timestampEnd: number
}

interface ComposeOptions {
  originalVideoPath: string
  clips: OverlayClip[]
  outputDir: string
}

export async function composeVideoWithOverlays({
  originalVideoPath,
  clips,
  outputDir,
}: ComposeOptions): Promise<string> {
  const outputPath = join(outputDir, 'final-output.mp4')

  if (clips.length === 0) {
    throw new Error('No animation clips to compose')
  }

  // Get original video dimensions to scale overlays correctly
  const { width, height } = await getVideoDimensions(originalVideoPath)
  console.log(`[FFmpeg] Original video dimensions: ${width}x${height}`)

  // Build inputs with -itsoffset so each clip starts at the right timestamp
  // -itsoffset delays the clip's playback so frame 0 of the clip aligns
  // with timestampStart in the output timeline
  // Force libvpx decoder for WebM clips to properly read VP8 alpha channel
  const inputs: string[] = ['-i', originalVideoPath]
  clips.forEach((clip) => {
    inputs.push(
      '-itsoffset', String(clip.timestampStart),
      '-c:v', 'libvpx',
      '-i', clip.clipPath
    )
  })

  // Build filter_complex: scale each overlay to video size, then overlay with alpha blending
  let filterComplex = ''
  let currentLabel = '0:v'

  clips.forEach((clip, i) => {
    const inputIdx = i + 1
    const scaledLabel = `s${i}`
    const outputLabel = i === clips.length - 1 ? 'out' : `v${i}`
    const start = clip.timestampStart
    const end = clip.timestampEnd

    // Convert to yuva420p (preserves alpha from VP8), then scale
    filterComplex += `[${inputIdx}:v]format=yuva420p,scale=${width}:${height}:flags=lanczos[${scaledLabel}]; `
    // Overlay with shortest=0 so the background continues even after overlay ends
    filterComplex += `[${currentLabel}][${scaledLabel}]overlay=0:0:shortest=0:format=auto:enable='between(t,${start},${end})'[${outputLabel}]`

    if (i < clips.length - 1) {
      filterComplex += '; '
    }

    currentLabel = outputLabel
  })

  const args = [
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[out]',
    '-map', '0:a?',
    '-c:a', 'copy',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-y',
    outputPath,
  ]

  console.log('[FFmpeg] Command args:', args.join(' '))

  await new Promise<void>((resolve, reject) => {
    execFile(
      findFfmpeg(),
      args,
      { timeout: 600000, maxBuffer: 10 * 1024 * 1024 },
      (error, _stdout, stderr) => {
        if (error) {
          console.error('FFmpeg stderr:', stderr)
          reject(new Error(`FFmpeg composition failed: ${error.message}`))
        } else {
          console.log('[FFmpeg] Composition complete:', outputPath)
          resolve()
        }
      }
    )
  })

  return outputPath
}

export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    const files = await readdir(dir)
    for (const file of files) {
      await unlink(join(dir, file)).catch(() => {})
    }
  } catch {
    // Ignore cleanup errors
  }
}
