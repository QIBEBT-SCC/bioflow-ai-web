'use client'

import { WorkflowIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AgentWorkflowNodePart } from '@/types/agent'

export function AgentWorkflowNode({ node }: { node: AgentWorkflowNodePart }) {
  const t = useTranslations('Chat.node')
  return (
    <div className='flex max-w-72 items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs'>
      <WorkflowIcon className='size-4 shrink-0 text-muted-foreground' />
      <div className='min-w-0'>
        <p className='truncate' title={node.name}>
          {node.name}
        </p>
        <p className='text-muted-foreground'>
          {t('type', { type: node.node_type })}
        </p>
        {node.subgraph_labels.length > 0 && (
          <p
            className='truncate text-muted-foreground'
            title={node.subgraph_labels.join(' / ')}
          >
            {node.subgraph_labels.join(' / ')}
          </p>
        )}
      </div>
    </div>
  )
}
