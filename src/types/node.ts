import type { ToolTag, ToolType } from '@/types/tool'

export interface HandleDefine {
  id?: string
  label?: string
  name: string
  description: string
  shared_writable?: boolean
}

export interface ToolArgPublic {
  tool_type: ToolType
  uid: string
  name: string
  description: string
  tags: ToolTag[]
  input_handles: HandleDefine[]
  output_handles: HandleDefine[]
  immutable_static_params?: string | null
  modifiable_static_params?: string | null
}
