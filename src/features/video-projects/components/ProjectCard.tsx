'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/shared/components'
import { extractVideoId, getThumbnailUrl } from '../services/youtubeUtils'
import { getVideoPlaybackUrl } from '@/actions/upload'
import { deleteProject } from '@/actions/projects'
import type { VideoProject } from '../types'

interface ProjectCardProps {
  project: VideoProject
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

function UploadThumbnail({ storagePath }: { storagePath: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    getVideoPlaybackUrl(storagePath).then((result) => {
      if (result.url) setUrl(result.url)
    })
  }, [storagePath])

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-brutal-black/5">
        <div className="text-center">
          <span className="text-3xl">🎬</span>
          <p className="text-xs font-brutal text-gray-500 mt-1">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <video
      src={url}
      preload="metadata"
      muted
      playsInline
      className="w-full h-full object-cover"
    />
  )
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const isUpload = project.video_source === 'upload'
  const videoId = !isUpload ? extractVideoId(project.video_url) : null
  const thumbnail = videoId ? getThumbnailUrl(videoId) : null

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Eliminar "${project.title}"? Se borrara el video, animaciones y renders. Esta accion no se puede deshacer.`)) {
      return
    }

    setIsDeleting(true)
    const result = await deleteProject(project.id)
    if (result.error) {
      alert(result.error)
      setIsDeleting(false)
    } else {
      router.refresh()
    }
  }

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className={`relative border-2 border-black shadow-brutal bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-black shadow-brutal text-sm font-bold hover:bg-red-400 hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          title="Eliminar proyecto"
        >
          X
        </button>
        <div className="aspect-video bg-gray-200 border-b-2 border-black overflow-hidden">
          {isUpload && project.storage_path ? (
            <UploadThumbnail storagePath={project.storage_path} />
          ) : thumbnail ? (
            <img src={thumbnail} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brutal-black/5">
              <div className="text-center">
                <span className="text-3xl">🎥</span>
                <p className="text-xs font-brutal text-gray-500 mt-1">Sin miniatura</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-bold font-brutal text-lg truncate">{project.title}</h3>
          <div className="flex items-center justify-between">
            <Badge variant={statusVariant[project.status]}>{statusLabels[project.status]}</Badge>
            <span className="text-xs font-brutal text-gray-500">
              {new Date(project.created_at).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
