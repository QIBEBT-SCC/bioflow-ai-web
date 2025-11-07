import type { Status, UserPublic } from './workflow'

export interface RunInfo4Task {
  uid: string
  name: string
}

export interface ToolInfo4Task {
  uid: string
  name: string
  description: string
}

export interface ToolOutput {
  result?: Record<string, unknown>
  log?: string
  reports?: Record<string, unknown>
}

export interface SimpleTaskPublic {
  uid: string
  name: string
  owner: UserPublic
  run_instance: RunInfo4Task
  status: Status
  create_time?: string
  start_time?: string
  end_time?: string
}

export interface TaskPublic extends SimpleTaskPublic {
  instance_uid: string
  tool: ToolInfo4Task
  commands?: string
  tool_output?: ToolOutput
  system?: string
  hostname?: string
}

export interface MonitorPublic {
  cpu_usage: number
  mem_usage: number
  mem_used: number
  io_in: number
  io_out: number
  time: string
}

