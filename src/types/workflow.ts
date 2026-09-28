import type { Edge, Node, XYPosition } from '@xyflow/react'

export enum WorkflowType {
  SUBMODULE = 0,
  TEMPLATE = 1,
}

export enum ExecutionScope {
  SAMPLE_LEVEL = 0,
  PROJECT_LEVEL = 1,
}

export type WorkflowNode = Omit<Node, 'position'> & {
  position?: XYPosition | null
}

export interface PortTarget {
  node_id: string
  handle: string
}
export interface InterfaceInput {
  id: string
  name: string
  description: string
  targets: PortTarget[]
}
export interface InterfaceOutput {
  id: string
  name: string
  description: string
  source: PortTarget
}
export interface WorkflowInterface {
  positions?: { inputs: XYPosition; outputs: XYPosition }
  inputs: InterfaceInput[]
  outputs: InterfaceOutput[]
}

export interface WorkflowDefinition {
  interface?: WorkflowInterface | null
  nodes: WorkflowNode[]
  edges: Edge[]
}

export interface Workflow {
  name: string
  description: string
  workflow: WorkflowDefinition
  public: boolean
  wf_type: WorkflowType
  execution_scope?: ExecutionScope
}

export interface SimpleWorkflowInfo {
  wf_type: WorkflowType
  uid: string
  name: string
  description: string
  execution_scope: ExecutionScope
  inputs: WorkflowPortSummary[]
  outputs: WorkflowPortSummary[]
}

export interface WorkflowSearchResult extends SimpleWorkflowInfo {
  relevance_score: number
}

export interface WorkflowPortSummary {
  id: string
  name: string
  description: string
}

export interface PaginatedWorkflows {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: SimpleWorkflowInfo[]
}
