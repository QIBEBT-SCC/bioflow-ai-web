import {
  FlaskConicalIcon,
  HammerIcon,
  type LucideIcon,
  MessageSquareTextIcon,
  TestTubeDiagonalIcon,
  WrenchIcon,
} from 'lucide-react'
import type { AgentName } from '@/types/agent'

/** Display order of agents in command menus and the empty state. */
export const AGENT_NAMES: AgentName[] = [
  'workflow-builder',
  'workflow-assistant',
  'workflow-fixer',
  'sample-manager',
  'tool-generator',
]

export const AGENT_ICONS: Record<AgentName, LucideIcon> = {
  'workflow-builder': FlaskConicalIcon,
  'workflow-assistant': MessageSquareTextIcon,
  'workflow-fixer': HammerIcon,
  'sample-manager': TestTubeDiagonalIcon,
  'tool-generator': WrenchIcon,
}
