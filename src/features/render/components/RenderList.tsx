'use client'

import { useState } from 'react'
import { Button } from '@/shared/components'
import { getRenderDownloadUrl } from '@/actions/render'
import type { Render } from '@/shared/types/database'

interface Props {
  renders: Render[]
  onDelete: (renderId: string) => Promise<void>
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  rendering_clips: 'Renderizando',
  composing: 'Componiendo',
  completed: 'Completado',
  error: 'Error',
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  rendering_clips: 'bg-brutal-yellow text-black',
  composing: 'bg-brutal-yellow text-black',
  completed: 'bg-green-200 text-green-800',
  error: 'bg-red-200 text-red-800',
}

export function RenderList({ renders, onDelete }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDownload(renderId: string) {
    setDownloadingId(renderId)
    const result = await getRenderDownloadUrl(renderId)
    if (result.url) {
      window.open(result.url, '_blank')
    }
    setDownloadingId(null)
  }

  async function handleDelete(renderId: string) {
    setDeletingId(renderId)
    await onDelete(renderId)
    setDeletingId(null)
  }

  if (renders.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="font-brutal font-bold text-sm text-gray-600">
        Videos Generados ({renders.length})
      </h3>
      {renders.map((render) => (
        <div
          key={render.id}
          className="border-2 border-black bg-white p-4 shadow-brutal flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`px-2 py-1 text-xs font-brutal font-bold border border-black ${statusColors[render.status] || 'bg-gray-100'}`}
            >
              {statusLabels[render.status] || render.status}
            </span>
            <span className="text-sm font-brutal text-gray-500 truncate">
              {new Date(render.created_at).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {render.status === 'completed' && (
              <Button
                onClick={() => handleDownload(render.id)}
                disabled={downloadingId === render.id}
                variant="secondary"
              >
                {downloadingId === render.id ? 'Descargando...' : 'Descargar'}
              </Button>
            )}
            {render.status === 'error' && render.error_message && (
              <span className="text-xs text-red-600 font-brutal max-w-[200px] truncate" title={render.error_message}>
                {render.error_message}
              </span>
            )}
            <button
              onClick={() => handleDelete(render.id)}
              disabled={deletingId === render.id}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white border-2 border-black font-bold text-sm hover:bg-red-600 disabled:opacity-50"
              title="Eliminar render"
            >
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
