'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ToolImage } from '@/types/tool'
import type { ToolConfigValues } from '@/components/tool/tool-config-form'

interface CreateToolStore {
  currentImage: ToolImage
  toolConfig: ToolConfigValues

  setCurrentImage: (image: ToolImage) => void
  setToolConfig: (toolConfig: ToolConfigValues) => void
  updateToolConfigField: <K extends keyof ToolConfigValues>(
    field: K,
    value: ToolConfigValues[K],
  ) => void
  resetStore: () => void
}

const initialImage: ToolImage = {
  name: '',
  version: '',
  description: '',
  homepage: '',
  paper_link: '',
  image: {
    registry: 'docker.io',
    namespace: 'library',
    repository: '',
    tag: 'latest',
  },
}

const initialToolConfig: ToolConfigValues = {
  name: '',
  image_uid: '',
  description: '',
  help_command: '',
  group_id: 1,
  tags: [],
  command_template: '',
  dynamic_params: [],
  immutable_static_params: null,
  modifiable_static_params: null,
  file_mounts: [],
}

export const useCreateToolStore = create<CreateToolStore>()(
  devtools(
    (set) => ({
      currentImage: initialImage,
      toolConfig: initialToolConfig,

      setCurrentImage: (image: ToolImage) => {
        set((state) => ({
          currentImage: image,
          toolConfig: {
            ...state.toolConfig,
            image_uid: image.uid || '',
            name: image.name,
          },
        }))
      },
      setToolConfig: (toolConfig: ToolConfigValues) => {
        set({ toolConfig })
      },
      updateToolConfigField: (field, value) => {
        set((state) => ({
          toolConfig: {
            ...state.toolConfig,
            [field]: value,
          },
        }))
      },
      resetStore: () => {
        set({ currentImage: initialImage, toolConfig: initialToolConfig })
      },
    }),
    { name: 'create-tool-store' }
  )
)

interface ToolNodeStore {
  currentGroupId?: number
  setCurrentGroupId: (id?: number) => void
}

export const useToolNodeStore = create<ToolNodeStore>((set) => ({
  currentGroupId: undefined,
  setCurrentGroupId: (id) => set({ currentGroupId: id }),
}))

