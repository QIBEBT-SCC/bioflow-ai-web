'use client'

import {
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  RotateCcwIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AgentImage } from '@/components/chat/agent-image'
import { AgentPDF } from '@/components/chat/agent-pdf'
import { AgentWorkflowNode } from '@/components/chat/agent-workflow-node'
import {
  AttachmentChip,
  AttachmentRemoveButton,
} from '@/components/chat/attachment-chip'
import { Button } from '@/components/ui/button'
import type { ChatAttachmentDraft } from '@/hooks/use-chat-attachment'
import type { AgentWorkflowNodePart } from '@/types/agent'

function PendingDraft({
  draft,
  disabled,
  onRetry,
}: {
  draft: ChatAttachmentDraft
  disabled: boolean
  onRetry: (id: string) => void
}) {
  const t = useTranslations('Chat.images')
  const isPDF = /\.pdf$/i.test(draft.filename)
  const Icon = isPDF ? FileTextIcon : ImageIcon

  if (draft.error) {
    return (
      <AttachmentChip
        icon={<Icon />}
        iconClassName='bg-destructive/10 text-destructive'
        title={draft.filename}
        meta={draft.error}
        metaClassName='text-destructive'
        className='border-destructive/30'
        action={
          draft.file && (
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              disabled={disabled}
              aria-label={t('retry')}
              title={t('retry')}
              onClick={() => onRetry(draft.id)}
            >
              <RotateCcwIcon />
            </Button>
          )
        }
      />
    )
  }

  return (
    <div aria-live='polite'>
      <AttachmentChip
        icon={<Loader2Icon className='animate-spin' />}
        iconClassName='bg-muted text-muted-foreground'
        title={draft.filename}
        meta={t(isPDF ? 'pdf_parsing' : 'preparing')}
      />
    </div>
  )
}

export function DraftAttachments({
  drafts,
  onRemove,
  onRetry,
  disabled,
  node,
  onRemoveNode,
}: {
  drafts: ChatAttachmentDraft[]
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  disabled: boolean
  node?: AgentWorkflowNodePart | null
  onRemoveNode?: () => void
}) {
  const t = useTranslations('Chat.images')
  if (drafts.length === 0 && !node) return null
  return (
    <ul
      className='flex flex-wrap items-center gap-2.5 px-3 pt-3'
      aria-label={t('attachments')}
    >
      {node && (
        <li className='relative max-w-full'>
          <AgentWorkflowNode node={node} />
          <AttachmentRemoveButton
            label={t('remove', { name: node.name })}
            disabled={disabled}
            onClick={() => onRemoveNode?.()}
          />
        </li>
      )}
      {drafts.map((draft) => (
        <li key={draft.id} className='relative max-w-full'>
          {draft.image ? (
            <AgentImage image={draft.image} variant='thumb' />
          ) : draft.pdf ? (
            <AgentPDF pdf={draft.pdf} />
          ) : (
            <PendingDraft draft={draft} disabled={disabled} onRetry={onRetry} />
          )}
          <AttachmentRemoveButton
            label={t('remove', { name: draft.filename })}
            disabled={disabled}
            onClick={() => onRemove(draft.id)}
          />
        </li>
      ))}
    </ul>
  )
}
