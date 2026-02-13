import { create } from 'zustand'

interface KeypointSuggestion {
  timestamp_start: number
  timestamp_end: number
  description: string
  animation_suggestion: string
  importance: 'high' | 'medium' | 'low'
}

interface AnimationStore {
  selectedKeypoints: KeypointSuggestion[]
  isGenerating: boolean
  addKeypoint: (keypoint: KeypointSuggestion) => void
  removeKeypoint: (index: number) => void
  clearKeypoints: () => void
  setIsGenerating: (generating: boolean) => void
}

export const useAnimationStore = create<AnimationStore>((set) => ({
  selectedKeypoints: [],
  isGenerating: false,

  addKeypoint: (keypoint) =>
    set((state) => ({
      selectedKeypoints: [...state.selectedKeypoints, keypoint],
    })),

  removeKeypoint: (index) =>
    set((state) => ({
      selectedKeypoints: state.selectedKeypoints.filter((_, i) => i !== index),
    })),

  clearKeypoints: () =>
    set({
      selectedKeypoints: [],
    }),

  setIsGenerating: (generating) =>
    set({
      isGenerating: generating,
    }),
}))
