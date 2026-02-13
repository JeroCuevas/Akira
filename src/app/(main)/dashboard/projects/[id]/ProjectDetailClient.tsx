'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Alert } from '@/shared/components'
import { VideoEmbed } from '@/features/video-projects/components'
import { TranscriptionPanel, TranscriptionLoading } from '@/features/transcription/components'
import { KeypointSuggestions, AnimationList } from '@/features/animations/components'
import { RenderButton, RenderProgress, RenderList } from '@/features/render/components'
import { useRender } from '@/features/render/hooks/useRender'
import { startTranscription } from '@/actions/transcription'
import { suggestKeypoints } from '@/actions/ai'
import type { VisualStyle } from '@/actions/ai'
import { generateAndStoreAnimation, deleteAnimation, regenerateAnimation } from '@/actions/animations'
import { startRender, deleteRender, cancelRender } from '@/actions/render'
import type { VideoProject, Animation, TranscriptionSegment } from '@/shared/types/database'

interface Keypoint {
  timestamp_start: number
  timestamp_end: number
  description: string
  animation_suggestion: string
  importance: 'high' | 'medium' | 'low'
}

interface Props {
  project: VideoProject
  videoId: string | null
  animations: Animation[]
}

const statusVariant = {
  processing: 'processing' as const,
  ready: 'ready' as const,
  error: 'error' as const,
}

const statusLabels = {
  processing: 'Procesando',
  ready: 'Listo',
  error: 'Error',
}

