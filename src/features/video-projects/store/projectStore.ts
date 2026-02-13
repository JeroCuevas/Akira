import { create } from 'zustand'

interface ProjectStore {
  isCreateModalOpen: boolean
  currentTimestamp: number | null
  openCreateModal: () => void
  closeCreateModal: () => void
  setCurrentTimestamp: (timestamp: number | null) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  isCreateModalOpen: false,
  currentTimestamp: null,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  setCurrentTimestamp: (timestamp) => set({ currentTimestamp: timestamp }),
}))
