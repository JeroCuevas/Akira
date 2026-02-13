'use client'

import type { RenderStatus } from '@/shared/types/database'

interface RenderProgressProps {
  status: RenderStatus
  progress: number
  errorMessage?: string | null
  onCancel?: () => void
}

const statusLabels: Record<RenderStatus, string> = {
  pending: 'Preparando...',
  rendering_clips: 'Renderizando clips de animación...',
  composing: 'Componiendo video final...',
  completed: 'Render completado',
  error: 'Render fallido',
}

export function RenderProgress({ status, progress, errorMessage, onCancel }: RenderProgressProps) {
  const isError = status === 'error'
  const isComplete = status === 'completed'
  const isActive = !isError && !isComplete

  return (
    <div className="border-2 border-black bg-white p-4 shadow-brutal space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-brutal font-bold text-sm">
          {statusLabels[status]}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-brutal text-sm text-gray-600">{progress}%</span>
          {isActive && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-xs font-brutal font-bold bg-red-500 text-white border-2 border-black hover:bg-red-600"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-200 border-2 border-black h-5">
        <div
          className={`h-full transition-all duration-500 ${
            isError
              ? 'bg-red-500'
              : isComplete
                ? 'bg-green-500'
                : 'bg-brutal-yellow'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isError && errorMessage && (
        <p className="text-sm text-red-600 font-brutal">{errorMessage}</p>
      )}
    </div>
  )
}
