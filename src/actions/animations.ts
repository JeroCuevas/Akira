'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateAnimationCode } from './ai'
import type { VisualStyle } from './ai'

interface KeypointInput {
  timestamp_start: number
  timestamp_end: number
  description: string
  animation_suggestion?: string
}

export async function generateAndStoreAnimation(projectId: string, keypoint: KeypointInput, visualStyle?: VisualStyle) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autorizado' }
    }

    const { data: animation, error: insertError } = await supabase
      .from('animations')
      .insert({
        project_id: projectId,
        timestamp_start: keypoint.timestamp_start,
        timestamp_end: keypoint.timestamp_end,
        status: 'generating',
        prompt_used: keypoint.description,
        animation_suggestion: keypoint.animation_suggestion || null,
      })
      .select()
      .single()

    if (insertError || !animation) {
      return { error: insertError?.message || 'Error al crear animacion' }
    }

    const { data: project } = await supabase
      .from('video_projects')
      .select('transcription')
      .eq('id', projectId)
      .single()

    // Filter transcription to only segments within the keypoint window + 5s buffer
    // and convert ms timestamps to seconds
    const segments = (project?.transcription || []) as { start: number; end: number; text: string }[]
    const bufferMs = 5000
    const startMs = keypoint.timestamp_start * 1000 - bufferMs
    const endMs = keypoint.timestamp_end * 1000 + bufferMs

    const relevantSegments = segments.filter(
      (seg) => seg.end >= startMs && seg.start <= endMs
    )

    const transcriptionContext = relevantSegments
      .map((seg) => `[${(seg.start / 1000).toFixed(1)}s - ${(seg.end / 1000).toFixed(1)}s]: ${seg.text}`)
      .join('\n')

    const generatedCode = await generateAnimationCode(keypoint, transcriptionContext, visualStyle)

    const { error: updateError } = await supabase
      .from('animations')
      .update({
        remotion_code: generatedCode.code,
        status: 'ready',
      })
      .eq('id', animation.id)

    if (updateError) {
      await supabase.from('animations').update({ status: 'error' }).eq('id', animation.id)
      return { error: updateError.message }
    }

    revalidatePath(`/dashboard/projects/${projectId}`)

    return { data: animation }
  } catch (error) {
    console.error('Error generating animation:', error)
    return { error: 'Error interno al generar animacion' }
  }
}

export async function regenerateAnimation(animationId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autorizado' }
    }

    // Get existing animation data
    const { data: animation, error: fetchError } = await supabase
      .from('animations')
      .select('*, video_projects!inner(transcription)')
      .eq('id', animationId)
      .single()

    if (fetchError || !animation) {
      return { error: 'Animacion no encontrada' }
    }

    // Set status to generating
    await supabase
      .from('animations')
      .update({ status: 'generating', remotion_code: null })
      .eq('id', animationId)

    // Build transcription context (same logic as generateAndStoreAnimation)
    const project = animation.video_projects as { transcription: { start: number; end: number; text: string }[] | null }
    const segments = (project?.transcription || [])
    const bufferMs = 5000
    const startMs = animation.timestamp_start * 1000 - bufferMs
    const endMs = animation.timestamp_end * 1000 + bufferMs

    const relevantSegments = segments.filter(
      (seg: { start: number; end: number }) => seg.end >= startMs && seg.start <= endMs
    )

    const transcriptionContext = relevantSegments
      .map((seg: { start: number; end: number; text: string }) => `[${(seg.start / 1000).toFixed(1)}s - ${(seg.end / 1000).toFixed(1)}s]: ${seg.text}`)
      .join('\n')

    const keypoint = {
      timestamp_start: animation.timestamp_start,
      timestamp_end: animation.timestamp_end,
      description: animation.prompt_used || '',
      animation_suggestion: animation.animation_suggestion || undefined,
    }

    const generatedCode = await generateAnimationCode(keypoint, transcriptionContext)

    const { error: updateError } = await supabase
      .from('animations')
      .update({
        remotion_code: generatedCode.code,
        status: 'ready',
      })
      .eq('id', animationId)

    if (updateError) {
      await supabase.from('animations').update({ status: 'error' }).eq('id', animationId)
      return { error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error regenerating animation:', error)
    // Try to reset status on failure
    const supabase = await createClient()
    await supabase.from('animations').update({ status: 'error' }).eq('id', animationId)
    return { error: 'Error al regenerar animacion' }
  }
}

export async function deleteAnimation(animationId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autorizado' }
    }

    const { error } = await supabase.from('animations').delete().eq('id', animationId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error deleting animation:', error)
    return { error: 'Error al eliminar animacion' }
  }
}
