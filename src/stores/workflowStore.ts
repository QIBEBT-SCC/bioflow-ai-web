import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface WorkflowStore {
  refreshInterval: string
  setRefreshInterval: (time: string) => void
}

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    (set) => ({
      refreshInterval: 'off',
      setRefreshInterval: (time) => {
        set({ refreshInterval: time })
      },
    }),
    { name: 'workflow-store' },
  ),
)
