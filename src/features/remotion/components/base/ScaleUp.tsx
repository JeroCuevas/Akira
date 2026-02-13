import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion'

interface ScaleUpProps {
  children: React.ReactNode
}

export const ScaleUp: React.FC<ScaleUpProps> = ({ children }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } })

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </AbsoluteFill>
  )
}
