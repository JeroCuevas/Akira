import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion'

interface HighlightBoxProps {
  text: string
  bgColor?: string
  textColor?: string
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  text,
  bgColor = '#FFE500',
  textColor = '#000000',
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } })
  const width = spring({ frame: frame - 5, fps, config: { damping: 15 } })

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          transform: `scale(${scale})`,
          backgroundColor: bgColor,
          color: textColor,
          padding: '20px 40px',
          border: '4px solid #000',
          boxShadow: '6px 6px 0px 0px #000',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 'bold',
          fontSize: 48,
          maxWidth: `${width * 80}%`,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  )
}
