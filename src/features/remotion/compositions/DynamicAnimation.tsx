import React from 'react'
import { AbsoluteFill } from 'remotion'
import { evaluateRemotionCode } from '../lib/codeEvaluator'

export const DynamicAnimation: React.FC<{ code?: string }> = ({ code = '' }) => {
  if (!code) {
    return <AbsoluteFill style={{ backgroundColor: 'transparent' }} />
  }

  const { component: Component } = evaluateRemotionCode(code)

  if (!Component) {
    return <AbsoluteFill style={{ backgroundColor: 'transparent' }} />
  }

  return <Component />
}