export function ProjectDetailClient({ project, videoId, animations }: Props) {
  const router = useRouter()
  const [isPending, startTransitionFn] = useTransition()
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])
  const [visualStyle, setVisualStyle] = useState<VisualStyle | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { currentRender, renders, isRendering, startPolling, loadRenders } = useRender(project.id)
  const autoTranscribeTriggered = useRef(false)

  // Auto-start transcription for uploaded videos that don't have one yet
  useEffect(() => {
    if (
      project.video_source === 'upload' &&
      !project.transcription &&
      !autoTranscribeTriggered.current
    ) {
      autoTranscribeTriggered.current = true
      handleTranscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const readyAnimations = animations.filter((a) => a.status === 'ready' && a.remotion_code)
  const canRender = project.video_source === 'upload' && readyAnimations.length > 0 && !isRendering

  async function handleTranscribe() {
    setIsTranscribing(true)
    setError(null)
    const result = await startTranscription(project.id)
    if (result?.error) {
      setError(result.error)
    }
    setIsTranscribing(false)
    startTransitionFn(() => router.refresh())
  }

  async function handleSuggestKeypoints() {
    if (!project.transcription) return
    setIsSuggesting(true)
    setError(null)
    try {
      const segments = project.transcription as TranscriptionSegment[]
      const lastSegment = segments[segments.length - 1]
      const duration = lastSegment ? lastSegment.end / 1000 : 600
      const result = await suggestKeypoints(segments, duration)
      setKeypoints(result.keypoints)
      setVisualStyle(result.visual_style)
    } catch {
      setError('Error al sugerir momentos clave. Por favor, inténtalo de nuevo.')
    }
    setIsSuggesting(false)
  }

  async function handleAcceptKeypoint(keypoint: Keypoint) {
    setIsGenerating(true)
    setError(null)
    try {
      const result = await generateAndStoreAnimation(project.id, {
        timestamp_start: keypoint.timestamp_start,
        timestamp_end: keypoint.timestamp_end,
        description: keypoint.description,
        animation_suggestion: keypoint.animation_suggestion,
      }, visualStyle || undefined)
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError('Error al generar la animacion. Por favor, intentalo de nuevo.')
    } finally {
      setIsGenerating(false)
      setKeypoints((prev) => prev.filter((k) => k !== keypoint))
      router.refresh()
    }
  }

  function handleUpdateKeypoint(index: number, updated: Keypoint) {
    setKeypoints((prev) => prev.map((k, i) => (i === index ? updated : k)))
  }

  function handleRejectKeypoint(index: number) {
    setKeypoints((prev) => prev.filter((_, i) => i !== index))
  }

  function handleTimestampClick(_timestamp: number) {
    // Future: sync with video player
  }

  async function handleDeleteAnimation(animationId: string) {
    const result = await deleteAnimation(animationId)
    if (result?.error) {
      setError(result.error)
    }
    startTransitionFn(() => router.refresh())
  }

  async function handleRegenerateAnimation(animationId: string) {
    setError(null)
    const result = await regenerateAnimation(animationId)
    if (result?.error) {
      setError(result.error)
    }
    startTransitionFn(() => router.refresh())
  }

  async function handleDeleteRender(renderId: string) {
    setError(null)
    const result = await deleteRender(renderId)
    if (result.error) {
      setError(result.error)
    }
    await loadRenders()
  }

  async function handleCancelRender() {
    if (!currentRender) return
    await cancelRender(currentRender.id)
    await loadRenders()
  }

  async function handleStartRender() {
    setError(null)
    const result = await startRender(project.id)
    if (result.error) {
      setError(result.error)
    } else if (result.renderId) {
      startPolling(result.renderId)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white font-brutal font-bold text-sm shadow-brutal hover:bg-gray-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
      >
        &larr; Volver al Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-brutal">{project.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={statusVariant[project.status]}>{statusLabels[project.status]}</Badge>
            {project.video_source === 'upload' && (
              <Badge variant="info">Subido</Badge>
            )}
            <span className="text-sm font-brutal text-gray-500">
              Creado el {new Date(project.created_at).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-brutal border-b-2 border-black pb-2">Video</h2>
          <VideoEmbed
            videoId={videoId}
            videoSource={project.video_source}
            storagePath={project.storage_path}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-brutal border-b-2 border-black pb-2">Transcripción</h2>
          {isTranscribing ? (
            <TranscriptionLoading />
          ) : project.transcription ? (
            <TranscriptionPanel
              segments={project.transcription as TranscriptionSegment[]}
              onTimestampClick={handleTimestampClick}
            />
          ) : project.video_source === 'upload' ? (
            <div className="border-2 border-dashed border-black p-8 text-center bg-white space-y-4">
              <p className="font-brutal text-gray-500">Iniciando transcripción automática...</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-black p-8 text-center bg-white space-y-4">
              <p className="font-brutal text-gray-500">Aún no hay transcripción.</p>
              <Button onClick={handleTranscribe} disabled={isPending}>
                Transcribir Video
              </Button>
            </div>
          )}
        </div>
      </div>

      {project.transcription && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h2 className="text-xl font-bold font-brutal">Momentos Clave IA</h2>
            <Button
              onClick={handleSuggestKeypoints}
              disabled={isSuggesting}
              variant="secondary"
            >
              {isSuggesting ? 'Analizando...' : 'Sugerir Momentos Clave'}
            </Button>
          </div>

          {keypoints.length > 0 && (
            <KeypointSuggestions
              suggestions={keypoints}
              visualStyle={visualStyle}
              onStyleChange={setVisualStyle}
              onUpdate={handleUpdateKeypoint}
              onAccept={handleAcceptKeypoint}
              onReject={handleRejectKeypoint}
            />
          )}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-brutal border-b-2 border-black pb-2">
          Animaciones {animations.length > 0 && `(${animations.length})`}
        </h2>

        {isGenerating && (
          <Alert variant="info">Generando animación con IA... Esto puede tardar un momento.</Alert>
        )}

        {animations.length > 0 ? (
          <AnimationList
            animations={animations}
            onDelete={handleDeleteAnimation}
            onRegenerate={handleRegenerateAnimation}
          />
        ) : (
          <div className="border-2 border-dashed border-black p-8 text-center bg-white">
            <p className="font-brutal text-gray-500">
              {project.transcription
                ? 'Usa "Sugerir Momentos Clave" arriba para empezar a generar animaciones.'
                : 'Transcribe tu video primero para habilitar la generación de animaciones.'}
            </p>
          </div>
        )}
      </div>

      {/* Render Section - only for uploaded videos */}
      {project.video_source === 'upload' && readyAnimations.length > 0 && (
        <div className="space-y-4 border-t-4 border-black pt-6">
          <h2 className="text-xl font-bold font-brutal border-b-2 border-black pb-2">
            Video Final
          </h2>

          {currentRender && (currentRender.status !== 'completed' && currentRender.status !== 'error') && (
            <RenderProgress
              status={currentRender.status}
              progress={currentRender.progress}
              onCancel={handleCancelRender}
            />
          )}

          {currentRender?.status === 'error' && (
            <RenderProgress
              status="error"
              progress={currentRender.progress}
              errorMessage={currentRender.error_message}
            />
          )}

          {!isRendering && (
            <RenderButton
              onClick={handleStartRender}
              disabled={!canRender}
              isRendering={isRendering}
            />
          )}

          <RenderList
            renders={renders}
            onDelete={handleDeleteRender}
          />

        </div>
      )}
    </div>
  )
}
