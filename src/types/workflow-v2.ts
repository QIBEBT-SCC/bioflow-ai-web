import type { Edge } from '@xyflow/react'
import type { WorkflowNode } from '@/types/workflow'

export enum WorkflowRunStatusV2 {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum NodeRunStatusV2 {
  PENDING = 'pending',
  READY = 'ready',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export interface NodeRunStatisticsV2 {
  total: number
  pending: number
  ready: number
  queued: number
  running: number
  succeeded: number
  failed: number
  blocked: number
}

export interface WorkflowRunStatisticsV2 {
  total: number
  pending: number
  running: number
  succeeded: number
  failed: number
}

export interface NodeRunDataV2 {
  uid: string
  status: NodeRunStatusV2
  create_time?: string | null
  start_time?: string | null
  end_time?: string | null
}

export interface WorkflowRunV2 {
  uid: string
  generation: number
  name: string
  owner_id: number
  project_id: number | null
  workflow_uid: string | null
  sample_uid: string | null
  base_dir: string
  status: WorkflowRunStatusV2
  settled: boolean
  create_time: string | null
  start_time: string | null
  end_time: string | null
  nodes: WorkflowNode[]
  edges: Edge[]
  node_statistics: NodeRunStatisticsV2
}

export interface PaginatedWorkflowRunsV2 {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: WorkflowRunV2[]
}

export interface ProjectWorkflowRunRequestV2 {
  sample_uids?: string[]
  run_name_prefix?: string
}

export interface NodeRunRecordV2 {
  uid: string
  run_uid: string
  run_name: string
  generation: number
  definition_node_id: string
  node_type: string
  name: string
  status: NodeRunStatusV2
  owner_id: number
  owner_username: string
  project_id: number | null
  workflow_uid: string | null
  sample_uid: string | null
  create_time: string | null
  start_time: string | null
  end_time: string | null
}

export interface NodeRunV2 extends NodeRunRecordV2 {
  track_progress: boolean
  tool_uid: string | null
  tool_name: string | null
  tool_description: string | null
  base_dir: string | null
  commands: string | null
  error_message: string | null
  tool_output?: {
    result?: Record<string, unknown>
    log?: string | null
    reports?: Record<string, unknown>
  } | null
  system: string | null
  hostname: string | null
  worker_id: string | null
  queued_at: string | null
  heartbeat_at: string | null
}
