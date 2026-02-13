'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, Input, Button, Alert } from '@/shared/components'
import { createProject } from '@/actions/projects'
import { getSignedUploadUrl, createUploadProject } from '@/actions/upload'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '../store/projectStore'

type Tab = 'youtube' | 'upload'

export function CreateProjectModal() {
  const router = useRouter()
  const { isCreateModalOpen, closeCreateModal } = useProjectStore()
  const [tab, setTab] = useState<Tab>('upload')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  async function handleYoutubeSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await createProject(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    closeCreateModal()
    if (result?.data) {
      router.push(`/dashboard/projects/${result.data.id}`)
    }
  }

  async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo de video')
      return
    }

    setLoading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData(e.currentTarget)
      const title = (formData.get('title') as string) || selectedFile.name.replace(/\.[^.]+$/, '')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No autenticado')
        setLoading(false)
        return
      }

      const signResult = await getSignedUploadUrl(user.id, selectedFile.name)
      if (signResult.error || !signResult.signedUrl || !signResult.storagePath) {
        setError(signResult.error || 'Error al obtener URL de subida')
        setLoading(false)
        return
      }

      // Upload with XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })
        xhr.addEventListener('error', () => reject(new Error('Error al subir')))
        xhr.open('PUT', signResult.signedUrl!)
        xhr.setRequestHeader('Content-Type', selectedFile.type)
        xhr.send(selectedFile)
      })

      const projectResult = await createUploadProject(title, signResult.storagePath!, videoDuration)
      if (projectResult.error) {
        setError(projectResult.error)
        setLoading(false)
        return
      }

      setLoading(false)
      setSelectedFile(null)
      setUploadProgress(0)
      closeCreateModal()
      if (projectResult.data) {
        router.push(`/dashboard/projects/${projectResult.data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
      setLoading(false)
    }
  }

  function handleFileSelect(file: File) {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      setError('Formato no soportado. Usa MP4, WebM, MOV o AVI.')
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('Archivo muy grande. El tamaño máximo es 500MB.')
      return
    }
    setError(null)
    setSelectedFile(file)

    // Extract duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  return (
    <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Nuevo Proyecto">
      {/* Tabs */}
      <div className="flex border-2 border-black mb-4">
        <button
          type="button"
          className={`flex-1 py-2 font-brutal font-bold text-sm transition-colors ${
            tab === 'upload'
              ? 'bg-brutal-yellow text-black'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => { setTab('upload'); setError(null) }}
        >
          Subir Video
        </button>
        <button
          type="button"
          className={`flex-1 py-2 font-brutal font-bold text-sm border-l-2 border-black transition-colors ${
            tab === 'youtube'
              ? 'bg-brutal-yellow text-black'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => { setTab('youtube'); setError(null) }}
        >
          URL de YouTube
        </button>
      </div>

      {tab === 'youtube' ? (
        <form action={handleYoutubeSubmit} className="space-y-4">
          <Input
            label="URL de YouTube"
            name="video_url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
          <Input
            label="Título del Proyecto"
            name="title"
            type="text"
            placeholder="Mi video increíble"
          />
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </Button>
            <Button variant="secondary" onClick={closeCreateModal} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-brutal-yellow bg-brutal-yellow/10'
                : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-black bg-white hover:bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-brutal font-bold text-green-700">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  {videoDuration > 0 && ` · ${Math.floor(videoDuration / 60)}:${String(Math.floor(videoDuration % 60)).padStart(2, '0')}`}
                </p>
                <p className="text-xs text-gray-400">Haz clic para cambiar</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-brutal font-bold">Arrastra tu video aquí</p>
                <p className="text-sm text-gray-500">o haz clic para explorar · MP4, WebM, MOV · Máx 500MB</p>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {loading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-brutal">
                <span>Subiendo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 border-2 border-black h-4">
                <div
                  className="bg-brutal-yellow h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Input
            label="Título del Proyecto"
            name="title"
            type="text"
            placeholder={selectedFile?.name.replace(/\.[^.]+$/, '') || 'Mi video increíble'}
          />

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !selectedFile} className="flex-1">
              {loading ? (uploadProgress < 100 ? 'Subiendo...' : 'Creando...') : 'Subir y Crear'}
            </Button>
            <Button variant="secondary" onClick={closeCreateModal} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
