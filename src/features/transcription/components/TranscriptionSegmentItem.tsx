'use client'

import { TranscriptionSegment } from '@/shared/types/database'

interface Props {
  segment: TranscriptionSegment
  onClick: () => void
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function TranscriptionSegmentItem({ segment, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 border-2 border-black hover:bg-brutal-yellow/20 transition font-brutal group"
    >
      <div className="flex gap-3">
        <span className="font-bold bg-black text-white px-2 py-1 text-sm shrink-0 group-hover:bg-brutal-yellow group-hover:text-black transition">
          {formatTime(segment.start)}
        </span>
        <span className="text-sm">{segment.text}</span>
      </div>
    </button>
  )
}
