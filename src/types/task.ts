export interface ToolOutput {
  result?: Record<string, unknown>
  log?: string
  reports?: Record<string, unknown>
}

export interface MonitorPublic {
  cpu_usage: number
  mem_usage: number
  mem_used: number
  io_in: number
  io_out: number
  time: string
}
