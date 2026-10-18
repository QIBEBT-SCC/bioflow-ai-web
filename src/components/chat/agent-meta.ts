import {
  ClipboardListIcon,
  FlaskConicalIcon,
  HammerIcon,
  type LucideIcon,
  MessageSquareTextIcon,
  WrenchIcon,
} from 'lucide-react'
import type { AgentName } from '@/types/agent'

/** Display order of agents in command menus and the empty state. */
export const AGENT_NAMES: AgentName[] = [
  'workflow-builder',
  'workflow-assistant',
  'workflow-fixer',
  'project-planner',
  'tool-generator',
]

export const AGENT_ICONS: Record<AgentName, LucideIcon> = {
  'workflow-builder': FlaskConicalIcon,
  'workflow-assistant': MessageSquareTextIcon,
  'workflow-fixer': HammerIcon,
  'project-planner': ClipboardListIcon,
  'tool-generator': WrenchIcon,
}
