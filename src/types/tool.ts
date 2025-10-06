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

export interface SimpleToolInfo {
  uid: string
  name: string
  description: string
  tool_type: ToolType
  group_id?: number
  image: ToolImage
  tags: ToolTag[]
}

