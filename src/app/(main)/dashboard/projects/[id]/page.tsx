import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { extractVideoId } from '@/features/video-projects/services/youtubeUtils'
import { ProjectDetailClient } from './ProjectDetailClient'
import type { VideoProject, Animation } from '@/shared/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('video_projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) {
    notFound()
  }

  const { data: animations } = await supabase
    .from('animations')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const typedProject = project as VideoProject
  const videoId = typedProject.video_source === 'youtube'
    ? extractVideoId(typedProject.video_url)
    : null

  return (
    <ProjectDetailClient
      project={typedProject}
      videoId={videoId}
      animations={(animations as Animation[]) || []}
    />
  )
}
