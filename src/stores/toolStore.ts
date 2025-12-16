'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DockerToolCreate, ToolImage } from '@/types/tool'

interface CreateToolStore {
  currentImage: ToolImage
  toolConfig: DockerToolCreate

  setCurrentImage: (image: ToolImage) => void
  setToolConfig: (toolConfig: DockerToolCreate) => void
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

const initialToolConfig: DockerToolCreate = {
  name: '',
  image_uid: '',
  description: '',
  help_doc_uid: '',
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
      setToolConfig: (toolConfig: DockerToolCreate) => {
        set({ toolConfig })
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

