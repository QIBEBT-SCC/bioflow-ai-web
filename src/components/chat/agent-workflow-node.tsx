'use client'

import { WorkflowIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import type { AgentWorkflowNodePart } from '@/types/agent'

export function AgentWorkflowNode({
  node,
  actions,
}: {
  node: AgentWorkflowNodePart
  actions?: ReactNode
}) {
  const t = useTranslations('Chat.node')
  const meta = [
    t('type', { type: node.node_type }),
    ...node.subgraph_labels,
  ].join(' / ')
  return (
    <Attachment size='sm' className='max-w-52'>
      <AttachmentMedia className='bg-primary/10 text-primary'>
        <WorkflowIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle title={node.name}>{node.name}</AttachmentTitle>
        <AttachmentDescription title={meta}>{meta}</AttachmentDescription>
      </AttachmentContent>
      {actions && <AttachmentActions>{actions}</AttachmentActions>}
    </Attachment>
  )
}
