import type { AgentName, AgentStatus } from '@/types/agent'

export type AgentFileKind = 'plan' | 'samples' | 'diagnosis' | 'update'

export interface AgentFile {
  id: string
  kind: AgentFileKind
  name: string
  project_id: number
  run_uid: string | null
  agent_name: AgentName | null
  run_status: AgentStatus | null
  size: number
  updated_at: string
  content_type: string
  revision: string
  editable: boolean
  read_only_reason:
    | 'active_agent_run'
    | 'managed_sample_summary'
    | 'immutable_audit_record'
    | null
}
