import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion'

interface SlideInProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'top' | 'bottom'
}

export const SlideIn: React.FC<SlideInProps> = ({ children, direction = 'left' }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = spring({ frame, fps, config: { damping: 15 } })

  const transforms = {
    left: `translateX(${(1 - progress) * -100}%)`,
    right: `translateX(${(1 - progress) * 100}%)`,
    top: `translateY(${(1 - progress) * -100}%)`,
    bottom: `translateY(${(1 - progress) * 100}%)`,
  }

  return (
    <AbsoluteFill style={{ transform: transforms[direction] }}>
      {children}
    </AbsoluteFill>
  )
}
