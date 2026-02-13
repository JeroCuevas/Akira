'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRenderStatus, getProjectRenders } from '@/actions/render'
import type { Render } from '@/shared/types/database'

export function useRender(projectId: string) {
  const [currentRender, setCurrentRender] = useState<Render | null>(null)
  const [renders, setRenders] = useState<Render[]>([])
  const [isPolling, setIsPolling] = useState(false)

  const loadRenders = useCallback(async () => {
    const result = await getProjectRenders(projectId)
    if (result.renders) {
      setRenders(result.renders as Render[])
      // Find active render
      const active = result.renders.find(
        (r: Render) => r.status !== 'completed' && r.status !== 'error'
      ) as Render | undefined
      if (active) {
        setCurrentRender(active)
        setIsPolling(true)
      }
    }
  }, [projectId])

  useEffect(() => {
    loadRenders()
  }, [loadRenders])

  // Poll for active render status
  useEffect(() => {
    if (!isPolling || !currentRender) return

    const interval = setInterval(async () => {
      const result = await getRenderStatus(currentRender.id)
      if (result.render) {
        const render = result.render as Render
        setCurrentRender(render)

        if (render.status === 'completed' || render.status === 'error') {
          setIsPolling(false)
          loadRenders()
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isPolling, currentRender, loadRenders])

  function startPolling(renderId: string) {
    setCurrentRender({
      id: renderId,
      project_id: projectId,
      status: 'pending',
      progress: 0,
      output_path: null,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setIsPolling(true)
  }

  const latestCompletedRender = renders.find((r) => r.status === 'completed') || null
  const isRendering = isPolling && currentRender !== null && currentRender.status !== 'completed' && currentRender.status !== 'error'

  return {
    currentRender,
    renders,
    latestCompletedRender,
    isRendering,
    startPolling,
    loadRenders,
  }
}
