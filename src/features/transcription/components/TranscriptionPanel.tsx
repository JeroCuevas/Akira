'use client'

import { TranscriptionSegment } from '@/shared/types/database'
import { TranscriptionSegmentItem } from './TranscriptionSegmentItem'

interface Props {
  segments: TranscriptionSegment[]
  onTimestampClick: (timestamp: number) => void
}

export function TranscriptionPanel({ segments, onTimestampClick }: Props) {
  return (
    <div className="border-2 border-black shadow-brutal bg-white max-h-[500px] overflow-y-auto">
      <div className="flex flex-col">
        {segments.map((segment, index) => (
          <TranscriptionSegmentItem
            key={index}
            segment={segment}
            onClick={() => onTimestampClick(segment.start)}
          />
        ))}
      </div>
    </div>
  )
}
