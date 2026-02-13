import React from 'react'
import { registerRoot, Composition } from 'remotion'
import { DynamicAnimation } from './DynamicAnimation'

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DynamicAnimation"
      component={DynamicAnimation}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ code: '' }}
    />
  )
}

registerRoot(RemotionRoot)
