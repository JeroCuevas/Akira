'use client'

import { useState } from 'react'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import type { VisualStyle } from '@/actions/ai'

interface KeypointSuggestion {
  timestamp_start: number
  timestamp_end: number
  description: string
  animation_suggestion: string
  importance: 'high' | 'medium' | 'low'
}

interface Props {
  suggestions: KeypointSuggestion[]
  visualStyle?: VisualStyle | null
  onStyleChange?: (style: VisualStyle) => void
  onUpdate?: (index: number, keypoint: KeypointSuggestion) => void
  onAccept: (keypoint: KeypointSuggestion) => void
  onReject: (index: number) => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function parseTime(value: string): number {
  const parts = value.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseFloat(parts[1])
  }
  return parseFloat(value) || 0
}

const STYLE_FIELDS: { key: keyof VisualStyle; label: string; placeholder: string }[] = [
  { key: 'palette', label: 'Paleta de colores', placeholder: 'ej: cyan #00D4FF + negro #000 + blanco' },
  { key: 'layout_style', label: 'Layout', placeholder: 'ej: right-panel para listas, bottom-third para datos' },
  { key: 'animation_family', label: 'Animaciones', placeholder: 'ej: spring entrances con damping 12 + slide from right' },
  { key: 'typography_notes', label: 'Tipografia', placeholder: 'ej: titulos 48px bold, subtitulos 28px semibold' },
]

function VisualStyleEditor({ style, onChange }: { style: VisualStyle; onChange: (style: VisualStyle) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(style)

  function handleSave() {
    onChange(draft)
    setIsEditing(false)
  }

  function handleCancel() {
    setDraft(style)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-brutal font-bold text-sm">Estilo Visual del Proyecto</p>
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {STYLE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <span className="font-semibold text-gray-700">{label}: </span>
                <span className="text-gray-600">{style[key]}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-brutal-yellow/10 border-solid border-brutal-yellow">
      <div className="space-y-3">
        <p className="font-brutal font-bold text-sm">Editar Estilo Visual</p>
        {STYLE_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
            <input
              type="text"
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full border-2 border-black px-3 py-1.5 text-sm font-brutal focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
            />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Button variant="primary" size="sm" onClick={handleSave}>
            Guardar
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  )
}

const importanceColors = {
  high: 'bg-red-400',
  medium: 'bg-brutal-yellow',
  low: 'bg-gray-200',
}

const importanceLabels = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

function KeypointCard({
  suggestion,
  index,
  onUpdate,
  onAccept,
  onReject,
}: {
  suggestion: KeypointSuggestion
  index: number
  onUpdate?: (index: number, keypoint: KeypointSuggestion) => void
  onAccept: (keypoint: KeypointSuggestion) => void
  onReject: (index: number) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(suggestion)
  const [startTime, setStartTime] = useState(formatTime(suggestion.timestamp_start))
  const [endTime, setEndTime] = useState(formatTime(suggestion.timestamp_end))

  function handleSave() {
    const updated = {
      ...draft,
      timestamp_start: parseTime(startTime),
      timestamp_end: parseTime(endTime),
    }
    onUpdate?.(index, updated)
    setIsEditing(false)
  }

  function handleCancel() {
    setDraft(suggestion)
    setStartTime(formatTime(suggestion.timestamp_start))
    setEndTime(formatTime(suggestion.timestamp_end))
    setIsEditing(false)
  }

  // Use the latest suggestion data (from parent state) for display
  const display = isEditing ? draft : suggestion

  if (isEditing) {
    return (
      <Card className="bg-brutal-yellow/10 border-solid border-brutal-yellow">
        <div className="space-y-3">
          <p className="font-brutal font-bold text-sm">Editar Momento Clave</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Inicio (m:ss)</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="0:52"
                className="w-full border-2 border-black px-3 py-1.5 text-sm font-brutal focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fin (m:ss)</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="1:03"
                className="w-full border-2 border-black px-3 py-1.5 text-sm font-brutal focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Descripcion</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className="w-full border-2 border-black px-3 py-1.5 text-sm font-brutal focus:outline-none focus:ring-2 focus:ring-brutal-yellow resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sugerencia de animacion</label>
            <textarea
              value={draft.animation_suggestion}
              onChange={(e) => setDraft({ ...draft, animation_suggestion: e.target.value })}
              rows={8}
              className="w-full border-2 border-black px-3 py-1.5 text-sm font-brutal font-mono focus:outline-none focus:ring-2 focus:ring-brutal-yellow resize-y"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm" onClick={handleSave}>
              Guardar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-brutal-lg transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-brutal font-bold">
            {formatTime(display.timestamp_start)} - {formatTime(display.timestamp_end)}
          </span>
          <div className="flex items-center gap-2">
            <Badge
              className={importanceColors[display.importance]}
              variant="pending"
            >
              {importanceLabels[display.importance]}
            </Badge>
          </div>
        </div>

        <div>
          <p className="font-semibold text-sm text-gray-700">Descripcion:</p>
          <p className="text-sm">{display.description}</p>
        </div>

        <div>
          <p className="font-semibold text-sm text-gray-700">Sugerencia de animacion:</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{display.animation_suggestion}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="primary" size="sm" onClick={() => onAccept(display)}>
            Aceptar
          </Button>
          {onUpdate && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => onReject(index)}>
            Rechazar
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function KeypointSuggestions({ suggestions, visualStyle, onStyleChange, onUpdate, onAccept, onReject }: Props) {
  if (suggestions.length === 0) {
    return (
      <Card>
        <p className="text-gray-600 text-center py-8">No hay sugerencias disponibles</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {visualStyle && onStyleChange && (
        <VisualStyleEditor style={visualStyle} onChange={onStyleChange} />
      )}

      {suggestions.map((suggestion, index) => (
        <KeypointCard
          key={index}
          suggestion={suggestion}
          index={index}
          onUpdate={onUpdate}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </div>
  )
}
