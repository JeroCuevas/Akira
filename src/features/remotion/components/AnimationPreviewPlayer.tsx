'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { evaluateRemotionCode } from '../lib/codeEvaluator'
import { Alert } from '@/shared/components'

const Player = dynamic(
  () => import('@remotion/player').then((mod) => ({ default: mod.Player })),
  { ssr: false }
)

interface AnimationPreviewPlayerProps {
  remotionCode: string
  durationInFrames: number
}

export function AnimationPreviewPlayer({ remotionCode, durationInFrames }: AnimationPreviewPlayerProps) {
  const { component: Component, error } = useMemo(() => {
    return evaluateRemotionCode(remotionCode)
  }, [remotionCode])

  if (!Component) {
    return (
      <Alert variant="error">
        Error al renderizar la animacion.{error ? ` ${error}` : ''}
      </Alert>
    )
  }

  return (
    <div className="border-2 border-black shadow-brutal" style={{ backgroundImage: 'repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%)', backgroundSize: '20px 20px' }}>
      <Player
        component={Component}
        durationInFrames={Math.max(durationInFrames, 30)}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{ width: '100%' }}
        controls
      />
    </div>
  )
}
