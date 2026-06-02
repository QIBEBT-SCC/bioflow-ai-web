import type { Edge, Node } from '@xyflow/react'
import type { User } from '@/types/auth'

export enum Status {
  WAITING = 0,
  RUNNING = 1,
  ERROR = 2,
  SUCCESS = 3,
}

export interface Statistics {
  total: number
  waiting?: number
  running?: number
  success?: number
  error?: number
}

export interface RunData {
  status?: Status
  create_time?: string
  start_time?: string
  end_time?: string
}

export interface SimpleRunPublic {
  uid: string
  name: string
  owner: User
  status: Status
  task_statistics?: Statistics
  create_time?: string
  start_time?: string
  end_time?: string
}

export interface RunPublic extends SimpleRunPublic {
  nodes: Node[]
  edges: Edge[]
}

export interface PaginatedRuns {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: RunPublic[]
}

export type RunFileNode =
  | { type: 'file'; path: string; name: string; iconType?: 'json' }
  | { type: 'folder'; path: string; name: string; children: RunFileNode[] }
