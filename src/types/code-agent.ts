import type { CodeNodeType } from '@/types/code'

export type CodingAgentProvider = 'codex' | 'opencode'

export interface CodingAgentProviderAvailability {
  provider: CodingAgentProvider
  name: string
  available: boolean
}

export interface CodingAgentAvailability {
  available: boolean
  provider: 'codex'
  name: 'Codex'
  providers?: CodingAgentProviderAvailability[]
}

export interface CodexLogin {
  id: string
  status: 'starting' | 'waiting' | 'completed' | 'failed' | 'cancelled'
}

export interface CodeAgentSession {
  id: string
  status: 'starting' | 'ready' | 'running' | 'proposal' | 'closed' | 'failed'
}

export interface CodeAgentTurn {
  prompt: string
  source: string
  dependencies: string[]
}

export interface CodeAgentProposal {
  id: string
  base_hash: string
  source: string
  dependencies: string[]
  diff: string
  warnings: string[]
}

export interface CodeAgentSessionCreate {
  node_type: CodeNodeType
  provider?: CodingAgentProvider
}

export interface CodexAgentSettings {
  sandbox_mode: 'read-only' | 'workspace-write' | 'danger-full-access'
  web_search: 'live' | 'cached' | 'disabled'
  network_access: boolean
}

export interface CodeAgentConfigChoice {
  value: string
  name: string
}

export interface CodeAgentConfigOption {
  id: string
  name: string
  category?: string
  type: string
  currentValue: string
  options: Array<
    CodeAgentConfigChoice | { name: string; options: CodeAgentConfigChoice[] }
  >
}
