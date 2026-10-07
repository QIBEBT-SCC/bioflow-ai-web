import type { CodeNodeType } from '@/types/code'

export type CodeAgentStatus =
  | 'ready'
  | 'queued'
  | 'running'
  | 'cancelling'
  | 'proposal'
  | 'closed'
export interface CodeAgentProposal {
  id: string
  turn_id: string
  baseline_hash: string
  source: string
  dependencies: string[]
  diff: string
  warnings: string[]
}
export interface CodeAgentMessage {
  role: 'user' | 'assistant'
  text: string
  turn_id: string
}
export interface CodeAgentTool {
  call_id: string
  turn_id: string
  name: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  detail: string
  output: string
}
export interface CodeAgentSession {
  id: string
  node_type: CodeNodeType
  status: CodeAgentStatus
  turn_id: string | null
  transcript: CodeAgentMessage[]
  tools: CodeAgentTool[]
  proposal: CodeAgentProposal | null
  error: string | null
  last_event_id: string
}
export interface CodeAgentEvent {
  id: string
  type: string
  data: Record<string, unknown>
}
export interface CodeAgentBaseline {
  source: string
  dependencies: string[]
}
export interface CodeAgentAvailability {
  available: boolean
  model_name: string | null
}
