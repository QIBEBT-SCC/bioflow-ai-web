import type { Edge, Node } from '@xyflow/react'

export enum WorkflowType {
  SUBMODULE = 0,
  TEMPLATE = 1,
}

export enum ExecutionScope {
  SAMPLE_LEVEL = 0,
  PROJECT_LEVEL = 1,
}

export interface WorkflowDefinition {
  nodes: Node[]
  edges: Edge[]
}

export interface Workflow {
  name: string
  workflow: WorkflowDefinition
  public: boolean
  wf_type: WorkflowType
  execution_scope?: ExecutionScope
}

export interface SimpleWorkflowInfo {
  uid: string
  name: string
  execution_scope?: ExecutionScope
}
