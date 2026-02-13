export type ProjectStatus = 'processing' | 'ready' | 'error'
export type AnimationStatus = 'pending' | 'generating' | 'ready' | 'error'
export type VideoSource = 'youtube' | 'upload'
export type RenderStatus = 'pending' | 'rendering_clips' | 'composing' | 'completed' | 'error'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface TranscriptionSegment {
  text: string
  start: number
  end: number
  confidence: number
}

export interface VideoProject {
  id: string
  user_id: string
  video_url: string
  title: string
  transcription: TranscriptionSegment[] | null
  status: ProjectStatus
  video_source: VideoSource
  storage_path: string | null
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

export interface Animation {
  id: string
  project_id: string
  timestamp_start: number
  timestamp_end: number
  remotion_code: string | null
  asset_url: string | null
  status: AnimationStatus
  prompt_used: string | null
  animation_suggestion: string | null
  created_at: string
}

export interface Render {
  id: string
  project_id: string
  status: RenderStatus
  output_path: string | null
  error_message: string | null
  progress: number
  created_at: string
  updated_at: string
}
