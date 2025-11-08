import type { User } from '@/types/auth'
import type { Status } from '@/types/run'

interface ToolInfo4Task {
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
  owner: User
  run_instance: {
    uid: string
    name: string
  }
  status: Status
  create_time?: string
  start_time?: string
  end_time?: string
}

export interface TaskPublic extends SimpleTaskPublic {
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
