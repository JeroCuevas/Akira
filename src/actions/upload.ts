'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createUploadProject(
  title: string,
  storagePath: string,
  durationSeconds: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!storagePath || !storagePath.startsWith(user.id)) {
    return { error: 'Ruta de almacenamiento inválida' }
  }

  const projectTitle = title || 'Untitled Project'

  const { data, error } = await supabase
    .from('video_projects')
    .insert({
      user_id: user.id,
      video_url: '',
      title: projectTitle,
      status: 'processing' as const,
      video_source: 'upload' as const,
      storage_path: storagePath,
      duration_seconds: durationSeconds,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { data }
}

export async function getSignedUploadUrl(userId: string, fileName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return { error: 'No autenticado' }
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4'
  const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase.storage
    .from('videos')
    .createSignedUploadUrl(storagePath)

  if (error) {
    return { error: error.message }
  }

  return { signedUrl: data.signedUrl, token: data.token, storagePath }
}

export async function getVideoPlaybackUrl(storagePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  if (!storagePath.startsWith(user.id)) {
    return { error: 'No autorizado' }
  }

  const { data, error } = await supabase.storage
    .from('videos')
    .createSignedUrl(storagePath, 3600)

  if (error) {
    return { error: error.message }
  }

  return { url: data.signedUrl }
}
