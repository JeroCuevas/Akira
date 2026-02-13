'use client'

import { useState } from 'react'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { AnimationPreviewPlayer } from '@/features/remotion/components'
import type { Animation } from '@/shared/types/database'

interface Props {
  animation: Animation
  onDelete?: (id: string) => void
  onRegenerate?: (id: string) => Promise<void>
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const animationStatusLabels = {
  pending: 'Pendiente',
  generating: 'Generando',
  ready: 'Lista',
  error: 'Error',
}

export function AnimationCard({ animation, onDelete, onRegenerate }: Props) {
  const [showPreview, setShowPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const statusVariant = animation.status === 'ready' ? 'ready' : animation.status

  async function handleDelete() {
    if (!onDelete) return
    setIsDeleting(true)
    onDelete(animation.id)
  }

  async function handleRegenerate() {
    if (!onRegenerate) return
    setIsRegenerating(true)
    setShowPreview(false)
    await onRegenerate(animation.id)
    setIsRegenerating(false)
  }

  return (
    <div className="border-2 border-black shadow-brutal bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-brutal font-bold text-sm">
          {formatTime(animation.timestamp_start)} - {formatTime(animation.timestamp_end)}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{animationStatusLabels[animation.status]}</Badge>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-7 h-7 flex items-center justify-center border-2 border-black bg-red-400 hover:bg-red-500 text-black font-bold text-sm transition-colors disabled:opacity-50"
              title="Eliminar animacion"
            >
              X
            </button>
          )}
        </div>
      </div>

      {animation.prompt_used && (
        <div>
          <p className="text-xs text-gray-600 mb-1">Descripcion:</p>
          <p className="text-sm line-clamp-3">{animation.prompt_used}</p>
        </div>
      )}

      {(animation.status === 'generating' || isRegenerating) && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">
            {isRegenerating ? 'Regenerando animacion...' : 'Generando animacion...'}
          </span>
        </div>
      )}

      {animation.status === 'ready' && animation.remotion_code && !isRegenerating && (
        <>
          <div className="flex gap-2">
            <Button
              variant={showPreview ? 'danger' : 'primary'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Cerrar Vista Previa' : 'Vista Previa'}
            </Button>
            {onRegenerate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRegenerate}
              >
                Regenerar
              </Button>
            )}
          </div>

          {showPreview && (
            <div className="border-2 border-black">
              <AnimationPreviewPlayer
                remotionCode={animation.remotion_code}
                durationInFrames={Math.round(
                  (animation.timestamp_end - animation.timestamp_start) * 30
                )}
              />
            </div>
          )}
        </>
      )}

      {animation.status === 'error' && !isRegenerating && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-red-600">Error al generar la animacion</p>
          {onRegenerate && (
            <Button variant="secondary" size="sm" onClick={handleRegenerate}>
              Reintentar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
