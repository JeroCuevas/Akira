'use client'

import { Button } from '@/shared/components'

interface RenderButtonProps {
  onClick: () => void
  disabled: boolean
  isRendering: boolean
}

export function RenderButton({ onClick, disabled, isRendering }: RenderButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 text-lg"
    >
      {isRendering ? 'Renderizando...' : 'Generar Video Final'}
    </Button>
  )
}
