'use client'

import { WorkflowIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AttachmentChip } from '@/components/chat/attachment-chip'
import type { AgentWorkflowNodePart } from '@/types/agent'

export function AgentWorkflowNode({ node }: { node: AgentWorkflowNodePart }) {
  const t = useTranslations('Chat.node')
  const meta = [
    t('type', { type: node.node_type }),
    ...node.subgraph_labels,
  ].join(' / ')
  return (
    <AttachmentChip
      icon={<WorkflowIcon />}
      iconClassName='bg-primary/10 text-primary'
      title={node.name}
      meta={meta}
    />
  )
}
