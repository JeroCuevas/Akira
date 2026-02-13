'use client'

import { useEffect, useState } from 'react'
import { getVideoPlaybackUrl } from '@/actions/upload'

interface VideoPlayerProps {
  storagePath: string
  className?: string
}

export function VideoPlayer({ storagePath, className = '' }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUrl() {
      const result = await getVideoPlaybackUrl(storagePath)
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setVideoUrl(result.url)
      }
    }
    loadUrl()
  }, [storagePath])

  if (error) {
    return (
      <div className={`relative w-full aspect-video border-2 border-black shadow-brutal bg-gray-100 flex items-center justify-center ${className}`}>
        <p className="font-brutal text-red-500">Error al cargar el video</p>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className={`relative w-full aspect-video border-2 border-black shadow-brutal bg-gray-100 flex items-center justify-center ${className}`}>
        <p className="font-brutal text-gray-500">Cargando video...</p>
      </div>
    )
  }

  return (
    <div className={`relative w-full aspect-video border-2 border-black shadow-brutal bg-black ${className}`}>
      <video
        src={videoUrl}
        className="absolute inset-0 w-full h-full"
        controls
        playsInline
      />
    </div>
  )
}
