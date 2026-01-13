export enum ToolType {
  DOCKER = 0,
  COMMAND_LINE = 1,
}

export interface ToolTag {
  id: number
  name: string
}

export interface ToolGroup {
  id: number
  name: string
  parent_id?: number | null
  tool_count: number
}

export interface ImageConfig {
  registry: string
  namespace: string
  repository: string
  tag: string
}

export interface ToolImage {
  uid?: string
  name: string
  version: string
  description: string
  homepage: string
  paper_link: string
  image: ImageConfig
}

export interface ToolImagePublic {
  uid: string
  name: string
  version: string
  description: string
  homepage: string
  paper_link: string
  image: ImageConfig

  tools: SimpleToolInfo[]
}

// 参数定义接口
export interface ParamDefine {
  description?: string
  command: string
  is_position: boolean
  index?: number
  required: boolean
}

// 输出文件接口
export interface FileMount {
  name: string
  description?: string
  file_path: string
  file_type: 'INPUT' | 'OUTPUT'
  is_report: boolean
  is_log: boolean
  mount_path: string
}

export interface ToolHelpDoc {
  uid?: string
  help_command: string
  description?: string
  content: string
}

export interface SimpleToolDoc {
  uid: string
  help_command: string
}

export interface AiGenRequest {
  name: string
  description: string
  image_uid: string
}

// 工具创建接口
export interface DockerToolCreate {
  name: string
  image_uid: string
  description: string
  help_doc_uid: string
  group_id: number
  tags: ToolTag[]
  command_template: string
  dynamic_params: ParamDefine[]
  immutable_static_params?: string | null
  modifiable_static_params?: string | null
  file_mounts: FileMount[]
}

export interface SimpleToolInfo {
  uid: string
  name: string
  description: string
  tool_type: ToolType
  group_id?: number
  image: ToolImage
  tags: ToolTag[]
}

export interface ToolInfo {
  id: number
  uid: string
  name: string
  description: string
  tool_type: ToolType
  group_id?: number
  command_template: string
  dynamic_params: ParamDefine[]
  immutable_static_params?: string | null
  modifiable_static_params?: string | null
  file_mounts: FileMount[]
  complete_command: string
  tags: ToolTag[]
  help_doc: ToolHelpDoc
  image: ToolImage
}

export interface ToolInfo4Task {
  id: number
  name: string
  description: string
  file_mounts: FileMount[]
}

export interface AIGenProp {
  name: string
  description: string
  help_command: string
  repository: string
  tag?: string
}

export enum EventType {
  LOADING = 'loading',
  ERROR = 'error',
  GENERATING = 'generating',
  SUCCESS = 'success',
}

export interface ToolSSEEventData {
  event: EventType
  data: string | AIGenTool
}

// AI生成的工具配置结果类型
export interface AIGenTool {
  name: string
  description: string
  command_template: string
  dynamic_params: ParamDefine[]
  immutable_static_params?: string | null
  modifiable_static_params?: string | null
  file_mounts: FileMount[]
}
