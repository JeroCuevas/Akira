import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

interface TextRevealProps {
  text: string
  fontSize?: number
  color?: string
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  fontSize = 60,
  color = '#000000',
}) => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {text.split('').map((char, i) => {
          const opacity = interpolate(frame, [i * 2, i * 2 + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          return (
            <span key={i} style={{ opacity, fontSize, fontWeight: 'bold', color, fontFamily: 'Space Grotesk, sans-serif' }}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
