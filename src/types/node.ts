import type { ToolTag } from '@/types/tool'

export interface HandleDefine {
  name: string
  description: string
}

export interface ToolArgPublic {
  uid: string
  name: string
  description: string
  tags: ToolTag[]
  input_handles: HandleDefine[]
  output_handles: HandleDefine[]
  immutable_static_params?: string | null
  modifiable_static_params?: string | null
}
