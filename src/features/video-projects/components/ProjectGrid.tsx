import { ProjectCard } from './ProjectCard'
import type { VideoProject } from '../types'

interface ProjectGridProps {
  projects: VideoProject[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="border-2 border-dashed border-black p-12 text-center bg-white">
        <h3 className="text-xl font-bold font-brutal mb-2">Aún no hay proyectos</h3>
        <p className="font-brutal text-gray-600">
          Crea tu primer proyecto para empezar a generar animaciones con IA.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
