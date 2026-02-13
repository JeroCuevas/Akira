'use client'

import { getEmbedUrl } from '../services/youtubeUtils'
import { VideoPlayer } from './VideoPlayer'

interface VideoEmbedProps {
  videoId?: string | null
  videoSource?: 'youtube' | 'upload'
  storagePath?: string | null
  className?: string
}

export function VideoEmbed({ videoId, videoSource = 'youtube', storagePath, className = '' }: VideoEmbedProps) {
  if (videoSource === 'upload' && storagePath) {
    return <VideoPlayer storagePath={storagePath} className={className} />
  }

  if (!videoId) {
    return (
      <div className={`relative w-full aspect-video border-2 border-black shadow-brutal bg-gray-100 flex items-center justify-center ${className}`}>
        <p className="font-brutal text-gray-500">No hay video disponible</p>
      </div>
    )
  }

  const embedUrl = getEmbedUrl(videoId)

  return (
    <div className={`relative w-full aspect-video border-2 border-black shadow-brutal bg-black ${className}`}>
      <iframe
        src={`${embedUrl}?enablejsapi=1`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video player"
      />
    </div>
  )
}
