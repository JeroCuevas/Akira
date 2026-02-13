import 'server-only'
import { AssemblyAI } from 'assemblyai'
import { execFile } from 'child_process'
import { readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { TranscriptionSegment } from '@/shared/types/database'

function findBinary(name: string): string {
  const paths = [
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`,
  ]
  for (const p of paths) {
    if (existsSync(p)) return p
  }
  return name // fallback to PATH
}

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
})

function groupWordsIntoSegments(
  words: Array<{ text: string; start: number; end: number; confidence: number }>
): TranscriptionSegment[] {
  const segments: TranscriptionSegment[] = []
  const wordsPerSegment = 12

  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const chunk = words.slice(i, i + wordsPerSegment)
    const text = chunk.map((w) => w.text).join(' ')
    const start = chunk[0].start
    const end = chunk[chunk.length - 1].end
    const confidence = chunk.reduce((sum, w) => sum + w.confidence, 0) / chunk.length

    segments.push({ text, start, end, confidence })
  }

  return segments
}

async function downloadYouTubeAudio(youtubeUrl: string): Promise<Buffer> {
  const outputPath = join(tmpdir(), `akira-${randomUUID()}.m4a`)

  await new Promise<void>((resolve, reject) => {
    execFile(
      'yt-dlp',
      [
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '--no-playlist',
        '-o', outputPath,
        youtubeUrl,
      ],
      { timeout: 120000 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`yt-dlp failed: ${stderr || error.message}`))
        } else {
          resolve()
        }
      }
    )
  })

  const buffer = await readFile(outputPath)
  await unlink(outputPath).catch(() => {})
  return buffer
}

async function extractAudioFromVideo(videoBuffer: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `akira-input-${randomUUID()}.mp4`)
  const outputPath = join(tmpdir(), `akira-audio-${randomUUID()}.m4a`)

  await writeFile(inputPath, videoBuffer)

  await new Promise<void>((resolve, reject) => {
    execFile(
      findBinary('ffmpeg'),
      [
        '-i', inputPath,
        '-vn',
        '-acodec', 'aac',
        '-b:a', '128k',
        '-y',
        outputPath,
      ],
      { timeout: 300000 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`ffmpeg audio extraction failed: ${stderr || error.message}`))
        } else {
          resolve()
        }
      }
    )
  })

  const audioBuffer = await readFile(outputPath)
  await unlink(inputPath).catch(() => {})
  await unlink(outputPath).catch(() => {})
  return audioBuffer
}

async function transcribeAudioBuffer(audioBuffer: Buffer): Promise<TranscriptionSegment[]> {
  const uploadUrl = await client.files.upload(audioBuffer)

  const transcript = await client.transcripts.transcribe({
    audio_url: uploadUrl,
    speech_models: ['universal-3-pro'],
  })

  if (transcript.status === 'error') {
    throw new Error(transcript.error || 'Transcription failed')
  }

  if (!transcript.words || transcript.words.length === 0) {
    throw new Error('No words found in transcription')
  }

  const words = transcript.words.map((word) => ({
    text: word.text,
    start: word.start,
    end: word.end,
    confidence: word.confidence,
  }))

  return groupWordsIntoSegments(words)
}

export async function transcribeFromUrl(youtubeUrl: string): Promise<TranscriptionSegment[]> {
  const audioBuffer = await downloadYouTubeAudio(youtubeUrl)
  return transcribeAudioBuffer(audioBuffer)
}

export async function transcribeFromStorage(videoBuffer: Buffer): Promise<TranscriptionSegment[]> {
  const audioBuffer = await extractAudioFromVideo(videoBuffer)
  return transcribeAudioBuffer(audioBuffer)
}
