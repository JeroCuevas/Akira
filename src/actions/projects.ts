'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  video_url: z.string().url().refine(
    (url) => /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/.test(url),
    { message: 'Must be a valid YouTube URL' }
  ),
  title: z.string().min(1).max(200).optional(),
})

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const parsed = CreateProjectSchema.safeParse({
    video_url: formData.get('video_url'),
    title: formData.get('title') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const title = parsed.data.title || 'Untitled Project'

  const { data, error } = await supabase
    .from('video_projects')
    .insert({
      user_id: user.id,
      video_url: parsed.data.video_url,
      title,
      status: 'processing' as const,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { data }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Fetch project to get storage_path
  const { data: project } = await supabase
    .from('video_projects')
    .select('storage_path, video_source')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return { error: 'Proyecto no encontrado' }
  }

  // Delete rendered files from storage
  const { data: renders } = await supabase
    .from('renders')
    .select('output_path')
    .eq('project_id', projectId)

  if (renders && renders.length > 0) {
    const renderPaths = renders
      .map((r) => r.output_path)
      .filter((p): p is string => !!p)
    if (renderPaths.length > 0) {
      await supabase.storage.from('renders').remove(renderPaths)
    }
  }

  // Delete uploaded video from storage
  if (project.video_source === 'upload' && project.storage_path) {
    await supabase.storage.from('videos').remove([project.storage_path])
  }

  // Delete project (animations and renders cascade via FK)
  const { error } = await supabase
    .from('video_projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProjectStatus(projectId: string, status: 'processing' | 'ready' | 'error') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('video_projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}
