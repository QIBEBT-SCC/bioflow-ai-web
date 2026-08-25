export type AgentName = 'workflow-builder' | 'sample-manager' | 'tool-generator'

export type AgentStatus =
  | 'queued'
  | 'running'
  | 'waiting_input'
  | 'cancel_requested'
  | 'cancelled'
  | 'completed'
  | 'failed'

export type AgentEventType =
  | 'run.queued'
  | 'run.started'
  | 'run.progress'
  | 'run.interrupted'
  | 'resource.changed'
  | 'run.cancel_requested'
  | 'run.cancelled'
  | 'run.completed'
  | 'run.failed'

export interface AgentTextPart {
  type: 'text'
  text: string
}

export type AgentMessagePart = AgentTextPart

export interface AgentMessage {
  uid: string
  session_uid: string
  run_uid: string
  role: 'user' | 'assistant'
  parts: AgentMessagePart[]
  create_time: string
}

export interface AgentInterrupt {
  kind?: string
  question?: string
  questions?: AgentQuestion[]
  message?: string
  plan?: string
  [key: string]: unknown
}

export interface AgentQuestion {
  question: string
  choices: string[]
}

export interface AgentQuestionAnswer {
  question: string
  answer: string
}

export interface AgentToolArtifact {
  type: 'tool'
  uid: string
  name?: string | null
  description?: string | null
}

export interface AgentResult {
  artifacts?: AgentToolArtifact[]
  tool_uid?: string
  name?: string | null
  [key: string]: unknown
}

export interface AgentRun {
  uid: string
  session_uid: string
  project_id: number | null
  agent_name: AgentName
  status: AgentStatus
  interrupt_payload: AgentInterrupt | null
  result_payload: AgentResult | null
  error_code: string | null
  error_message: string | null
  cancel_requested: boolean
  heartbeat_at: string | null
  retry_of_uid: string | null
  create_time: string
  start_time: string | null
  end_time: string | null
  update_time: string
}

export interface AgentSession {
  uid: string
  owner_id: number
  project_id: number | null
  title: string
  create_time: string
  update_time: string
  latest_run: AgentRun | null
}

export interface AgentSessionPage {
  limit: number
  has_more: boolean
  next_cursor: string | null
  data: AgentSession[]
}

export interface AgentEvent {
  id: number
  run_uid: string
  event_type: AgentEventType
  payload: Record<string, unknown>
  create_time: string
}

export const ACTIVE_AGENT_STATUSES: AgentStatus[] = [
  'queued',
  'running',
  'waiting_input',
  'cancel_requested',
]

export const STREAMING_AGENT_STATUSES: AgentStatus[] = [
  'queued',
  'running',
  'cancel_requested',
]
