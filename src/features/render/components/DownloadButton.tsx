'use client'

import { useState } from 'react'
import { Button } from '@/shared/components'
import { getRenderDownloadUrl } from '@/actions/render'

interface DownloadButtonProps {
  renderId: string
}

export function DownloadButton({ renderId }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    const result = await getRenderDownloadUrl(renderId)
    if (result.url) {
      window.open(result.url, '_blank')
    }
    setLoading(false)
  }

  return (
    <Button onClick={handleDownload} disabled={loading} className="w-full py-4 text-lg">
      {loading ? 'Preparando descarga...' : 'Descargar Video Final'}
    </Button>
  )
}
