import type { CodeNodeType } from '@/types/code'

export interface CodingAgentAvailability {
  available: boolean
  provider: 'codex'
  name: 'Codex'
}

export interface CodingAgentLogin {
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
}
