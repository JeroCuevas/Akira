'use server'

import { createClient } from '@/lib/supabase/server'
import { transcribeFromUrl, transcribeFromStorage } from '@/features/transcription/services/assemblyaiService'
import { revalidatePath } from 'next/cache'

export async function startTranscription(projectId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'No autorizado' }
    }

    const { data: project, error: projectError } = await supabase
      .from('video_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return { error: 'Proyecto no encontrado' }
    }

    let segments

    if (project.video_source === 'upload' && project.storage_path) {
      // Download video from Supabase Storage, extract audio, transcribe
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('videos')
        .download(project.storage_path)

      if (downloadError || !fileData) {
        return { error: `Error al descargar video: ${downloadError?.message || 'Error desconocido'}` }
      }

      const videoBuffer = Buffer.from(await fileData.arrayBuffer())
      segments = await transcribeFromStorage(videoBuffer)
    } else {
      // YouTube URL flow
      segments = await transcribeFromUrl(project.video_url)
    }

    const { error: updateError } = await supabase
      .from('video_projects')
      .update({
        transcription: segments,
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/dashboard/projects/${projectId}`)

    return { success: true }
  } catch (error) {
    console.error('Transcription error:', error)
    return { error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
