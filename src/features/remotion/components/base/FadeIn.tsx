import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

interface FadeInProps {
  children: React.ReactNode
  durationInFrames?: number
}

export const FadeIn: React.FC<FadeInProps> = ({ children, durationInFrames = 30 }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
}
