import { createClient } from '@/lib/supabase/server'
import { ProjectGrid } from '@/features/video-projects/components'
import { DashboardHeader } from './DashboardHeader'
import type { VideoProject } from '@/shared/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('video_projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 pt-4">
      <DashboardHeader />
      <ProjectGrid projects={(projects as VideoProject[]) || []} />
    </div>
  )
}
