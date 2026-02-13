import { AnimationCard } from './AnimationCard'
import type { Animation } from '@/shared/types/database'

interface Props {
  animations: Animation[]
  onDelete?: (id: string) => void
  onRegenerate?: (id: string) => Promise<void>
}

export function AnimationList({ animations, onDelete, onRegenerate }: Props) {
  if (animations.length === 0) {
    return (
      <div className="border-2 border-black shadow-brutal bg-white p-8 text-center">
        <p className="text-gray-600 font-brutal">No hay animaciones creadas todavia</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {animations.map((animation) => (
        <AnimationCard
          key={animation.id}
          animation={animation}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
        />
      ))}
    </div>
  )
}
