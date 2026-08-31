export type CodeNodeType = 'code_bash' | 'code_python' | 'code_R'

export interface SimpleCodeInfo {
  uid: string
  name: string
  description: string
  node_type: CodeNodeType
}

export interface CodeInfo extends SimpleCodeInfo {
  code: string
  dependencies: string[]
}

export interface CodeCreate {
  name: string
  description: string
  node_type: CodeNodeType
  code: string
  dependencies: string[]
}

export interface CodeUpdate {
  name?: string
  description?: string
  code?: string
  dependencies?: string[]
}

export interface CodeMetadataRequest {
  node_type: CodeNodeType
  code: string
  dependencies: string[]
}

export interface CodeMetadata {
  name: string
  description: string
}

export interface PaginatedCodes {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: SimpleCodeInfo[]
}
