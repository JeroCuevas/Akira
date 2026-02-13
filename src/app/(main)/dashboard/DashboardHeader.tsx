'use client'

import { Button } from '@/shared/components'
import { CreateProjectModal } from '@/features/video-projects/components'
import { useProjectStore } from '@/features/video-projects/store/projectStore'

export function DashboardHeader() {
  const { openCreateModal } = useProjectStore()

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-brutal">Proyectos</h1>
          <p className="mt-1 font-brutal text-gray-600">
            Tus proyectos de animación de video con IA
          </p>
        </div>
        <Button onClick={openCreateModal} size="lg">
          + Nuevo Proyecto
        </Button>
      </div>
      <CreateProjectModal />
    </>
  )
}
