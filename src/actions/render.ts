'use server'

import { createClient } from '@/lib/supabase/server'
import { readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { renderAnimationClip, createRemotionBundle, createTempDir } from '@/features/remotion/lib/renderService'
import { composeVideoWithOverlays, cleanupTempDir } from '@/features/render/services/compositionService'
import type { Animation } from '@/shared/types/database'

async function updateRenderStatus(
  renderId: string,
  status: string,
  progress: number,
  errorMessage?: string
) {
  const supabase = await createClient()
  await supabase
    .from('renders')
    .update({
      status,
      progress,
      error_message: errorMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', renderId)
}

async function isRenderCancelled(renderId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('renders')
    .select('status')
    .eq('id', renderId)
    .single()
  return data?.status === 'error'
}

export async function startRender(projectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Get project
  const { data: project } = await supabase
    .from('video_projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) return { error: 'Proyecto no encontrado' }

  if (project.video_source !== 'upload' || !project.storage_path) {
    return { error: 'El renderizado de video solo está disponible para videos subidos' }
  }

  // Get ready animations
  const { data: animations } = await supabase
    .from('animations')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'ready')
    .order('timestamp_start', { ascending: true })

  if (!animations || animations.length === 0) {
    return { error: 'No hay animaciones listas para renderizar' }
  }

  // Create render record
  const { data: render, error: renderError } = await supabase
    .from('renders')
    .insert({
      project_id: projectId,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single()

  if (renderError || !render) {
    return { error: renderError?.message || 'Error al crear render' }
  }

  // Run the render pipeline asynchronously
  renderPipeline(render.id, project, animations as Animation[], user.id).catch(
    async (err) => {
      console.error('Render pipeline error:', err)
      await updateRenderStatus(render.id, 'error', 0, err.message)
    }
  )

  return { renderId: render.id }
}

async function renderPipeline(
  renderId: string,
  project: { storage_path: string; id: string },
  animations: Animation[],
  userId: string
) {
  const supabase = await createClient()
  const tempDir = await createTempDir()

  try {
    // Phase 1: Download original video
    await updateRenderStatus(renderId, 'rendering_clips', 5)

    const { data: videoData, error: downloadError } = await supabase.storage
      .from('videos')
      .download(project.storage_path!)

    if (downloadError || !videoData) {
      throw new Error(`Error al descargar video: ${downloadError?.message}`)
    }

    const originalVideoPath = join(tempDir, 'original.mp4')
    await writeFile(originalVideoPath, Buffer.from(await videoData.arrayBuffer()))

    // Phase 2: Bundle Remotion once for all clips
    if (await isRenderCancelled(renderId)) throw new Error('Cancelado por el usuario')
    await updateRenderStatus(renderId, 'rendering_clips', 10)
    console.log('[Render] Creating Remotion bundle...')
    const bundleLocation = await createRemotionBundle()
    console.log('[Render] Bundle ready, rendering clips...')

    // Phase 3: Render animation clips
    const totalClips = animations.length
    const clips: Array<{ clipPath: string; timestampStart: number; timestampEnd: number }> = []

    for (let i = 0; i < animations.length; i++) {
      if (await isRenderCancelled(renderId)) throw new Error('Cancelado por el usuario')

      const animation = animations[i]
      if (!animation.remotion_code) continue

      // Timestamps are already in seconds (from AI keypoint suggestions)
      const durationSeconds = animation.timestamp_end - animation.timestamp_start
      const durationInFrames = Math.max(Math.round(durationSeconds * 30), 30)
      const progressPercent = 15 + Math.round((i / totalClips) * 55)

      await updateRenderStatus(renderId, 'rendering_clips', progressPercent)

      try {
        const clip = await renderAnimationClip({
          code: animation.remotion_code,
          durationInFrames,
          outputDir: tempDir,
          clipIndex: i,
          bundleLocation,
        })

        clips.push({
          clipPath: clip.path,
          timestampStart: animation.timestamp_start,
          timestampEnd: animation.timestamp_end,
        })
        console.log(`[Render] Clip ${i} rendered successfully`)
      } catch (err) {
        console.error(`[Render] Failed to render clip ${i}:`, err)
        // Skip failed clips, continue with others
      }
    }

    if (clips.length === 0) {
      throw new Error('Todos los clips de animación fallaron al renderizar. Revisa los logs del servidor para más detalles.')
    }

    // Phase 4: Compose final video
    if (await isRenderCancelled(renderId)) throw new Error('Cancelado por el usuario')
    await updateRenderStatus(renderId, 'composing', 75)

    const finalVideoPath = await composeVideoWithOverlays({
      originalVideoPath,
      clips,
      outputDir: tempDir,
    })

    // Phase 4: Upload result to Supabase Storage
    await updateRenderStatus(renderId, 'composing', 90)

    const finalBuffer = await readFile(finalVideoPath)
    const outputStoragePath = `${userId}/${randomUUID()}.mp4`

    const { error: uploadError } = await supabase.storage
      .from('renders')
      .upload(outputStoragePath, finalBuffer, {
        contentType: 'video/mp4',
      })

    if (uploadError) {
      throw new Error(`Error al subir render: ${uploadError.message}`)
    }

    // Phase 5: Update render record
    await supabase
      .from('renders')
      .update({
        status: 'completed',
        progress: 100,
        output_path: outputStoragePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', renderId)

    // No revalidatePath here — this runs async outside the server action context.
    // The client polls render status via useRender hook.
  } finally {
    // Cleanup temp files
    await cleanupTempDir(tempDir)
  }
}

export async function getRenderStatus(renderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: render } = await supabase
    .from('renders')
    .select('*')
    .eq('id', renderId)
    .single()

  if (!render) return { error: 'Render no encontrado' }

  return { render }
}

export async function getProjectRenders(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: renders } = await supabase
    .from('renders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return { renders: renders || [] }
}

export async function cancelRender(renderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase
    .from('renders')
    .update({
      status: 'error',
      error_message: 'Cancelado por el usuario',
      updated_at: new Date().toISOString(),
    })
    .eq('id', renderId)

  return { success: true }
}

export async function deleteRender(renderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // RLS ensures only owner can read/delete
  const { data: render } = await supabase
    .from('renders')
    .select('*')
    .eq('id', renderId)
    .single()

  if (!render) return { error: 'Render no encontrado' }

  // Delete file from storage if exists
  if (render.output_path) {
    await supabase.storage.from('renders').remove([render.output_path])
  }

  // Delete DB record (RLS policy ensures ownership)
  const { error: deleteError } = await supabase
    .from('renders')
    .delete()
    .eq('id', renderId)

  if (deleteError) return { error: deleteError.message }

  return { success: true }
}

export async function getRenderDownloadUrl(renderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: render } = await supabase
    .from('renders')
    .select('*')
    .eq('id', renderId)
    .single()

  if (!render || !render.output_path) {
    return { error: 'Render no encontrado o incompleto' }
  }

  const { data, error } = await supabase.storage
    .from('renders')
    .createSignedUrl(render.output_path, 3600)

  if (error) return { error: error.message }

  return { url: data.signedUrl }
}
